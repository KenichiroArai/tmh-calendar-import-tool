/**
 * 同一行内の複数 ■ エントリを分割する（構造正規化の一部）。
 * @param text ■ で始まる結合済みテキスト
 * @return 分割後のエントリ一覧
 */
export function splitInlineSquareEntries(text: string): string[] {
  const result = text
    .split(/(?=■)/)
    .filter((part) => part.length > 0)
    .map((part) => part.trimEnd());
  return result;
}
