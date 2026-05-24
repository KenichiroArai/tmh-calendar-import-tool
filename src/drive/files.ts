/**
 * ファイルIDからファイルを削除する。
 * @param {string} fileId ファイルID
 * @param {string} excludedFileId 対象外ファイルID
 */
function deleteFileById(fileId: string, excludedFileId: string): void {
  // ファイルIDからファイルを取得
  const file = DriveApp.getFileById(fileId);

  // ファイル名を取得
  const fileName = file.getName();

  // ファイル名に該当するファイルを検索
  const files = DriveApp.getFilesByName(fileName);

  // 該当するファイルを削除
  while (files.hasNext()) {
    const fileToDelete = files.next();

    // 該当するファイルが対象外か
    if (fileToDelete.getId() == excludedFileId) {
      // 対象外の場合

      continue;
    }

    fileToDelete.setTrashed(true); // ファイルをゴミ箱に移動
  }
}

/**
 * ファイル名からファイルを削除する。
 * @param {string} fileName ファイル名
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
 * @param {string} fileId ファイルID
 * @param {string} folderId フォルダID
 */
function moveFileToFolder(fileId: string, folderId: string): void {
  const file = DriveApp.getFileById(fileId);
  const folder = DriveApp.getFolderById(folderId);
  file.moveTo(folder);
}
