import { splitInlineSquareEntries } from "./splitInlineSquareEntries";
import { splitInlineOcrDateEntries } from "./splitInlineOcrDateEntries";
import { isScheduleEntryStart } from "./scheduleEntryPatterns";

/**
 * 直前のエントリを result へ flush する。
 * @param current 結合中のエントリ
 * @param result 出力先
 */
function flushCurrent(
  current: string | null,
  result: string[],
): void {
  if (current === null) {
    return;
  }

  result.push(...splitInlineSquareEntries(current));
}

/**
 * スケジュールエントリ行の先頭に ■ を付与する。
 * @param line エントリ行
 * @return ■ 付きエントリ行
 */
function ensureSquarePrefix(line: string): string {
  let result: string = line;

  if (result.startsWith("■")) {
    return result;
  }

  result = "■" + result;
  return result;
}

/**
 * 1行を OCR 日付分割後のセグメント一覧として処理する。
 * @param content trimStart 済み行
 * @param current 結合中のエントリ
 * @param collectedEntries 出力先
 * @param passthroughLine passthrough 用の元行
 */
function processLineSegments(
  content: string,
  current: string | null,
  collectedEntries: string[],
  passthroughLine: string,
): string | null {
  let result: string | null = current;
  const segments = splitInlineOcrDateEntries(content);

  for (const segment of segments) {
    if (isScheduleEntryStart(segment)) {
      flushCurrent(result, collectedEntries);
      result = ensureSquarePrefix(segment);
      continue;
    }

    if (segment.startsWith("■")) {
      if (result !== null) {
        result += segment.slice(1);
        continue;
      }

      collectedEntries.push(passthroughLine);
      continue;
    }

    if (result !== null) {
      result += segment;
      continue;
    }

    collectedEntries.push(passthroughLine);
  }

  return result;
}

/**
 * 行一覧から ■ エントリとその他の行を収集する。
 * ■ で始まらない OCR スケジュール行もエントリ起点として扱う。
 * @param lines 入力テキストの行一覧
 * @return 正規化前のエントリ一覧
 */
export function collectEntries(lines: string[]): string[] {
  let result: string[] = [];
  let current: string | null = null;

  for (const line of lines) {
    if (line.trim() === "") {
      continue;
    }

    const content = line.trimStart();
    current = processLineSegments(content, current, result, line);
  }

  flushCurrent(current, result);

  return result;
}
