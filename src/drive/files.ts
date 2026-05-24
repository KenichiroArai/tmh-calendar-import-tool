/**
 * ファイルIDからファイルを削除する。
 * @param fileId ファイルID
 * @param excludedFileId 対象外ファイルID
 */
function deleteFileById(fileId: string, excludedFileId: string): void {
  const file = DriveApp.getFileById(fileId);
  const fileName = file.getName();
  const files = DriveApp.getFilesByName(fileName);

  while (files.hasNext()) {
    const fileToDelete = files.next();

    if (fileToDelete.getId() == excludedFileId) {
      continue;
    }

    fileToDelete.setTrashed(true);
  }
}

/**
 * ファイル名からファイルを削除する。
 * @param fileName ファイル名
 */
function deleteFileByName(fileName: string): void {
  const files = DriveApp.getFilesByName(fileName);
  while (files.hasNext()) {
    const file = files.next();
    file.setTrashed(true);
  }
}

/**
 * ファイルを移動する。
 * @param fileId ファイルID
 * @param folderId フォルダID
 */
function moveFileToFolder(fileId: string, folderId: string): void {
  const file = DriveApp.getFileById(fileId);
  const folder = DriveApp.getFolderById(folderId);
  file.moveTo(folder);
}
