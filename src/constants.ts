/** ログシート名 */
export const LOG_SHEET_NAME = "ログ";

/** 操作パネル項目名（スプレッドシート上のラベル） */
export const CONTROL_PANEL_MODE_LABEL = "モード";

/** 操作パネル項目名（スプレッドシート上のラベル） */
export const CONTROL_PANEL_DOCUMENT_URLS_LABEL = "ドキュメントURL";

/** 操作パネル: 実行モード（ScheduleImportMode） */
export const CONTROL_PANEL_MODE_CELL = "B2";

/** 操作パネル: ドキュメント URL / ファイル ID（importOnly 時） */
export const CONTROL_PANEL_DOCUMENT_URLS_CELL = "B3";

/**
 * 操作パネル「概要」セルに貼り付ける説明文。
 * スプレッドシート上では「モード」「ドキュメントURL」の項目名で案内する。
 */
export const CONTROL_PANEL_OVERVIEW_TEXT = [
  "本シートは、TMHスケジュールを Google カレンダーへ取り込むための操作パネルです。",
  "「モード」と「ドキュメントURL」を設定し、「インポートの開始」から実行してください。",
  "処理の記録は「ログ」シートを確認してください。",
  "",
  "【モードに指定する値】",
  "all … 本番（フェーズ1：ドキュメント作成 → フェーズ2：カレンダー登録 → フェーズ3：完了フォルダへ移動）",
  "createDocumentsOnly … フェーズ1のみ（ドキュメント作成。ログのファイルIDを確認）",
  "importOnly … フェーズ2のみ（カレンダー登録。「ドキュメントURL」の指定が必要）",
  "moveOnly … フェーズ3のみ（インポート対象ファイルを完了フォルダへ移動）",
  "",
  "本番ではモードを all、「ドキュメントURL」は空にしてください。",
].join("\n");

/** スプレッドシートのセルの最大文字数 */
export const MAX_CELL_LENGTH = 50000;
