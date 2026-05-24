/**
 * 入力ファイルIDからドキュメントを作成する。
 * @param inputFileId 入力ファイルID
 * @param outputFolderId 出力フォルダID
 * @return ドキュメントID
 */
function createDocument(inputFileId: string, outputFolderId: string): string {
  const drive = Drive as unknown as GoogleAppsScript.Drive_v2;
  if (!drive) {
    throw new Error(
      "Drive API が有効化されていません。GASエディタの「サービス」から Drive API を追加してください。",
    );
  }

  const ocrOption: Record<string, string | boolean> = {
    ocr: true,
    ocrLanguage: "ja",
  };
  const ocrResource: GoogleAppsScript.Drive.Schema.File = {
    mimeType: MimeType.GOOGLE_DOCS,
  };
  const documentFile = drive.Files.copy(ocrResource, inputFileId, ocrOption);
  if (!documentFile.id) {
    throw new Error("OCR 変換後のドキュメント ID を取得できませんでした。");
  }

  DriveApp.getFileById(documentFile.id).moveTo(
    DriveApp.getFolderById(outputFolderId),
  );

  return documentFile.id;
}

/**
 * テキストを取得する。
 * @param documentFileId ドキュメントファイルID
 * @return テキスト
 */
function getText(documentFileId: string): string {
  const documentFile = DocumentApp.openById(documentFileId);
  return documentFile.getBody().getText();
}

/**
 * 入力フォルダ内の対象ファイルを OCR し、出力フォルダにドキュメントを作成する。
 * @param inputFolderId 入力フォルダID
 * @param outputFolderId 出力フォルダID
 * @return ドキュメントIDの一覧
 */
function createDocuments(
  inputFolderId: string,
  outputFolderId: string,
): string[] {
  const result: string[] = [];
  const targetFileIds = getTagetFileIds(inputFolderId);
  for (const targetFileId of targetFileIds) {
    const inputFile = DriveApp.getFileById(targetFileId);
    writeLog(
      `--- ファイル名：[${inputFile.getName()}], ファイルID：[${targetFileId}] のOCR変換 ---`,
    );
    writeLog("開始します。");
    const convertedFileId = createDocument(targetFileId, outputFolderId);
    writeLog(`変換ドキュメントID：[${convertedFileId}]`);
    result.push(convertedFileId);

    deleteFileById(convertedFileId, convertedFileId);
    writeLog("終了しました。");
  }
  return result;
}
