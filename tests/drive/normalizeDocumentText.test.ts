/**
 * normalizeDocumentText のフィクスチャ駆動テスト（サンプル）。
 *
 * ケース定義: tests/fixtures/normalizeDocumentText/<patternId>/
 *   - input.txt    … 関数入力（必須）
 *   - expected.txt … 期待出力（必須）
 *   - title.txt    … it の表示名（任意。無ければ patternId の _ がスペースになる）
 *
 * 新パターン追加:
 *   npm run test:fixture -- normalizeDocumentText 05_my_pattern
 */
import { describe, it, expect } from "vitest";
import { normalizeDocumentText } from "../../src/drive/normalizeDocumentText";
import {
  loadTextFixtureCases,
  runTextFixtureCases,
} from "../helpers/loadTextFixtureCases";

describe("normalizeDocumentText", () => {
  describe("フィクスチャパターン", () => {
    // tests/fixtures/normalizeDocumentText/ 配下のサブフォルダごとに it が自動生成される
    runTextFixtureCases("normalizeDocumentText", normalizeDocumentText);
  });

  describe("サンプル: インライン記述", () => {
    // 単発の確認は it 内に直接書いてもよい（通常はフィクスチャを推奨）
    it("空文字をそのまま返す", () => {
      expect(normalizeDocumentText("")).toBe("");
    });

    it("1行テキストをそのまま返す", () => {
      const input = " 1/15(月)10:00 会議";
      expect(normalizeDocumentText(input)).toBe(input);
    });
  });

  describe("サンプル: ケースをプログラムから参照", () => {
    it("loadTextFixtureCases で全パターンを取得できる", () => {
      const cases = loadTextFixtureCases("normalizeDocumentText");
      expect(cases.map((c) => c.id)).toEqual([
        "01_empty",
        "02_single_line",
        "03_multi_line",
        "04_with_title",
      ]);
    });

    it("title.txt があれば it 表示名として使われる", () => {
      const cases = loadTextFixtureCases("normalizeDocumentText");
      const withTitle = cases.find((c) => c.id === "04_with_title");
      expect(withTitle?.title).toBe("■で始まる行を含む OCR テキスト");
    });
  });
});
