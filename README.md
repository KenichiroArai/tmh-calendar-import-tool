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
├── main.ts                 # エントリ（操作パネルから実行オプションを読み取り）
├── config/
│   ├── scriptProperties.ts # Script Properties の取得
│   └── runOptionsFromSheet.ts # 操作パネル（モード・ドキュメントURL）の読み取り
├── constants.ts            # 定数（ログシート名・概要文・セル位置など）
├── logging/
│   └── writeLog.ts         # ログシートへの書き込み
├── ui/
│   └── confirmation.ts     # 確認ダイアログ
├── import/
│   └── schedule.ts         # インポート処理（3フェーズ + 実行範囲の設定）
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

## スケジュールインポートの処理

`src/import/schedule.ts` がインポート全体を制御します。処理は次の3フェーズに分かれています。

| フェーズ | 内容 | 主な関数 |
| --- | --- | --- |
| 1 | インポート対象フォルダ内のファイルから Google ドキュメントを作成 | `createConvertedDocuments` |
| 2 | 変換済みドキュメントを CSV 化し Google カレンダーへ登録 | `importConvertedDocumentsToCalendar` |
| 3 | インポート対象ファイルを完了フォルダへ移動 | `moveImportTargetsToCompleted` |

### 操作パネル（スプレッドシート）

メニュー経由の実行範囲は **スプレッドシートの操作パネル（アクティブシート）** で切り替えます。

| 項目 | 内容 |
| --- | --- |
| 概要 | ツールの説明とモード一覧（`constants.ts` の `CONTROL_PANEL_OVERVIEW_TEXT` を貼り付け） |
| モード | 実行モード（`mode`） |
| ドキュメントURL | ドキュメント URL / ファイル ID（`manualDocumentUrls`。改行またはカンマ区切りで複数可） |

コード上のセル位置は `constants.ts` の `CONTROL_PANEL_MODE_CELL`（`B2`）、`CONTROL_PANEL_DOCUMENT_URLS_CELL`（`B3`）です。

#### 概要セルに貼り付ける文面

スプレッドシートの「概要」には、セル番号ではなく項目名で案内します。次の定数をそのまま貼り付けてください（`src/constants.ts` の `CONTROL_PANEL_OVERVIEW_TEXT` と同一）。

```text
本シートは、TMHスケジュールを Google カレンダーへ取り込むための操作パネルです。
「モード」と「ドキュメントURL」を設定し、「インポートの開始」から実行してください。
処理の記録は「ログ」シートを確認してください。

【モードに指定する値】
all … 本番（フェーズ1：ドキュメント作成 → フェーズ2：カレンダー登録 → フェーズ3：完了フォルダへ移動）
createDocumentsOnly … フェーズ1のみ（ドキュメント作成。ログのファイルIDを確認）
importOnly … フェーズ2のみ（カレンダー登録。「ドキュメントURL」の指定が必要）
moveOnly … フェーズ3のみ（インポート対象ファイルを完了フォルダへ移動）

本番ではモードを all、「ドキュメントURL」は空にしてください。
```

### 実行モードの切り替え

```
myFunction (main.ts)
  └─ readScheduleImportRunFromSheet (config/runOptionsFromSheet.ts)
       └─ showConfirmationDialog (ui/confirmation.ts)
            └─ importSchedule(run) (import/schedule.ts)
```

| レイヤ | 役割 |
| --- | --- |
| 操作パネル | 運用時のモード・ドキュメントURL の指定 |
| `config/runOptionsFromSheet.ts` | セル値の読み取りとパース |
| `ui/confirmation.ts` | 確認ダイアログと `importSchedule` への引き渡し |
| `import/schedule.ts` | フェーズ実行ロジック（`ScheduleImportRunOptions` 型の定義） |

本番では **モードに `all`、ドキュメントURL を空** にしてから「インポートの開始」を実行してください。

| 作業 | モード | ドキュメントURL |
| --- | --- | --- |
| 本番（フェーズ1〜3） | `all` | （空） |
| フェーズ1のみ（ドキュメント作成・ログでファイルID確認） | `createDocumentsOnly` | （空） |
| フェーズ2のみ（作成済みドキュメントでカレンダー検証） | `importOnly` | ドキュメント URL またはファイル ID（複数可） |
| フェーズ3のみ（完了フォルダへ移動） | `moveOnly` | （空） |

フェーズ2のみのドキュメントURL の例:

```text
https://docs.google.com/document/d/xxxxxxxx/edit?usp=sharing
```

URL に `/d/` が含まれる場合は `extractIdFromUrl`（`src/utils/url.ts`）でファイル ID に変換します。ファイル ID を直接指定する場合は ID 文字列をそのまま記載してください。

### 分割実行（GAS エディタから直接）

| 関数 | 用途 |
| --- | --- |
| `importScheduleCreateDocuments` | フェーズ1のみ |
| `importScheduleToCalendar` | フェーズ2のみ（引数にファイル ID の配列） |
| `importScheduleMoveTargets` | フェーズ3のみ |

フェーズ2の実行例（スクリプトエディタ）:

```javascript
importScheduleToCalendar(["xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"]);
```

分割作業の典型的な流れ（いずれも操作パネルのモード・ドキュメントURL を編集してメニューから実行）:

1. モードを `createDocumentsOnly` にして実行し、ログシートの「変換ドキュメント数」「ファイルID」を確認する
2. モードを `importOnly`、ドキュメントURL に対象を指定してカレンダー登録を検証する
3. 問題なければモードを `all`、ドキュメントURL を空にして本番実行する（フェーズ3の移動も含む）

## GAS での実行

1. `npm run build` のあと `npm run clasp:push` で最新コードを反映
2. 本番: スプレッドシートのメニューから実行（`myFunction` → `importSchedule`）
3. 検証: 操作パネルのモード・ドキュメントURL を編集してメニューから実行。または GAS エディタからフェーズ専用関数を直接実行

本番運用前は必ず操作パネルのモードが `all`、ドキュメントURL が空であることを確認してください。

## テスト

テストフレームワークには [Vitest](https://vitest.dev/) を使用しています。テスト設定は `vite.config.ts` を利用します。

### テストの構成

```
tests/
├── setup.ts                  # GAS グローバル API のモック定義
├── import/
│   └── schedule.test.ts      # インポート全体・フェーズ分割・実行設定
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

`tests/import/schedule.test.ts` では `importSchedule` に渡す `ScheduleImportRunOptions` の各 `mode` と、フェーズ専用関数（`importScheduleCreateDocuments` など）の振る舞いを検証しています。

### GAS API のモック

GAS 固有のグローバル API（`SpreadsheetApp`, `DriveApp`, `CalendarApp` 等）は `tests/setup.ts` で `vi.stubGlobal()` を使ってモックしています。個別テストで必要に応じて `vi.mocked()` でオーバーライドできます。

## 補足

- `.clasp.json` は `scriptId` を含むため `.gitignore` で除外しています。
- `dist/` はビルド生成物のため Git 管理対象外です。手で編集しないでください。
- `coverage/` はテストカバレッジレポートのため Git 管理対象外です。
- 同期除外は `.claspignore` で制御しています（`rootDir` が `dist` のときは `dist/` 配下が対象です）。
