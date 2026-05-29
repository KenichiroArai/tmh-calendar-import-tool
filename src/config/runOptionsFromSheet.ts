import {
  CONTROL_PANEL_DOCUMENT_URLS_CELL,
  CONTROL_PANEL_MODE_CELL,
  CONTROL_PANEL_MODE_LABEL,
} from "../constants";
import type {
  ScheduleImportMode,
  ScheduleImportRunOptions,
} from "../import/schedule";

const VALID_MODES: readonly ScheduleImportMode[] = [
  "all",
  "createDocumentsOnly",
  "importOnly",
  "moveOnly",
];

/**
 * スプレッドシートのモードセル値を ScheduleImportMode に変換する。
 */
export function parseScheduleImportMode(raw: unknown): ScheduleImportMode {
  const mode = String(raw ?? "").trim();
  if (!VALID_MODES.includes(mode as ScheduleImportMode)) {
    throw new Error(
      `モードが不正です。「${CONTROL_PANEL_MODE_LABEL}」に次のいずれかを入力してください: ${VALID_MODES.join(", ")}（入力値: "${mode}"）`,
    );
  }
  return mode as ScheduleImportMode;
}

/**
 * スプレッドシートのドキュメントURLセル値を manualDocumentUrls 配列に変換する。
 * 改行またはカンマで複数指定できる。
 */
export function parseManualDocumentUrls(raw: unknown): string[] {
  const text = String(raw ?? "").trim();
  if (!text) {
    return [];
  }
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * 操作パネル（アクティブシート）の「モード」「ドキュメントURL」から実行オプションを読み取る。
 */
export function readScheduleImportRunFromSheet(
  sheet: GoogleAppsScript.Spreadsheet.Sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet(),
): ScheduleImportRunOptions {
  const mode = parseScheduleImportMode(
    sheet.getRange(CONTROL_PANEL_MODE_CELL).getValue(),
  );
  const manualDocumentUrls = parseManualDocumentUrls(
    sheet.getRange(CONTROL_PANEL_DOCUMENT_URLS_CELL).getValue(),
  );
  return { mode, manualDocumentUrls };
}
