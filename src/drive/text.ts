import { deleteFileByName } from "./files";

/**
 * テキストファイルを作成する。
 * @param {string} folderId フォルダID
 * @param {string} fileName ファイル名
 * @param {string} contents ファイルの内容
 * @param {string} outputFolderId 出力フォルダID
 * @return {string} テキストファイルID
 */
export function createTextFile(
  folderId: string,
  fileName: string,
  contents: string,
  outputFolderId: string,
): string {
  const contentType = "text/plain";
  const charset = "UTF-8";
  const folder = DriveApp.getFolderById(folderId);

  const blob = Utilities.newBlob("", contentType, fileName).setDataFromString(
    contents,
    charset,
  );

  const file = folder.createFile(blob);

  const outputFolder = DriveApp.getFolderById(outputFolderId);
  file.moveTo(outputFolder);

  const result = file.getId();
  return result;
}

/**
 * 正規化済みテキストを中間ファイル生成フォルダへ保存する。
 * @param {string} baseFileName 元ファイル名（拡張子付き）
 * @param {string} text 正規化済みテキスト
 * @param {string} outputFolderId 出力フォルダID
 * @return {string} テキストファイルID
 */
export function saveNormalizedTextFile(
  baseFileName: string,
  text: string,
  outputFolderId: string,
): string {
  const fileName = baseFileName + ".txt";
  deleteFileByName(fileName);
  const result = createTextFile(
    outputFolderId,
    fileName,
    text,
    outputFolderId,
  );
  return result;
}
