/**
 * エントリ一覧を出力テキストに整形する。
 * @param entries 正規化済みエントリ一覧
 * @param hasTrailingNewline 入力末尾に改行があったか
 * @return 結合後のテキスト
 */
export function formatNormalizedOutput(
  entries: string[],
  hasTrailingNewline: boolean,
): string {
  let result: string = "";

  result = entries.join("\n");

  if (hasTrailingNewline && result.length > 0) {
    result += "\n";
  }

  return result;
}
