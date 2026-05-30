/**
 * normalizeDocumentText のフィクスチャ駆動テスト。
 *
 * ケース定義: tests/fixtures/normalizeDocumentText/<patternId>/
 *   - input.txt    … 関数入力（必須）
 *   - expected.txt … 期待出力（必須）
 *   - title.txt    … it の表示名（任意）
 *
 * 新パターン追加:
 *   npm run test:fixture -- normalizeDocumentText 04_my_pattern
 */
import { describe } from "vitest";
import { normalizeDocumentText } from "../../src/drive/normalizeDocumentText";
import { runTextFixtureCases } from "../helpers/loadTextFixtureCases";

describe("normalizeDocumentText", () => {
  runTextFixtureCases("normalizeDocumentText", normalizeDocumentText);
});
