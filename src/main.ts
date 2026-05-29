import type { ScheduleImportRunOptions } from "./import/schedule";
import { showConfirmationDialog } from "./ui/confirmation";

/**
 * スケジュールインポートの実行範囲（モード切り替えはこの定数のみを編集する）。
 *
 * 作業手順:
 * 1. 本番（フェーズ1〜3を連続実行）
 *    - mode: "all"
 *    - manualDocumentUrls: []
 *
 * 2. フェーズ1のみ（ドキュメント作成してログのファイルIDを確認）
 *    - mode: "createDocumentsOnly"
 *    - manualDocumentUrls: []
 *
 * 3. フェーズ2のみ（作成済みドキュメントでカレンダーインポートを検証）
 *    - mode: "importOnly"
 *    - manualDocumentUrls: ["https://docs.google.com/document/d/.../edit?usp=sharing"]
 *      （ファイルIDを直接指定する場合は ID 文字列をそのまま記載可）
 *
 * 4. フェーズ3のみ（インポート対象を完了フォルダへ移動）
 *    - mode: "moveOnly"
 *    - manualDocumentUrls: []
 */
export const SCHEDULE_IMPORT_RUN: ScheduleImportRunOptions = {
  mode: "all",
  manualDocumentUrls: [],
};

/**
 * メイン関数。確認ダイアログを表示する。
 */
export function myFunction(): void {
  showConfirmationDialog(SCHEDULE_IMPORT_RUN);
}
