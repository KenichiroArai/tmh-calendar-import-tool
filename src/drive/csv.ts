/**
 * CSVファイル作成する。
 * @param {string} folderId フォルダID
 * @param {string} fileName ファイル名
 * @param {string} contents ファイルの内容
 * @param {string} outputFolderId 出力フォルダID
 * @return {string} CSVファイルID
 */
export function createCsvFile(
  folderId: string,
  fileName: string,
  contents: string,
  outputFolderId: string,
): string {
  let result: string = "";

  const contentType = "text/csv"; // コンテンツタイプ
  const charset = "UTF-8"; // 文字コード
  const folder = DriveApp.getFolderById(folderId); // 出力するフォルダ

  const blob = Utilities.newBlob("", contentType, fileName).setDataFromString(
    contents,
    charset,
  );

  const file = folder.createFile(blob);

  // ファイルを移動する
  const outputFolder = DriveApp.getFolderById(outputFolderId); // 移動先のフォルダ
  file.moveTo(outputFolder);

  result = file.getId();
  return result;
}
