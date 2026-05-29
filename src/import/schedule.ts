import { LOG_SHEET_NAME } from "../constants";
import { getRequiredConfig } from "../config/scriptProperties";
import { writeLog } from "../logging/writeLog";
import { createDocuments, getText } from "../drive/document";
import { getTagetFileIds } from "../drive/targets";
import { deleteFileByName, moveFileToFolder } from "../drive/files";
import { createCalendarImportFile } from "../calendar/parser";
import { importCSVtoCalendar } from "../calendar/import";
import { extractIdFromUrl } from "../utils/url";

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
  return {
    importTargetFolderId: getRequiredConfig("IMPORT_TARGET_FOLDER_ID"),
    importCompletedFolderId: getRequiredConfig("IMPORT_COMPLETED_FOLDER_ID"),
    intermediateFileGenerationFolderId: getRequiredConfig(
      "INTERMEDIATE_FILE_GENERATION_FOLDER_ID",
    ),
    calendarId: getRequiredConfig("CALENDAR_ID"),
  };
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
  writeLog("----- ドキュメントを作成します。 -----");
  const convertedFileIds = createDocuments(
    ctx.importTargetFolderId,
    ctx.intermediateFileGenerationFolderId,
  );
  if (convertedFileIds.length <= 0) {
    writeLog("インポート対象に該当ファイルがありません。");
    state.hasWarning = true;
    return null;
  }
  writeLog(`変換ドキュメント数：[${convertedFileIds.length}]`);
  writeLog("----- ドキュメントを作成しました。 -----");
  return convertedFileIds;
}

/**
 * フェーズ2: 変換済みドキュメントをカレンダーへインポートする。
 */
function importConvertedDocumentsToCalendar(
  ctx: ScheduleImportContext,
  state: ScheduleImportState,
  convertedFileIds: string[],
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
  return urlsOrIds.map((entry) => {
    if (entry.includes("/d/")) {
      return extractIdFromUrl(entry);
    }
    return entry;
  });
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
 * フェーズ1のみ: ドキュメント作成まで実行する。
 */
export function importScheduleCreateDocuments(): void {
  runScheduleImportPhase((ctx, state) => {
    createConvertedDocuments(ctx, state);
  });
}

/**
 * フェーズ2のみ: 指定した変換済みドキュメントIDをカレンダーへインポートする。
 * デバッグ時は Script Editor から ID を渡して実行する。
 */
export function importScheduleToCalendar(convertedFileIds: string[]): void {
  runScheduleImportPhase((ctx, state) => {
    if (convertedFileIds.length <= 0) {
      writeLog("インポート対象のドキュメントIDが指定されていません。");
      state.hasWarning = true;
      return;
    }
    importConvertedDocumentsToCalendar(ctx, state, convertedFileIds);
  });
}

/**
 * フェーズ3のみ: インポート対象ファイルを完了フォルダへ移動する。
 */
export function importScheduleMoveTargets(): void {
  runScheduleImportPhase((ctx) => {
    moveImportTargetsToCompleted(ctx);
  });
}

/**
 * importSchedule の実行範囲。
 * メニューから実行する前に、作業内容に合わせて mode と manualDocumentUrls を書き換える。
 *
 * 作業手順:
 * 1. 本番（フェーズ1〜3を連続実行）
 *    - mode: "all"
 *    - manualDocumentUrls: []
 *
 * 2. フェーズ1のみ（ドキュメント作成してログのファイルIDを確認）
 *    - mode: "createDocumentsOnly"
 *    - manualDocumentUrls: []
 *
 * 3. フェーズ2のみ（作成済みドキュメントでカレンダーインポートを検証）
 *    - mode: "importOnly"
 *    - manualDocumentUrls: ["https://docs.google.com/document/d/.../edit?usp=sharing"]
 *      （ファイルIDを直接指定する場合は ID 文字列をそのまま記載可）
 *
 * 4. フェーズ3のみ（インポート対象を完了フォルダへ移動）
 *    - mode: "moveOnly"
 *    - manualDocumentUrls: []
 */
export const IMPORT_SCHEDULE_RUN_CONFIG = {
  mode: "all" as
    | "all"
    | "createDocumentsOnly"
    | "importOnly"
    | "moveOnly",
  manualDocumentUrls: [] as string[],
};

/**
 * スケジュールをインポートする。
 * 実行範囲は IMPORT_SCHEDULE_RUN_CONFIG で指定する。
 */
export function importSchedule(): void {
  const { mode, manualDocumentUrls } = IMPORT_SCHEDULE_RUN_CONFIG;

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

    importConvertedDocumentsToCalendar(ctx, state, convertedFileIds);

    if (mode === "all") {
      moveImportTargetsToCompleted(ctx);
    }
  });
}
