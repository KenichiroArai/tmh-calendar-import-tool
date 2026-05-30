/**
 * テキストフィクスチャ用のパターンディレクトリを scaffold する。
 *
 * tests/fixtures/<suiteName>/<patternId>/ に input.txt / expected.txt を生成する。
 *
 * 実行例:
 *   npm run test:fixture -- normalizeDocumentText 03_my_pattern
 *   node scripts/scaffold-text-fixture.mjs normalizeDocumentText 03_my_pattern
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// コマンドライン引数: <suiteName> <patternId>
const [, , suiteName, patternId] = process.argv;

if (!suiteName || !patternId) {
  console.error(
    "Usage: node scripts/scaffold-text-fixture.mjs <suiteName> <patternId>",
  );
  console.error(
    "Example: node scripts/scaffold-text-fixture.mjs normalizeDocumentText 03_my_pattern",
  );
  process.exit(1);
}

// tests/fixtures/ への絶対パス（このスクリプトの位置から解決）
const fixturesRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "tests",
  "fixtures",
);
const patternDir = join(fixturesRoot, suiteName, patternId);

// 同名パターンが既にある場合は上書きせず終了
if (existsSync(patternDir)) {
  console.error(`Fixture already exists: ${patternDir}`);
  process.exit(1);
}

// パターンディレクトリと必須ファイルを作成
mkdirSync(patternDir, { recursive: true });
writeFileSync(join(patternDir, "input.txt"), "", "utf8");
writeFileSync(join(patternDir, "expected.txt"), "", "utf8");

console.log(`Created fixture: ${patternDir}`);
console.log("  - input.txt");
console.log("  - expected.txt");
console.log("Edit the files above, then run: npm test");
