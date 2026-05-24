/**
 * 指定されたメッセージをログシートに書き込む。
 * @param message ログメッセージ
 */
function writeLog(message: string): void {
  console.log(message);

  const logSheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_SHEET_NAME);
  if (!logSheet) {
    throw new Error(
      "ログシートが見つかりません。シート名「" + LOG_SHEET_NAME + "」を確認してください。",
    );
  }

  let lastRow = logSheet.getLastRow();

  while (message.length > MAX_CELL_LENGTH) {
    logSheet
      .getRange(lastRow + 1, 1)
      .setValue(message.substring(0, MAX_CELL_LENGTH));
    message = message.substring(MAX_CELL_LENGTH);
    lastRow++;
  }

  logSheet.getRange(lastRow + 1, 1).setValue(message);
}
