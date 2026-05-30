/**
 * ■ エントリ行の OCR 由来スペースを除去する。
 * 構造の正規化（行結合・分割）の後、行内スペースをまとめて削除する。
 * @param line ■ で始まる1エントリ
 * @return 正規化後の行
 */
export function normalizeSquareEntry(line: string): string {
  let result: string = "";

  result = line.replace(/\s/g, "");

  return result;
}
