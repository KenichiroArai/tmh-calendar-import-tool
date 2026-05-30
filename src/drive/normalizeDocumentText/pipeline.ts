import { normalizeInputNewlines } from "./normalizeInputNewlines";
import { collectEntries } from "./collectEntries";
import { normalizeEntriesContent } from "./normalizeEntriesContent";
import { formatNormalizedOutput } from "./formatNormalizedOutput";

/**
 * 入力末尾に改行があるか判定する。
 * @param text 入力テキスト
 * @return 末尾改行がある場合 true
 */
function hasTrailingLineEnding(text: string): boolean {
  let result: boolean = false;

  result = text.endsWith("\n") || text.endsWith("\r\n");

  return result;
}

/**
 * 正規化パイプラインを実行する。
 *
 * 1. normalizeInputNewlines … 改行を LF に統一
 * 2. collectEntries … ■ 行の結合・同一行内 ■ の分割
 * 3. normalizeEntriesContent … ■ 行の内容正規化
 * 4. formatNormalizedOutput … 行結合と末尾改行の復元
 *
 * @param text getText の戻り値（空文字以外）
 * @return 正規化後のテキスト
 */
export function runNormalizePipeline(text: string): string {
  let result: string = "";

  const hasTrailingNewline = hasTrailingLineEnding(text);
  const lines = normalizeInputNewlines(text).split("\n");
  const structuredEntries = collectEntries(lines);
  const contentEntries = normalizeEntriesContent(structuredEntries);
  result = formatNormalizedOutput(contentEntries, hasTrailingNewline);

  return result;
}
