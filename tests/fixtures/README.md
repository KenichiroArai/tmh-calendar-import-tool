# テキストフィクスチャ

`tests/fixtures/` は Java の `src/test/resources` に相当するテスト専用リソースです。

## ディレクトリ構成

```
tests/fixtures/<suiteName>/<patternId>/
  input.txt      # 必須: 関数への入力
  expected.txt   # 必須: 期待する出力
  title.txt      # 任意: it() の表示名（無ければ patternId の _ をスペースに変換）
  skip           # 任意: 空ファイル。実装中パターンを一時スキップ
  only           # 任意: 空ファイル。デバッグ用（only がある場合はそれだけ実行）
```

- `<suiteName>` … テスト対象の識別子（例: `normalizeDocumentText`）
- `<patternId>` … パターン名。`01_`, `02_` のようにプレフィックスで並び順を制御

## テストでの使い方

```ts
import { describe } from "vitest";
import { myFn } from "../../src/myFn";
import { runTextFixtureCases } from "../helpers/loadTextFixtureCases";

describe("myFn", () => {
  runTextFixtureCases("mySuiteName", myFn);
});
```

## 新パターンの追加

### scaffold（推奨）

```bash
npm run test:fixture -- <suiteName> <patternId>
```

例:

```bash
npm run test:fixture -- normalizeDocumentText 03_ocr_sample
```

`input.txt` と `expected.txt` が生成されます。内容を編集して `npm test` を実行してください。

### 手動

既存パターンのフォルダをコピーし、`<patternId>` にリネームして `input.txt` / `expected.txt` を編集します。

## 注意

- 改行は読み込み時に LF に正規化されます。末尾改行の有無はファイルの内容に従います。
- OCR 実データを置く場合は個人情報・著作権に注意してください。
