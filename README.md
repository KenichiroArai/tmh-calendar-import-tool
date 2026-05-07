# tmh-calendar-import-tool

`clasp` を使って Google Apps Script (GAS) をローカルで管理するための手順です。

## 前提

- Node.js / npm が利用できること
- このリポジトリの依存関係をインストール済みであること

```bash
npm install
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

3. `.clasp.json` の `YOUR_SCRIPT_ID` を実際の Script ID に置き換え

- Script ID は GAS エディタ URL の `/d/` と `/edit` の間の文字列です。
- このリポジトリは `rootDir: "src"` を採用しているため、GASファイルは `src/` 配下で管理します。
- マニフェストは `src/appsscript.json` に配置します。

4. リモートのGASコードをローカルに取り込む（初回）

```bash
npm run clasp:pull
```

5. GASエディタで Script Properties を設定

GASエディタの「プロジェクトの設定」→「スクリプト プロパティ」に以下を設定:

- `IMPORT_TARGET_FOLDER_ID`
- `IMPORT_COMPLETED_FOLDER_ID`
- `INTERMEDIATE_FILE_GENERATION_FOLDER_ID`
- `CALENDAR_ID`

6. GASエディタで「Drive（高度なGoogleサービス）」を有効化

- GASエディタ左メニューの「サービス」から `Drive API` を追加してください。
- 本ツールは `Drive.Files.copy(...)` を使用するため、`Drive API` の有効化が必須です。

## 日常運用コマンド

変更確認:

```bash
npm run clasp:status
```

ローカル変更をGASへ反映:

```bash
npm run clasp:push
```

GASエディタを開く:

```bash
npm run clasp:open
```

ログアウト:

```bash
npm run clasp:logout
```

## 補足

- `.clasp.json` は `scriptId` を含むため `.gitignore` で除外しています。
- `rootDir` は `src` に設定しています（大規模開発向けの推奨構成）。
- 同期除外は `.claspignore` で制御しています。
