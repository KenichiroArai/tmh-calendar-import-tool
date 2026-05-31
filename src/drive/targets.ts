export interface SkippedTargetFile {
  fileId: string;
  fileName: string;
  mimeType: string;
}

export interface ImportTargetFolderScan {
  targetFileIds: string[];
  skippedFiles: SkippedTargetFile[];
}

/**
 * フォルダ内のファイルを走査し、対象ファイルと除外ファイルを返す。
 * @param {string} folderId フォルダID
 * @return {ImportTargetFolderScan} 走査結果
 */
export function scanImportTargetFolder(folderId: string): ImportTargetFolderScan {
  const result: ImportTargetFolderScan = {
    targetFileIds: [],
    skippedFiles: [],
  };

  const folder = DriveApp.getFolderById(folderId);

  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();

    const mimeType = file.getMimeType();

    if (!(mimeType.startsWith("image/") || mimeType === "application/pdf")) {
      result.skippedFiles.push({
        fileId: file.getId(),
        fileName: file.getName(),
        mimeType,
      });
      continue;
    }

    result.targetFileIds.push(file.getId());
  }

  return result;
}

/**
 * フォルダIDに該当する対象ファイルIDの一覧を取得する。
 * @param {string} folderId フォルダID
 * @return {string[]} イメージファイルID
 */
export function getTagetFileIds(folderId: string): string[] {
  let result: string[] = [];

  result = scanImportTargetFolder(folderId).targetFileIds;
  return result;
}
