/**
 * CSVファイルを作成する。
 * @param folderId フォルダID
 * @param fileName ファイル名
 * @param contents ファイルの内容
 * @param outputFolderId 出力フォルダID
 * @return CSVファイルID
 */
function createCsvFile(
  folderId: string,
  fileName: string,
  contents: string,
  outputFolderId: string,
): string {
  const contentType = "text/csv";
  const charset = "UTF-8";
  const folder = DriveApp.getFolderById(folderId);

  const blob = Utilities.newBlob("", contentType, fileName).setDataFromString(
    contents,
    charset,
  );

  const file = folder.createFile(blob);

  const outputFolder = DriveApp.getFolderById(outputFolderId);
  file.moveTo(outputFolder);

  return file.getId();
}
