/**
 * 書き込み中身を返す。
 * @param matchResult マッチ結果
 * @return 書き込み中身
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
 * カレンダーのインポート用 CSV ファイルを作成する。
 * @param folderId フォルダID
 * @param fileName ファイル名
 * @param contents 中身
 * @param outputFolderId 出力フォルダID
 * @return インポートファイルID
 */
function createCalendarImportFile(
  folderId: string,
  fileName: string,
  contents: string,
  outputFolderId: string,
): string {
  const PATTERN_DATA = /.(\d+\/\d+)\(.\)(\d+:\d+).?(.*)/;
  const PATTERN_HEAD_SQUARE = /^■/;

  let writeContents = "";

  const contentsArrays = contents.split(/\n/);
  for (const line of contentsArrays) {
    if (line == null) {
      continue;
    }

    const line_wk = line.trim();
    if (line_wk == "") {
      continue;
    }

    if (!line_wk.match(PATTERN_HEAD_SQUARE)) {
      const matchResult = line_wk.match(PATTERN_DATA);
      if (!matchResult) {
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
