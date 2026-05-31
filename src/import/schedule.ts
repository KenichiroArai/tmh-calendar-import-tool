import { LOG_SHEET_NAME } from "../constants";
import { getRequiredConfig } from "../config/scriptProperties";
import { writeLog } from "../logging/writeLog";
import { createDocuments, getText } from "../drive/document";
import { getTagetFileIds } from "../drive/targets";
import { deleteFileByName, moveFileToFolder } from "../drive/files";
import { saveNormalizedTextFile } from "../drive/text";
import { createCalendarImportFile } from "../calendar/parser";
import { importCSVtoCalendar } from "../calendar/import";
import { extractIdFromUrl } from "../utils/url";

export type ScheduleImportMode =
  | "all"
  | "createDocumentsOnly"
  | "importOnly"
  | "moveOnly";

export interface ScheduleImportRunOptions {
  mode: ScheduleImportMode;
  manualDocumentUrls: string[];
}

export const DEFAULT_SCHEDULE_IMPORT_RUN: ScheduleImportRunOptions = {
  mode: "all",
  manualDocumentUrls: [],
};

interface ScheduleImportContext {
  importTargetFolderId: string;
  importCompletedFolderId: string;
  intermediateFileGenerationFolderId: string;
  calendarId: string;
}

interface ScheduleImportState {
  hasError: boolean;
  hasWarning: boolean;
}

function prepareLogSheet(): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(LOG_SHEET_NAME);
  if (!logSheet) {
    throw new Error(
      "ログシートが見つかりません。シート名「" + LOG_SHEET_NAME + "」を確認してください。",
    );
  }
  logSheet.clear();
  writeLog("---------- カレンダーインポートツールを開始します。 ----------");
}

function loadScheduleImportContext(): ScheduleImportContext {
  let result: ScheduleImportContext = {
    importTargetFolderId: "",
    importCompletedFolderId: "",
    intermediateFileGenerationFolderId: "",
    calendarId: "",
  };

  result = {
    importTargetFolderId: getRequiredConfig("IMPORT_TARGET_FOLDER_ID"),
    importCompletedFolderId: getRequiredConfig("IMPORT_COMPLETED_FOLDER_ID"),
    intermediateFileGenerationFolderId: getRequiredConfig(
      "INTERMEDIATE_FILE_GENERATION_FOLDER_ID",
    ),
    calendarId: getRequiredConfig("CALENDAR_ID"),
  };
  return result;
}

function logScheduleImportContext(ctx: ScheduleImportContext): void {
  writeLog("----- 設定情報を取得します。 -----");
  writeLog(`インポート対象フォルダID：[${ctx.importTargetFolderId}]`);
  writeLog(`インポート完了フォルダID：[${ctx.importCompletedFolderId}]`);
  writeLog(
    `中間ファイル生成フォルダID：[${ctx.intermediateFileGenerationFolderId}]`,
  );
  writeLog(`カレンダーID：[${ctx.calendarId}]`);
  writeLog("----- 設定情報を取得しました。 -----");
}

function finishScheduleImport(state: ScheduleImportState): void {
  writeLog(
    "---------- カレンダーインポートツールが全て終了しました。 ----------",
  );

  if (state.hasError) {
    Browser.msgBox(
      "失敗",
      "スケジュールのインポートに失敗しました。ログを確認してください。",
      Browser.Buttons.OK,
    );
    return;
  }
  if (state.hasWarning) {
    Browser.msgBox(
      "警告",
      "スケジュールのインポートに警告がありました。ログを確認してください。",
      Browser.Buttons.OK,
    );
    return;
  }
  Browser.msgBox(
    "成功",
    "スケジュールのインポートに成功しました。",
    Browser.Buttons.OK,
  );
}

function runScheduleImportPhase(
  phase: (ctx: ScheduleImportContext, state: ScheduleImportState) => void,
): void {
  const state: ScheduleImportState = { hasError: false, hasWarning: false };

  prepareLogSheet();

  try {
    const ctx = loadScheduleImportContext();
    logScheduleImportContext(ctx);
    phase(ctx, state);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    writeLog("エラーが発生しました: " + message);
    state.hasError = true;
  } finally {
    finishScheduleImport(state);
  }
}

/**
 * フェーズ1: インポート対象からドキュメントを作成する。
 * @returns 変換済みドキュメントのファイルID。対象がなければ null。
 */
function createConvertedDocuments(
  ctx: ScheduleImportContext,
  state: ScheduleImportState,
): string[] | null {
  let result: string[] | null = null;

  writeLog("----- ドキュメントを作成します。 -----");
  const convertedFileIds = createDocuments(
    ctx.importTargetFolderId,
    ctx.intermediateFileGenerationFolderId,
  );
  if (convertedFileIds.length <= 0) {
    writeLog("インポート対象に該当ファイルがありません。");
    state.hasWarning = true;
    return result;
  }
  writeLog(`変換ドキュメント数：[${convertedFileIds.length}]`);
  writeLog("----- ドキュメントを作成しました。 -----");
  result = convertedFileIds;
  return result;
}

