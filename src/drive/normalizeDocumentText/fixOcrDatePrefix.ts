import { PATTERN_SQUARE_DATE } from "./scheduleEntryPatterns";

/**
 * OCR 由来の月誤認識（例: 19/23 → 9/23）を修正する。
 * スペース除去後の ■ 行を想定する。
 * @param line ■ で始まる1エントリ
 * @return 日付 prefix 修正後の行
 */
export function fixOcrDatePrefix(line: string): string {
  let result: string = line;

  const matchResult = result.match(PATTERN_SQUARE_DATE);
  if (matchResult === null) {
    return result;
  }

  const month = parseInt(matchResult[2], 10);
  if (month <= 12) {
    return result;
  }

  result =
    matchResult[1] +
    matchResult[2].slice(1) +
    "/" +
    matchResult[3] +
    matchResult[4] +
    result.slice(matchResult[0].length);

  return result;
}
