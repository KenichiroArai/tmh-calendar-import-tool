/** ログシート名 */
const LOG_SHEET_NAME = "ログ";

/** スプレッドシートのセルの最大文字数 */
const MAX_CELL_LENGTH = 50000;

/** Script Properties で必須となるキー */
type ConfigKey =
  | "IMPORT_TARGET_FOLDER_ID"
  | "IMPORT_COMPLETED_FOLDER_ID"
  | "INTERMEDIATE_FILE_GENERATION_FOLDER_ID"
  | "CALENDAR_ID";

/**
 * メイン関数。確認ダイアログを表示する。
 */
function myFunction(): void {
  showConfirmationDialog();
}

/**
 * 確認ダイアログを表示し、ユーザーの選択に応じて処理を実行する。
 */
function showConfirmationDialog(): void {
  const ui = Browser.msgBox(
    "確認",
    "スケジュールインポートを実行しますか？",
    Browser.Buttons.YES_NO,
  );

  if (ui === "yes") {
    importSchedule();
  } else {
    Logger.log("操作はキャンセルされました。");
  }
}

/**
 * 指定されたメッセージをログシートに書き込む。
 * @param message ログメッセージ
 */
function writeLog(message: string): void {
  console.log(message);

  const logSheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_SHEET_NAME);
  if (!logSheet) {
    throw new Error(
      "ログシートが見つかりません。シート名「" + LOG_SHEET_NAME + "」を確認してください。",
    );
  }

  let lastRow = logSheet.getLastRow();

  while (message.length > MAX_CELL_LENGTH) {
    logSheet
      .getRange(lastRow + 1, 1)
      .setValue(message.substring(0, MAX_CELL_LENGTH));
    message = message.substring(MAX_CELL_LENGTH);
    lastRow++;
  }

  logSheet.getRange(lastRow + 1, 1).setValue(message);
}

/**
 * スケジュールをインポートする。
 */
