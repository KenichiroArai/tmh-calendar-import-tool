/**
 * フォルダ内の同名 Google ドキュメントのうち、指定 ID 以外をゴミ箱へ移動する。
 * OCR 変換で同名ドキュメントが残った場合の整理用。画像など他種別のファイルは対象外。
 * @param {string} keepFileId 残すファイルID
 * @param {string} folderId 検索対象フォルダID
 */
export function deleteDuplicateDocumentsInFolder(
  keepFileId: string,
  folderId: string,
): void {
  const keepFile = DriveApp.getFileById(keepFileId);
  const fileName = keepFile.getName();
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFilesByName(fileName);

  while (files.hasNext()) {
    const file = files.next();

    if (file.getId() === keepFileId) {
      continue;
    }

    if (file.getMimeType() !== MimeType.GOOGLE_DOCS) {
      continue;
    }

    file.setTrashed(true);
  }
}

/**
 * ファイル名からファイルを削除する。
 * @param {string} fileName ファイル名
 */
export function deleteFileByName(fileName: string): void {
  const files = DriveApp.getFilesByName(fileName);
  while (files.hasNext()) {
    const file = files.next();
    file.setTrashed(true);
  }
}

/**
 * ファイルを移動する。
 * @param {string} fileId ファイルID
 * @param {string} folderId フォルダID
 */
export function moveFileToFolder(fileId: string, folderId: string): void {
  const file = DriveApp.getFileById(fileId);
  const folder = DriveApp.getFolderById(folderId);
  file.moveTo(folder);
}
