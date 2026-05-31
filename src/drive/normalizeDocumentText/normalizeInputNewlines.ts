/**
 * 入力テキストの改行を LF に統一する。
 * @param text getText の戻り値など
 * @return LF 正規化後のテキスト
 */
export function normalizeInputNewlines(text: string): string {
  const result = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return result;
}
