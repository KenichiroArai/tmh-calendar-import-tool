import { PATTERN_INLINE_DATE_SPLIT } from "./scheduleEntryPatterns";

/**
 * 同一行内の複数 OCR 日付エントリを分割する（構造正規化の一部）。
 * @param text 1行分のテキスト
 * @return 分割後のセグメント一覧
 */
export function splitInlineOcrDateEntries(text: string): string[] {
  const result = text
    .split(PATTERN_INLINE_DATE_SPLIT)
    .filter((part) => part.length > 0)
    .map((part) => part.trimEnd());
  return result;
}
