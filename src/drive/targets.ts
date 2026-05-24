/**
 * フォルダIDに該当する対象ファイルIDの一覧を取得する。
 * @param {string} folderId フォルダID
 * @return {string[]} イメージファイルID
 */
function getTagetFileIds(folderId: string): string[] {
  const result: string[] = [];

  const folder = DriveApp.getFolderById(folderId);

  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();

    const mimeType = file.getMimeType();

    // ファイルタイプが画像またはPDFではないか
    if (!(mimeType.startsWith("image/") || mimeType === "application/pdf")) {
      // 画像またはPDFではない
      continue;
    }

    result.push(file.getId());
  }

  return result;
}
