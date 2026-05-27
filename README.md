# tmh-calendar-import-tool

`clasp`、TypeScript、Vite を使って Google Apps Script (GAS) をローカルで管理するための手順です。

## 前提

- Node.js >= 20 / npm が利用できること
- このリポジトリの依存関係をインストール済みであること

```bash
npm install
```

## プロジェクト構成

| パス | 説明 |
| --- | --- |
| `src/main.ts` | エントリポイント（`myFunction`） |
| `src/appsscript.json` | GAS マニフェスト（ビルド時に `dist/` へ自動コピー） |
| `src/**/*.ts` | 機能別の TypeScript ソース |
| `tests/**/*.test.ts` | 単体テスト（Vitest） |
| `dist/**/*.js` | `npm run build` で生成される GAS 用 JavaScript（分割ファイル） |
| `dist/appsscript.json` | 上記マニフェストのコピー |
| `vite.config.ts` | Vitest テスト設定 |

`src/` には TypeScript とマニフェストのみを置きます。ビルド成果物は `dist/` に出力されます。

`clasp` の `rootDir` は **`dist`** です。GAS へ反映する前に必ずビルドしてください。

### ビルドの仕組み

ソースコードは通常の TypeScript モジュールとして `import` / `export` を使って記述します。`npm run build` では `tsc` で `dist/` に分割出力した後、`scripts/prepare-gas-output.mjs` で `import/export` を除去し、GAS 互換のグローバル関数群に変換します。

```
src/**/*.ts  ──tsc + postprocess──▶  dist/**/*.js  ──clasp push──▶  GAS
src/appsscript.json  ──────▶  dist/appsscript.json
```

### ソースのフォルダ構成

```
src/
├── main.ts                 # エントリ（メニュー・トリガーから呼ぶ myFunction）
├── constants.ts            # 定数（ログシート名など）
├── config/
│   └── scriptProperties.ts # Script Properties の取得
├── logging/
│   └── writeLog.ts         # ログシートへの書き込み
├── ui/
│   └── confirmation.ts     # 確認ダイアログ
├── import/
│   └── schedule.ts         # インポート処理のオーケストレーション
├── drive/
│   ├── targets.ts          # インポート対象ファイルの列挙
│   ├── files.ts            # ファイル削除・移動
│   ├── document.ts         # OCR・Google ドキュメント作成
│   └── csv.ts              # CSV ファイル作成
├── calendar/
│   ├── parser.ts           # OCR テキスト → CSV 形式への変換
│   └── import.ts           # CSV → Google カレンダー
└── utils/
    └── url.ts              # URL からファイル ID を抽出（デバッグ用）
```

## 初期セットアップ

1. Google アカウントで `clasp` にログイン

```bash
npm run clasp:login
```

2. `.clasp.json` を作成

```bash
copy .clasp.json.example .clasp.json
```

3. `.clasp.json` を編集

- `YOUR_SCRIPT_ID` を実際の Script ID に置き換える
- `rootDir` が **`dist`** であることを確認する（`src` のままだと push 先に実行用の `.js` が含まれません）

Script ID は GAS エディタ URL の `/d/` と `/edit` の間の文字列です。

4. リモートの GAS コードをローカルに取り込む（初回のみ推奨）

```bash
npm run clasp:pull
```

`rootDir` が `dist` の場合、取得したファイルは `dist/` に入ります。以降の開発では **`src/` 配下の TypeScript を編集**し、`npm run build` で `dist/` を再生成してから push してください。

5. GAS エディタで Script Properties を設定

GAS エディタの「プロジェクトの設定」→「スクリプト プロパティ」に以下を設定:

- `IMPORT_TARGET_FOLDER_ID`
- `IMPORT_COMPLETED_FOLDER_ID`
- `INTERMEDIATE_FILE_GENERATION_FOLDER_ID`
- `CALENDAR_ID`

6. GAS エディタで「Drive（高度な Google サービス）」を有効化

- GAS エディタ左メニューの「サービス」から `Drive API` を追加してください。
- 本ツールは `Drive.Files.copy(...)` を使用するため、`Drive API` の有効化が必須です。

## 日常運用コマンド

型チェック（ビルドなし）:

```bash
npm run typecheck
```

ビルド（`dist/` を生成）:

```bash
npm run build
```

テスト実行:

```bash
npm test
```

テスト（ファイル変更時に自動再実行）:

```bash
npm run test:watch
```

テスト + カバレッジレポート:

```bash
npm run test:coverage
```

カバレッジレポートは `coverage/` に HTML 形式で生成されます。ブラウザで `coverage/index.html` を開くと行単位のカバレッジを確認できます。

変更確認（ビルド後に `dist/` と GAS を比較）:

```bash
npm run clasp:status
```

ローカル変更を GAS へ反映（ビルド込み）:

```bash
npm run clasp:push
```

GAS エディタを開く:

```bash
npm run clasp:open
```

ログアウト:

```bash
npm run clasp:logout
```

## GAS での実行

1. `npm run clasp:push` で最新コードを反映
2. GAS エディタで関数 `importSchedule` を選択して実行

## テスト

テストフレームワークには [Vitest](https://vitest.dev/) を使用しています。テスト設定は `vite.config.ts` を利用します。

### テストの構成

```
tests/
├── setup.ts                  # GAS グローバル API のモック定義
├── utils/
│   └── url.test.ts
├── calendar/
│   ├── parser.test.ts
│   └── import.test.ts
├── config/
│   └── scriptProperties.test.ts
└── drive/
    ├── csv.test.ts
    ├── document.test.ts
    ├── files.test.ts
    └── targets.test.ts
```

### GAS API のモック

GAS 固有のグローバル API（`SpreadsheetApp`, `DriveApp`, `CalendarApp` 等）は `tests/setup.ts` で `vi.stubGlobal()` を使ってモックしています。個別テストで必要に応じて `vi.mocked()` でオーバーライドできます。

## 補足

- `.clasp.json` は `scriptId` を含むため `.gitignore` で除外しています。
- `dist/` はビルド生成物のため Git 管理対象外です。手で編集しないでください。
- `coverage/` はテストカバレッジレポートのため Git 管理対象外です。
- 同期除外は `.claspignore` で制御しています（`rootDir` が `dist` のときは `dist/` 配下が対象です）。
