# tmh-calendar-import-tool

`clasp` と TypeScript を使って Google Apps Script (GAS) をローカルで管理するための手順です。

## 前提

- Node.js / npm が利用できること
- このリポジトリの依存関係をインストール済みであること

```bash
npm install
```

## プロジェクト構成

| パス | 説明 |
| --- | --- |
| `src/main.ts` | TypeScript のソース（編集はここ） |
| `src/appsscript.json` | GAS マニフェスト |
| `dist/` | `npm run build` の出力（`clasp push` の対象） |

`clasp` の `rootDir` は `dist` です。GAS へ反映する前に必ずビルドしてください。

## 初期セットアップ

1. Google アカウントで `clasp` にログイン

```bash
npm run clasp:login
```

2. `.clasp.json` を作成

```bash
copy .clasp.json.example .clasp.json
```

3. `.clasp.json` の `YOUR_SCRIPT_ID` を実際の Script ID に置き換え

- Script ID は GAS エディタ URL の `/d/` と `/edit` の間の文字列です。
- `rootDir` は `dist` です（ビルド成果物を GAS に同期します）。
- マニフェストは `src/appsscript.json` にあり、ビルド時に `dist/` へコピーされます。

4. リモートの GAS コードをローカルに取り込む（初回のみ推奨）

```bash
npm run clasp:pull
```

以降の開発では `src/main.ts` を編集し、`npm run build` で `dist/` を生成してから push してください。

5. GAS エディタで Script Properties を設定

GAS エディタの「プロジェクトの設定」→「スクリプト プロパティ」に以下を設定:

- `IMPORT_TARGET_FOLDER_ID`
- `IMPORT_COMPLETED_FOLDER_ID`
- `INTERMEDIATE_FILE_GENERATION_FOLDER_ID`
- `CALENDAR_ID`

6. GAS エディタで「Drive（高度な Google サービス）」を有効化

- GAS エディタ左メニューの「サービス」から `Drive API` を追加してください。
- 本ツールは `Drive.Files.copy(...)` を使用するため、`Drive API` の有効化が必須です。
- `src/appsscript.json` にも Drive API v2 の設定を含めています。`clasp push` 後にエディタ側の設定と一致しているか確認してください。

## 日常運用コマンド

型チェック（ビルドなし）:

```bash
npm run typecheck
```

ビルド（`dist/` を生成）:

```bash
npm run build
```

変更確認:

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

## 補足

- `.clasp.json` は `scriptId` を含むため `.gitignore` で除外しています。
- 既存の `.clasp.json` で `rootDir` が `src` の場合は `dist` に変更してください。
- `dist/` はビルド生成物のため Git 管理対象外です。
- 同期除外は `.claspignore` で制御しています。
