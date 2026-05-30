/**
 * 同一行内の複数 ■ エントリを分割する。
 * @param text ■ で始まる結合済みテキスト
 * @return 分割後のエントリ一覧
 */
function splitInlineSquareEntries(text: string): string[] {
  let result: string[] = [];

  result = text
    .split(/(?=■)/)
    .filter((part) => part.length > 0)
    .map((part) => part.trimEnd());

  return result;
}

/**
 * 行一覧から ■ エントリとその他の行を収集する。
 * ■ で始まらない行は直前の ■ エントリに結合する。
 * @param lines 入力テキストの行一覧
 * @return 正規化前のエントリ一覧
 */
function collectEntries(lines: string[]): string[] {
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

/**
 * ■ エントリ行の OCR 由来スペースを除去する。
 * 構造の正規化（行結合・分割）の後、行内スペースをまとめて削除する。
 * @param line ■ で始まる1エントリ
 * @return 正規化後の行
 */
function normalizeSquareEntry(line: string): string {
  let result: string = "";

  result = line.replace(/\s/g, "");

  return result;
}

/**
 * getText で取得したテキストを、後続のカレンダーパーサー用正規表現に合う形式へ変換する。
 * @param {string} text getText の戻り値
 * @return {string} 正規化後のテキスト
 */
export function normalizeDocumentText(text: string): string {
  let result: string = "";

  if (text === "") {
    return result;
  }

  const hasTrailingNewline = text.endsWith("\n") || text.endsWith("\r\n");
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const entries = collectEntries(normalized.split("\n"));

  result = entries
    .map((entry) =>
      entry.startsWith("■") ? normalizeSquareEntry(entry) : entry,
    )
    .join("\n");

  if (hasTrailingNewline && result.length > 0) {
    result += "\n";
  }

  return result;
}
