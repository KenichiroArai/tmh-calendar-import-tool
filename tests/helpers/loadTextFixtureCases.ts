import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { it, expect } from "vitest";

const FIXTURES_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
);

export type TextFixtureCase = {
  id: string;
  title: string;
  input: string;
  expected: string;
  dirPath: string;
};

/**
 * 改行を LF に正規化する。
 * @param text 対象テキスト
 * @return 正規化後のテキスト
 */
function normalizeNewlines(text: string): string {
  let result: string = "";

  result = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return result;
}

/**
 * フィクスチャの it 表示名を読み込む。
 * @param dir パターンディレクトリ
 * @param id パターン ID
 * @return 表示名
 */
function readFixtureTitle(dir: string, id: string): string {
  let result: string = "";

  const titlePath = join(dir, "title.txt");
  if (statSync(titlePath, { throwIfNoEntry: false })?.isFile()) {
    result = readFileSync(titlePath, "utf8").trim();
    return result;
  }
  result = id.replaceAll("_", " ");
  return result;
}

/**
 * skip ファイルの有無を返す。
 * @param dir パターンディレクトリ
 * @return skip されている場合 true
 */
function isSkipped(dir: string): boolean {
  let result: boolean = false;

  result =
    statSync(join(dir, "skip"), { throwIfNoEntry: false })?.isFile() ?? false;
  return result;
}

/**
 * only ファイルの有無を返す。
 * @param dir パターンディレクトリ
 * @return only 指定されている場合 true
 */
function isOnly(dir: string): boolean {
  let result: boolean = false;

  result =
    statSync(join(dir, "only"), { throwIfNoEntry: false })?.isFile() ?? false;
  return result;
}

/**
 * テキストフィクスチャのケース一覧を読み込む。
 * @param suiteName スイート名（tests/fixtures 配下のディレクトリ名）
 * @return ケース一覧
 */
export function loadTextFixtureCases(suiteName: string): TextFixtureCase[] {
  let result: TextFixtureCase[] = [];

  const suiteDir = join(FIXTURES_ROOT, suiteName);
  const entries = readdirSync(suiteDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  const hasOnly = entries.some((id) => isOnly(join(suiteDir, id)));

  for (const id of entries) {
    const dir = join(suiteDir, id);
    if (hasOnly && !isOnly(dir)) {
      continue;
    }
    if (isSkipped(dir)) {
      continue;
    }

    const inputPath = join(dir, "input.txt");
    const expectedPath = join(dir, "expected.txt");
    for (const p of [inputPath, expectedPath]) {
      if (!statSync(p, { throwIfNoEntry: false })?.isFile()) {
        throw new Error(`Missing ${p} for fixture "${id}"`);
      }
    }

    result.push({
      id,
      title: readFixtureTitle(dir, id),
      input: normalizeNewlines(readFileSync(inputPath, "utf8")),
      expected: normalizeNewlines(readFileSync(expectedPath, "utf8")),
      dirPath: dir,
    });
  }

  return result;
}

/**
 * テキストフィクスチャの全ケースで関数を検証する it を登録する。
 * @param suiteName スイート名
 * @param fn 検証対象関数
 */
export function runTextFixtureCases(
  suiteName: string,
  fn: (input: string) => string,
): void {
  const cases = loadTextFixtureCases(suiteName);
  if (cases.length === 0) {
    throw new Error(`No fixture cases under tests/fixtures/${suiteName}`);
  }
  for (const c of cases) {
    it(c.title, () => {
      expect(fn(c.input)).toBe(c.expected);
    });
  }
}
