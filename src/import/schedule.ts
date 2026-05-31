import { LOG_SHEET_NAME } from "../constants";
import { getRequiredConfig } from "../config/scriptProperties";
import { writeLog } from "../logging/writeLog";
import { createDocuments, getText, type DocumentConversionResult } from "../drive/document";
import { scanImportTargetFolder, type ImportTargetFolderScan } from "../drive/targets";
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
  const result: ScheduleImportContext = {
    importTargetFolderId: getRequiredConfig("IMPORT_TARGET_FOLDER_ID"),
    importCompletedFolderId: getRequiredConfig("IMPORT_COMPLETED_FOLDER_ID"),
    intermediateFileGenerationFolderId: getRequiredConfig(
      "INTERMEDIATE_FILE_GENERATION_FOLDER_ID",
    ),
    calendarId: getRequiredConfig("CALENDAR_ID"),
  };
  return result;
}

function logDriveFolderSetting(label: string, folderId: string): void {
  writeLog(`${label}ID：[${folderId}]`);
  try {
    const folder = DriveApp.getFolderById(folderId);
    writeLog(`${label}名：[${folder.getName()}]`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    writeLog(
      `${label}名：取得失敗（IDが誤っているかアクセス権がありません）: ${message}`,
    );
  }
}

function logScheduleImportContext(ctx: ScheduleImportContext): void {
  writeLog("----- 設定情報を取得します。 -----");
  logDriveFolderSetting("インポート対象フォルダ", ctx.importTargetFolderId);
  logDriveFolderSetting("インポート完了フォルダ", ctx.importCompletedFolderId);
  logDriveFolderSetting(
    "中間ファイル生成フォルダ",
    ctx.intermediateFileGenerationFolderId,
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
): DocumentConversionResult[] | null {
  let result: DocumentConversionResult[] | null = null;

  writeLog("----- ドキュメントを作成します。 -----");
  const targetScan = scanImportTargetFolder(ctx.importTargetFolderId);
  writeLog(
    `インポート対象フォルダ内の画像/PDF：[${targetScan.targetFileIds.length}] 件`,
  );
  for (const skippedFile of targetScan.skippedFiles) {
    writeLog(
      `  対象外（画像/PDF以外）: ファイル名=[${skippedFile.fileName}], ID=[${skippedFile.fileId}], MIME=[${skippedFile.mimeType}]`,
    );
  }

  const conversions = createDocuments(
    ctx.importTargetFolderId,
    ctx.intermediateFileGenerationFolderId,
  );
  if (conversions.length <= 0) {
    writeLog("インポート対象に該当ファイルがありません。");
    if (targetScan.skippedFiles.length > 0) {
      writeLog(
        "（フォルダ内にファイルはありますが、画像/PDF 以外のため対象外です。IMPORT_TARGET_FOLDER_ID が正しいか確認してください。）",
      );
    } else {
      writeLog(
        "（フォルダが空か、IMPORT_TARGET_FOLDER_ID が誤っている可能性があります。設定のフォルダ名と実際の画像の場所を照合してください。）",
      );
    }
    state.hasWarning = true;
    return result;
  }
  writeLog(`変換ドキュメント数：[${conversions.length}]`);
  for (const conversion of conversions) {
    writeLog(
      `  元画像ID：[${conversion.sourceFileId}] → 変換ドキュメントID：[${conversion.convertedFileId}]`,
    );
  }
  writeLog("----- ドキュメントを作成しました。 -----");
  result = conversions;
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
  const result: string[] = [];

  for (const entry of urlsOrIds) {
    let id: string = entry;
    if (entry.includes("/d/")) {
      id = extractIdFromUrl(entry);
    }
    result.push(id);
  }

  return result;
}

function logSkippedTargetFiles(
  importTargetFolderId: string,
): ImportTargetFolderScan {
  const result = scanImportTargetFolder(importTargetFolderId);
  for (const skippedFile of result.skippedFiles) {
    writeLog(
      `  対象外（画像/PDF以外）: ファイル名=[${skippedFile.fileName}], ID=[${skippedFile.fileId}], MIME=[${skippedFile.mimeType}]`,
    );
  }
  return result;
}

function moveImportTargetsToCompleted(
  ctx: ScheduleImportContext,
  state: ScheduleImportState,
  sourceFileIds?: string[],
): void {
  writeLog("----- インポート対象ファイルを移動します。 -----");

  let targetFolderName: string = "";
  try {
    targetFolderName = DriveApp.getFolderById(ctx.importTargetFolderId).getName();
    writeLog(
      `移動元フォルダ：[${targetFolderName}]（ID: ${ctx.importTargetFolderId}）`,
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    writeLog(
      `エラー: インポート対象フォルダID [${ctx.importTargetFolderId}] にアクセスできません: ${message}`,
    );
    writeLog(
      "Script Properties の IMPORT_TARGET_FOLDER_ID を確認してください。",
    );
    state.hasWarning = true;
    writeLog("----- インポート対象ファイルの移動を中断しました。 -----");
    return;
  }

  let completedFolderName: string = "";
  try {
    completedFolderName = DriveApp.getFolderById(
      ctx.importCompletedFolderId,
    ).getName();
    writeLog(
      `移動先フォルダ：[${completedFolderName}]（ID: ${ctx.importCompletedFolderId}）`,
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    writeLog(
      `エラー: インポート完了フォルダID [${ctx.importCompletedFolderId}] にアクセスできません: ${message}`,
    );
    writeLog(
      "Script Properties の IMPORT_COMPLETED_FOLDER_ID を確認してください。",
    );
    state.hasWarning = true;
    writeLog("----- インポート対象ファイルの移動を中断しました。 -----");
    return;
  }

  let tagetFileIds: string[] = [];
  if (sourceFileIds && sourceFileIds.length > 0) {
    tagetFileIds = sourceFileIds;
    writeLog(
      `移動対象（OCR変換済みの元画像）: [${tagetFileIds.length}] 件`,
    );
  } else {
    const targetScan = logSkippedTargetFiles(ctx.importTargetFolderId);
    tagetFileIds = targetScan.targetFileIds;
    writeLog(
      `移動対象（フォルダ走査）: [${tagetFileIds.length}] 件`,
    );
  }

  if (tagetFileIds.length <= 0) {
    writeLog("警告: 移動対象の画像/PDFファイルが0件です。");
    writeLog(
      "確認事項: 1) IMPORT_TARGET_FOLDER_ID が正しいか 2) フォルダ直下に画像/PDF があるか（サブフォルダ内は対象外） 3) 既に移動済みでないか",
    );
    state.hasWarning = true;
    writeLog("----- インポート対象ファイルの移動を完了しました（移動0件）。 -----");
    return;
  }

  let movedCount: number = 0;
  for (const targetFileId of tagetFileIds) {
    let fileName: string = targetFileId;
    try {
      const file = DriveApp.getFileById(targetFileId);
      fileName = file.getName();
      writeLog(
        `移動開始: ファイル名=[${fileName}], ID=[${targetFileId}]`,
      );
      moveFileToFolder(targetFileId, ctx.importCompletedFolderId);
      movedCount += 1;
      writeLog(
        `移動完了: ファイル名=[${fileName}], ID=[${targetFileId}] → [${completedFolderName}]`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      writeLog(
        `移動失敗: ファイル名=[${fileName}], ID=[${targetFileId}]: ${message}`,
      );
      state.hasWarning = true;
    }
  }

  writeLog(
    `----- インポート対象ファイルを移動しました（${movedCount}/${tagetFileIds.length} 件）。 -----`,
  );
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
      moveImportTargetsToCompleted(ctx, state);
      return;
    }

    let conversions: DocumentConversionResult[] | null = null;
    let convertedFileIds: string[] = [];

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
      conversions = createConvertedDocuments(ctx, state);
      if (!conversions) {
        return;
      }
      convertedFileIds = conversions.map(
        (conversion) => conversion.convertedFileId,
      );
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
      const sourceFileIds = conversions?.map(
        (conversion) => conversion.sourceFileId,
      );
      moveImportTargetsToCompleted(ctx, state, sourceFileIds);
    }
  });
}
