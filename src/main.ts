import { readScheduleImportRunFromSheet } from "./config/runOptionsFromSheet";
import { showConfirmationDialog } from "./ui/confirmation";

/**
 * メイン関数。操作パネルの「モード」「ドキュメントURL」を読み取り確認ダイアログを表示する。
 *
 * 作業手順（スプレッドシートの各項目を編集）:
 * 1. 本番（フェーズ1〜3）: モード=all、ドキュメントURL=空
 * 2. フェーズ1のみ: モード=createDocumentsOnly、ドキュメントURL=空
 * 3. フェーズ2のみ: モード=importOnly、ドキュメントURLに URL またはファイル ID
 * 4. フェーズ3のみ: モード=moveOnly、ドキュメントURL=空
 */
export function myFunction(): void {
  showConfirmationDialog(readScheduleImportRunFromSheet());
}
