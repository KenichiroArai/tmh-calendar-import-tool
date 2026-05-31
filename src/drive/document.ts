import { getTagetFileIds } from "./targets";
import { deleteDuplicateDocumentsInFolder } from "./files";
import { writeLog } from "../logging/writeLog";
import { normalizeDocumentText } from "./normalizeDocumentText";
import { saveNormalizedTextFile } from "./text";

/**
 * 入力ファイルIDからドキュメントを作成する。
 * @param {string} inputFileId 入力ファイルID
 * @param {string} outputFolderId 出力フォルダID
 * @return {string} ドキュメントID
 */
export function createDocument(inputFileId: string, outputFolderId: string): string {
  let result: string = "";

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

  // コピー先フォルダにファイルを移動
  DriveApp.getFileById(documentFile.id).moveTo(
    DriveApp.getFolderById(outputFolderId),
  );

  result = documentFile.id;
  return result;
}

/**
 * テキストを取得する。
 * @param {string} documentFileId ドキュメントファイルID
 * @return {string} テキスト
 */
export function getText(documentFileId: string): string {
  let result: string = "";

  result = DocumentApp.openById(documentFileId).getBody().getText();
  result = normalizeDocumentText(result);
  return result;
}

export interface DocumentConversionResult {
  sourceFileId: string;
  convertedFileId: string;
}

/**
 * 入力フォルダIDに該当するファイル一覧の全てのドキュメントを出力フォルダIDのフォルダ内に作成する。
 * @param {string} inputFolderId 入力フォルダID
 * @param {string} outputFolderId 出力フォルダID
 * @return {DocumentConversionResult[]} 変換結果の一覧
 */
export function createDocuments(
  inputFolderId: string,
  outputFolderId: string,
): DocumentConversionResult[] {
  const result: DocumentConversionResult[] = [];
  const targetFileIds = getTagetFileIds(inputFolderId);
  for (const targetFileId of targetFileIds) {
    const inputFile = DriveApp.getFileById(targetFileId);
    writeLog(
      `--- ファイル名：[${inputFile.getName()}], ファイルID：[${targetFileId}] のOCR変換 ---`,
    );
    writeLog("開始します。");
    const convertedFileId = createDocument(targetFileId, outputFolderId);
    writeLog(`変換ドキュメントID：[${convertedFileId}]`);

    const convertedFile = DriveApp.getFileById(convertedFileId);
    const normalizedText = getText(convertedFileId);
    const normalizedTextFileId = saveNormalizedTextFile(
      convertedFile.getName(),
      normalizedText,
      outputFolderId,
    );
    writeLog(`正規化テキストファイルID：[${normalizedTextFileId}]`);

    result.push({
      sourceFileId: targetFileId,
      convertedFileId,
    });

    deleteDuplicateDocumentsInFolder(convertedFileId, outputFolderId);
    writeLog("終了しました。");
  }
  return result;
}