function importSchedule(): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(LOG_SHEET_NAME);
  if (!logSheet) {
    throw new Error(
      "ログシートが見つかりません。シート名「" + LOG_SHEET_NAME + "」を確認してください。",
    );
  }

  logSheet.clear();

  writeLog("---------- カレンダーインポートツールを開始します。 ----------");

  let hasError = false;
  let hasWarning = false;

  const scriptProperties = PropertiesService.getScriptProperties();

  /* フォルダの指定。全て同じフォルダIDに指定可能 */
  // インポート対象
  const IMPORT_TARGET_FOLDER_ID = getRequiredConfig_("IMPORT_TARGET_FOLDER_ID");
  // インポート完了
  const IMPORT_COMPLETED_FOLDER_ID = getRequiredConfig_(
    "IMPORT_COMPLETED_FOLDER_ID",
  );
  // 中間ファイル生成
  const INTERMEDIATE_FILE_GENERATION_FOLDER_ID = getRequiredConfig_(
    "INTERMEDIATE_FILE_GENERATION_FOLDER_ID",
  );

  /* カレンダーIDの定義 */
  // カレンダーID
  const CALENDAR_ID = getRequiredConfig_("CALENDAR_ID");

  /**
   * Script Properties から値を取得する。
   * @param {string} key キー
   * @return {string} 値
   */
  function getRequiredConfig_(key: ConfigKey): string {
    const value = scriptProperties.getProperty(key);
    if (!value) {
      throw new Error(
        "Script Properties の設定値が未定義です。GASエディタで設定してください: " +
          key,
      );
    }
    return value;
  }

  try {
    writeLog("----- 設定情報を取得します。 -----");
    writeLog(`インポート対象フォルダID：[${IMPORT_TARGET_FOLDER_ID}]`);
    writeLog(`インポート完了フォルダID：[${IMPORT_COMPLETED_FOLDER_ID}]`);
    writeLog(
      `中間ファイル生成フォルダID：[${INTERMEDIATE_FILE_GENERATION_FOLDER_ID}]`,
    );
    writeLog(`カレンダーID：[${CALENDAR_ID}]`);
    writeLog("----- 設定情報を取得しました。 -----");

    /* ドキュメントを作成する */
    writeLog("----- ドキュメントを作成します。 -----");
    let convertedFileIds = createDocuments(
      IMPORT_TARGET_FOLDER_ID,
      INTERMEDIATE_FILE_GENERATION_FOLDER_ID,
    );
    if (convertedFileIds.length <= 0) {
      writeLog("インポート対象に該当ファイルがありません。");
      hasWarning = true;
      return;
    }
    writeLog(`変換ドキュメント数：[${convertedFileIds.length}]`);
    writeLog("----- ドキュメントを作成しました。 -----");
    // TODO KenichiroArai 2026/05/19 分割用
    // return;

    // TODO KenichiroArai 2026/05/19 分割用
    // let url =
    //   "https://docs.google.com/document/d/1psjqhg0trmUAtcnrC4mcLlFF7YnxugF0FJNix5bAM4Y/edit?usp=sharing";
    // let id = extractIdFromUrl(url);
    // let convertedFileIds = [id];

    /* テキストを出力する */
    writeLog("----- カレンダーへインポートします。 -----");
    for (const convertedFileId of convertedFileIds) {
      const documentFile = DriveApp.getFileById(convertedFileId);
      writeLog(
        `--- ファイル名：[${documentFile.getName()}], ファイルID：[${convertedFileId}] の処理 ---`,
      );
      writeLog("開始します。");
      try {
        const text = getText(convertedFileId);
        const fileName = documentFile.getName() + ".csv";

        deleteFileByName(fileName);

        const fileId = createCalendarImportFile(
          IMPORT_TARGET_FOLDER_ID,
          fileName,
          text,
          INTERMEDIATE_FILE_GENERATION_FOLDER_ID,
        );
        writeLog(`CSVファイルID：[${fileId}]`);
        importCSVtoCalendar(fileId, CALENDAR_ID);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        writeLog("エラーが発生しました: " + message);
        hasWarning = true;
        continue;
      }
      writeLog("終了しました。");
    }
    writeLog("----- カレンダーへインポートしました。 -----");

    /* インポート対象のファイルをインポート完了に移動する。 */
    writeLog("----- インポート対象ファイルを移動します。 -----");
    const tagetFileIds = getTagetFileIds(IMPORT_TARGET_FOLDER_ID);
    for (const targetFileId of tagetFileIds) {
      moveFileToFolder(targetFileId, IMPORT_COMPLETED_FOLDER_ID);
      writeLog(`ファイルID：[${targetFileId}] をインポート完了フォルダへ移動しました。`);
    }
    writeLog("----- インポート対象ファイルを移動しました。 -----");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    writeLog("エラーが発生しました: " + message);
    hasError = true;
  } finally {
    writeLog(
      "---------- カレンダーインポートツールが全て終了しました。 ----------",
    );

    if (hasError) {
      Browser.msgBox(
        "失敗",
        "スケジュールのインポートに失敗しました。ログを確認してください。",
        Browser.Buttons.OK,
      );
      return;
    }
    if (hasWarning) {
      Browser.msgBox(
        "警告",
        "スケジュールのインポートに警告がありました。ログを確認してください。",
        Browser.Buttons.OK,
      );
      return;
    }
    Browser.msgBox(
      "成功",
      "スケジュールのインポートに成功しました。",
      Browser.Buttons.OK,
    );
  }

  /**
   * URLからIDを返す。
   */
  function extractIdFromUrl(url: string): string {
    // ドキュメントIDは "/d/" の後に続く部分で、次のスラッシュ "/" までです。
    const idMatch = url.match(/\/d\/(.+?)\//);
    if (idMatch && idMatch[1]) {
      return idMatch[1];
    } else {
      throw new Error("URLからIDを抽出できませんでした: " + url);
    }
  }

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
   * 入力ファイルIDからドキュメントを作成する。
   * @param {string} inputFileId 入力ファイルID
   * @param {string} outputFolderId 出力フォルダID
   * @return {string} ドキュメントID
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

    // コピー先フォルダにファイルを移動
    DriveApp.getFileById(documentFile.id).moveTo(
      DriveApp.getFolderById(outputFolderId),
    );

    return documentFile.id;
  }

  /**
   * テキストを取得する。
   * @param {string} documentFileId ドキュメントファイルID
   * @return {string} テキスト
   */
  function getText(documentFileId: string): string {
    const documentFile = DocumentApp.openById(documentFileId);
    return documentFile.getBody().getText();
  }

  /**
   * 入力フォルダIDに該当するファイル一覧の全てのドキュメントを出力フォルダIDのフォルダ内に作成する。
   * @param {string} inputFolderId 入力フォルダID
   * @param {string} outputFolderId 出力フォルダID
   * @return {string[]} ドキュメントIDの一覧
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

  /**
   * カレンダーのインポートファイルを作成する。
   * @param {string} folderId フォルダID
   * @param {string} fileName ファイル名
   * @param {string} contents 中身
   * @param {string} outputFolderId 出力フォルダID
   * @return {string} インポートファイルID
   */
  function createCalendarImportFile(
    folderId: string,
    fileName: string,
    contents: string,
    outputFolderId: string,
  ): string {
    const PATTERN_DATA = /.(\d+\/\d+)\(.\)(\d+:\d+).?(.*)/;
    const PATTERN_HEAD_SQUARE = /^■/;

    // ファイルに書き込む内容
    let writeContents = "";

    /* 内容を行ごとにファイルに書き込む内容に設定する */
    const contentsArrays = contents.split(/\n/);
    for (const line of contentsArrays) {
      // 行にデータが無いか
      if (line == null) {
        // 無い場合

        continue;
      }

      // 行をトリムする
      const line_wk = line.trim();
      // データがあるか
      if (line_wk == "") {
        // データが無い場合

        continue;
      }

      // ■が先頭にないか
      if (!line_wk.match(PATTERN_HEAD_SQUARE)) {
        // 先頭にない場合

        const matchResult = line_wk.match(PATTERN_DATA);
        // データパーンに一致しないか
        if (!matchResult) {
          // 一致しない場合

          writeContents += line_wk;

          continue;
        }

        writeContents += getWriteContents(matchResult);

        continue;
      }

      const matchResult = line_wk.match(PATTERN_DATA);
      if (!matchResult) {
        continue;
      }

      writeContents += getWriteContents(matchResult);
    }

    writeContents = writeContents.substring(1, writeContents.length);

    return createCsvFile(folderId, fileName, writeContents, outputFolderId);
  }

  /**
   * 書き込み中身を返す。
   * @param {string} matchResult マッチ結果
   * @return {string} 書き込み中身
   */
  function getWriteContents(matchResult: RegExpMatchArray): string {
    let result = "";

    const PATTERN_SQUARE = /■/;
    const PATTERN_DATA2 = /(.+)■(\d+\/\d+)\(.\)(\d+:\d+).?(.*)/;

    const matchResultSquare = matchResult[3].match(PATTERN_SQUARE);
    if (matchResultSquare) {
      const matchResult2 = matchResult[3].match(PATTERN_DATA2);
      if (!matchResult2) {
        return result;
      }
      matchResult[3] = matchResult2[1];

      result += "\n";
      result +=
        matchResult[1] +
        ", " +
        matchResult[2] +
        ", " +
        matchResult[3] +
        ", " +
        matchResult[3];

      result += "\n";
      result +=
        matchResult2[2] +
        ", " +
        matchResult2[3] +
        ", " +
        matchResult2[4] +
        ", " +
        matchResult2[4];

      return result;
    }

    result += "\n";
    result +=
      matchResult[1] +
      ", " +
      matchResult[2] +
      ", " +
      matchResult[3] +
      ", " +
      matchResult[3];

    return result;
  }

  /**
   * CSVファイル作成する。
   * @param {string} folderId フォルダID
   * @param {string} fileName ファイル名
   * @param {string} contents ファイルの内容
   * @param {string} outputFolderId 出力フォルダID
   * @return {string} CSVファイルID
   */
  function createCsvFile(
    folderId: string,
    fileName: string,
    contents: string,
    outputFolderId: string,
  ): string {
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

    return file.getId();
  }

  /**
   * CSVからカレンダーにインポートする。
   * @param {string} csvFileId CSVファイルID
   * @param {string} calendarId カレンダーID
   */
  function importCSVtoCalendar(csvFileId: string, calendarId: string): void {
    const calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) {
      throw new Error("カレンダーが見つかりません: " + calendarId);
    }

    const file = DriveApp.getFileById(csvFileId);
    const csvDatas = Utilities.parseCsv(file.getBlob().getDataAsString());

    for (const line of csvDatas) {
      const title = line[2];
      const year = new Date().getFullYear(); // TODO KenichiroArai 2024/12/30 今日より前であれば+1する
      const date = new Date(year + "/" + line[0]);
      const times = line[1].split(":");
      const hours = Number(times[0]);
      date.setHours(hours);
      const minutes = Number(times[1]);
      date.setMinutes(minutes);
      const startTime = date;
      const endTime = date;
      const description = line[3];

      writeLog(
        "【カレンダーインポートデータ】title:" +
          title +
          ", startTime:" +
          startTime +
          ", endTime:" +
          endTime +
          ", description:" +
          description,
      );

      calendar.createEvent(title, startTime, endTime, {
        description: description,
      });
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

  void extractIdFromUrl;
}
