import { normalizeEntryContent } from "./normalizeEntryContent";

/**
 * エントリ一覧の内容を正規化する。
 * @param entries 構造正規化済みエントリ一覧
 * @return 内容正規化後のエントリ一覧
 */
export function normalizeEntriesContent(entries: string[]): string[] {
  const result = entries.map((entry) => normalizeEntryContent(entry));
  return result;
}
