/**
 * フォルダIDに該当する対象ファイルIDの一覧を取得する。
 * @param folderId フォルダID
 * @return イメージファイルID
 */
function getTagetFileIds(folderId: string): string[] {
  const result: string[] = [];

  const folder = DriveApp.getFolderById(folderId);

  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();

    const mimeType = file.getMimeType();

    if (!(mimeType.startsWith("image/") || mimeType === "application/pdf")) {
      continue;
    }

    result.push(file.getId());
  }

  return result;
}
