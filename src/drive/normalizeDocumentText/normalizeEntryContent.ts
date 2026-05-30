import { normalizeSquareEntry } from "./normalizeSquareEntry";

/**
 * 1エントリの内容を正規化する（パイプライン第3段階）。
 * ■ 行に対する変換をここへ追加していく。
 * @param entry 構造正規化済みの1エントリ
 * @return 内容正規化後のエントリ
 */
export function normalizeEntryContent(entry: string): string {
  let result: string = entry;

  if (!result.startsWith("■")) {
    return result;
  }

  result = normalizeSquareEntry(result);

  return result;
}
