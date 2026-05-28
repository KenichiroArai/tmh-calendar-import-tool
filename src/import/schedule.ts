import { LOG_SHEET_NAME } from "../constants";
import { getRequiredConfig } from "../config/scriptProperties";
import { writeLog } from "../logging/writeLog";
import { createDocuments, getText } from "../drive/document";
import { getTagetFileIds } from "../drive/targets";
import { deleteFileByName, moveFileToFolder } from "../drive/files";
import { createCalendarImportFile } from "../calendar/parser";
import { importCSVtoCalendar } from "../calendar/import";

/**
 * スケジュールをインポートする。
 */
export function importSchedule(): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(LOG_SHEET_NAME);
  if (!logSheet) {
    throw new Error(
      "ログシートが見つかりません。シート名「" + LOG_SHEET_NAME + "」を確認してください。",
    );
  }

  logSheet.clear();

  writeLog("---------- カレンダーインポートツールを開始します。 ----------");

  let hasError = false;
  let hasWarning = false;

  /* フォルダの指定。全て同じフォルダIDに指定可能 */
  // インポート対象
  const IMPORT_TARGET_FOLDER_ID = getRequiredConfig("IMPORT_TARGET_FOLDER_ID");
  // インポート完了
  const IMPORT_COMPLETED_FOLDER_ID = getRequiredConfig(
    "IMPORT_COMPLETED_FOLDER_ID",
  );
  // 中間ファイル生成
  const INTERMEDIATE_FILE_GENERATION_FOLDER_ID = getRequiredConfig(
    "INTERMEDIATE_FILE_GENERATION_FOLDER_ID",
  );

  /* カレンダーIDの定義 */
  // カレンダーID
  const CALENDAR_ID = getRequiredConfig("CALENDAR_ID");

  try {
    writeLog("----- 設定情報を取得します。 -----");
    writeLog(`インポート対象フォルダID：[${IMPORT_TARGET_FOLDER_ID}]`);
    writeLog(`インポート完了フォルダID：[${IMPORT_COMPLETED_FOLDER_ID}]`);
    writeLog(
      `中間ファイル生成フォルダID：[${INTERMEDIATE_FILE_GENERATION_FOLDER_ID}]`,
    );
    writeLog(`カレンダーID：[${CALENDAR_ID}]`);
    writeLog("----- 設定情報を取得しました。 -----");

    /* ドキュメントを作成する */
    writeLog("----- ドキュメントを作成します。 -----");
    let convertedFileIds = createDocuments(
      IMPORT_TARGET_FOLDER_ID,
      INTERMEDIATE_FILE_GENERATION_FOLDER_ID,
    );
    if (convertedFileIds.length <= 0) {
      writeLog("インポート対象に該当ファイルがありません。");
      hasWarning = true;
      return;
    }
    writeLog(`変換ドキュメント数：[${convertedFileIds.length}]`);
    writeLog("----- ドキュメントを作成しました。 -----");
    // TODO KenichiroArai 2026/05/19 分割用
    // return;

    // TODO KenichiroArai 2026/05/19 分割用
    // let url =
    //   "https://docs.google.com/document/d/1psjqhg0trmUAtcnrC4mcLlFF7YnxugF0FJNix5bAM4Y/edit?usp=sharing";
    // let id = extractIdFromUrl(url);
    // let convertedFileIds = [id];

    /* テキストを出力する */
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
          IMPORT_TARGET_FOLDER_ID,
          fileName,
          text,
          INTERMEDIATE_FILE_GENERATION_FOLDER_ID,
        );
        writeLog(`CSVファイルID：[${fileId}]`);
        importCSVtoCalendar(fileId, CALENDAR_ID);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        writeLog("エラーが発生しました: " + message);
        hasWarning = true;
        continue;
      }
      writeLog("終了しました。");
    }
    writeLog("----- カレンダーへインポートしました。 -----");

    /* インポート対象のファイルをインポート完了に移動する。 */
    writeLog("----- インポート対象ファイルを移動します。 -----");
    const tagetFileIds = getTagetFileIds(IMPORT_TARGET_FOLDER_ID);
    for (const targetFileId of tagetFileIds) {
      moveFileToFolder(targetFileId, IMPORT_COMPLETED_FOLDER_ID);
      writeLog(
        `ファイルID：[${targetFileId}] をインポート完了フォルダへ移動しました。`,
      );
    }
    writeLog("----- インポート対象ファイルを移動しました。 -----");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    writeLog("エラーが発生しました: " + message);
    hasError = true;
  } finally {
    writeLog(
      "---------- カレンダーインポートツールが全て終了しました。 ----------",
    );

    if (hasError) {
      Browser.msgBox(
        "失敗",
        "スケジュールのインポートに失敗しました。ログを確認してください。",
        Browser.Buttons.OK,
      );
      return;
    }
    if (hasWarning) {
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
}
