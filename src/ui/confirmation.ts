import { importSchedule } from "../import/schedule";

/**
 * 確認ダイアログを表示し、ユーザーの選択に応じて処理を実行する。
 */
export function showConfirmationDialog(): void {
  const ui = Browser.msgBox(
    "確認",
    "スケジュールインポートを実行しますか？",
    Browser.Buttons.YES_NO,
  );

  if (ui === "yes") {
    importSchedule();
  } else {
    Logger.log("操作はキャンセルされました。");
  }
}