/**
 * フェーズ2: 変換済みドキュメントをカレンダーへインポートする。
 */
function importConvertedDocumentsToCalendar(
  ctx: ScheduleImportContext,
  state: ScheduleImportState,
  convertedFileIds: string[],
  saveNormalizedText: boolean,
): void {
  writeLog("----- カレンダーへインポートします。 -----");
  for (const convertedFileId of convertedFileIds) {
    const documentFile = DriveApp.getFileById(convertedFileId);
    writeLog(
      `--- ファイル名：[${documentFile.getName()}], ファイルID：[${convertedFileId}] の処理 ---`,
    );
    writeLog("開始します。");
    try {
      const text = getText(convertedFileId);
      if (saveNormalizedText) {
        const normalizedTextFileId = saveNormalizedTextFile(
          documentFile.getName(),
          text,
          ctx.intermediateFileGenerationFolderId,
        );
        writeLog(`正規化テキストファイルID：[${normalizedTextFileId}]`);
      }
      const fileName = documentFile.getName() + ".csv";

      deleteFileByName(fileName);

      const fileId = createCalendarImportFile(
        ctx.importTargetFolderId,
        fileName,
        text,
        ctx.intermediateFileGenerationFolderId,
      );
      writeLog(`CSVファイルID：[${fileId}]`);
      importCSVtoCalendar(fileId, ctx.calendarId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      writeLog("エラーが発生しました: " + message);
      state.hasWarning = true;
      continue;
    }
    writeLog("終了しました。");
  }
  writeLog("----- カレンダーへインポートしました。 -----");
}

/**
 * フェーズ3: インポート対象ファイルを完了フォルダへ移動する。
 */
function resolveConvertedFileIds(urlsOrIds: string[]): string[] {
  let result: string[] = [];

  result = urlsOrIds.map((entry) => {
    let id: string = entry;
    if (entry.includes("/d/")) {
      id = extractIdFromUrl(entry);
    }
    return id;
  });
  return result;
}

function moveImportTargetsToCompleted(
  ctx: ScheduleImportContext,
): void {
  writeLog("----- インポート対象ファイルを移動します。 -----");
  const tagetFileIds = getTagetFileIds(ctx.importTargetFolderId);
  for (const targetFileId of tagetFileIds) {
    moveFileToFolder(targetFileId, ctx.importCompletedFolderId);
    writeLog(
      `ファイルID：[${targetFileId}] をインポート完了フォルダへ移動しました。`,
    );
  }
  writeLog("----- インポート対象ファイルを移動しました。 -----");
}

/**
 * フェーズ1のみ: ドキュメント作成まで実行する（GAS エディタからの直接実行用）。
 */
export function importScheduleCreateDocuments(): void {
  importSchedule({
    mode: "createDocumentsOnly",
    manualDocumentUrls: [],
  });
}

/**
 * フェーズ2のみ: 指定した変換済みドキュメントIDをカレンダーへインポートする（GAS エディタからの直接実行用）。
 */
export function importScheduleToCalendar(convertedFileIds: string[]): void {
  importSchedule({
    mode: "importOnly",
    manualDocumentUrls: convertedFileIds,
  });
}

/**
 * フェーズ3のみ: インポート対象ファイルを完了フォルダへ移動する（GAS エディタからの直接実行用）。
 */
export function importScheduleMoveTargets(): void {
  importSchedule({ mode: "moveOnly", manualDocumentUrls: [] });
}

/**
 * スケジュールをインポートする。
 * メニュー経由の実行範囲は操作パネルの「モード」「ドキュメントURL」で指定する。
 */
export function importSchedule(
  run: ScheduleImportRunOptions = DEFAULT_SCHEDULE_IMPORT_RUN,
): void {
  const { mode, manualDocumentUrls } = run;

  runScheduleImportPhase((ctx, state) => {
    if (mode === "moveOnly") {
      moveImportTargetsToCompleted(ctx);
      return;
    }

    let convertedFileIds: string[] | null = null;

    if (mode === "importOnly") {
      if (manualDocumentUrls.length <= 0) {
        writeLog(
          "importOnly では manualDocumentUrls にドキュメント URL またはファイルIDを指定してください。",
        );
        state.hasWarning = true;
        return;
      }
      convertedFileIds = resolveConvertedFileIds(manualDocumentUrls);
    } else {
      convertedFileIds = createConvertedDocuments(ctx, state);
      if (!convertedFileIds) {
        return;
      }
      if (mode === "createDocumentsOnly") {
        return;
      }
    }

    importConvertedDocumentsToCalendar(
      ctx,
      state,
      convertedFileIds,
      mode === "importOnly",
    );

    if (mode === "all") {
      moveImportTargetsToCompleted(ctx);
    }
  });
}
