const WEEKDAY = "[月火水木金土日]";

const PATTERN_INLINE_DATE_SPLIT = new RegExp(
  `(?:^|(?<=\\s)(?<!■\\s))(?=(?:■\\s*)?\\d{1,2}/\\d{1,2}\\s*\\(${WEEKDAY}\\)\\s*\\d{1,2}:\\d{2})`,
);

/**
 * 同一行内の複数 OCR 日付エントリを分割する（構造正規化の一部）。
 * @param text 1行分のテキスト
 * @return 分割後のセグメント一覧
 */
export function splitInlineOcrDateEntries(text: string): string[] {
  let result: string[] = [];

  result = text
    .split(PATTERN_INLINE_DATE_SPLIT)
    .filter((part) => part.length > 0)
    .map((part) => part.trimEnd());

  return result;
}
