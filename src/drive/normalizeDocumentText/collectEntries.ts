import { splitInlineSquareEntries } from "./splitInlineSquareEntries";

/**
 * 行一覧から ■ エントリとその他の行を収集する。
 * ■ で始まらない行は直前の ■ エントリに結合する。
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

    if (content.startsWith("■")) {
      if (current !== null) {
        result.push(...splitInlineSquareEntries(current));
      }
      current = content;
      continue;
    }

    if (current !== null) {
      current += content;
      continue;
    }

    result.push(line);
  }

  if (current !== null) {
    result.push(...splitInlineSquareEntries(current));
  }

  return result;
}
