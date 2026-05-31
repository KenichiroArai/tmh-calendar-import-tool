const WEEKDAY = "[月火水木金土日]";

const PATTERN_SQUARE_SCHEDULE_ENTRY = new RegExp(
  `^■\\s*\\d{1,2}/\\d{1,2}\\s*\\(${WEEKDAY}\\)\\s*\\d{1,2}:\\d{2}`,
);

const PATTERN_OCR_DATE_TIME = new RegExp(
  `^\\d{1,2}/\\d{1,2}\\s*\\(${WEEKDAY}\\)\\s*\\d{1,2}:\\d{2}`,
);

const PATTERN_OCR_DATE_WITH_SPACE = new RegExp(
  `^\\d{1,2}/\\d{1,2}\\s+\\(${WEEKDAY}\\)`,
);

const PATTERN_TILDE_AFTER_TIME = /\d{1,2}:\d{2}\s*~/;

export const PATTERN_SQUARE_DATE = new RegExp(
  `^(■)(\\d{2,})/(\\d{1,2})(\\(${WEEKDAY}\\))`,
);

export const PATTERN_INLINE_DATE_SPLIT = new RegExp(
  `(?:^|(?<=\\s)(?<!■\\s))(?=(?:■\\s*)?\\d{1,2}/\\d{1,2}\\s*\\(${WEEKDAY}\\)\\s*\\d{1,2}:\\d{2})`,
);

/**
 * ■ 付きスケジュールエントリ行か判定する。
 * @param line 行テキスト
 * @return スケジュールエントリの場合 true
 */
export function isSquarePrefixedScheduleEntry(line: string): boolean {
  const result = PATTERN_SQUARE_SCHEDULE_ENTRY.test(line);
  return result;
}

/**
 * OCR 由来の ■ なしスケジュール行起点か判定する。
 * @param line 行テキスト
 * @return OCR スケジュール行起点の場合 true
 */
export function isOcrScheduleLineStart(line: string): boolean {
  let result: boolean = false;

  if (!PATTERN_OCR_DATE_TIME.test(line)) {
    return result;
  }

  if (PATTERN_OCR_DATE_WITH_SPACE.test(line)) {
    result = true;
    return result;
  }

  if (PATTERN_TILDE_AFTER_TIME.test(line)) {
    result = true;
    return result;
  }

  const dateMatch = line.match(/^(\d{1,2})\/(\d{1,2})/);
  if (dateMatch !== null && parseInt(dateMatch[1], 10) > 12) {
    result = true;
    return result;
  }

  return result;
}

/**
 * スケジュールエントリ行の起点か判定する。
 * @param line 行テキスト
 * @return エントリ起点の場合 true
 */
export function isScheduleEntryStart(line: string): boolean {
  let result: boolean = false;

  if (isSquarePrefixedScheduleEntry(line)) {
    result = true;
    return result;
  }

  result = isOcrScheduleLineStart(line);
  return result;
}
