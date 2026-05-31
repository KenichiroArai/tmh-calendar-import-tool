import { createCsvFile } from "../drive/csv";

/**
 * 書き込み中身を返す。
 * @param {string} matchResult マッチ結果
 * @return {string} 書き込み中身
 */
export function getWriteContents(matchResult: RegExpMatchArray): string {
  let result: string = "";

  const PATTERN_SQUARE = /■/;
  const PATTERN_DATA2 = /(.+)■(\d+\/\d+)\(.\)(\d+:\d+).?(.*)/;

  const matchResultSquare = matchResult[3].match(PATTERN_SQUARE);
  if (!matchResultSquare) {
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

/**
 * カレンダーのインポートファイルを作成する。
 * @param {string} folderId フォルダID
 * @param {string} fileName ファイル名
 * @param {string} contents 中身
 * @param {string} outputFolderId 出力フォルダID
 * @return {string} インポートファイルID
 */
export function createCalendarImportFile(
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
    // 行をトリムする
    const line_wk = line.trim();
    // データがあるか
    if (line_wk == "") {
      // データが無い場合

      continue;
    }

    if (line_wk.match(PATTERN_HEAD_SQUARE)) {
      const matchResult = line_wk.match(PATTERN_DATA);
      if (!matchResult) {
        continue;
      }

      writeContents += getWriteContents(matchResult);
      continue;
    }

    const matchResult = line_wk.match(PATTERN_DATA);
    if (!matchResult) {
      writeContents += line_wk;
      continue;
    }

    writeContents += getWriteContents(matchResult);
  }

  writeContents = writeContents.substring(1, writeContents.length);

  const result = createCsvFile(folderId, fileName, writeContents, outputFolderId);
  return result;
}
