import {
  importSchedule,
  type ScheduleImportRunOptions,
} from "../import/schedule";

/**
 * 確認ダイアログに表示する実行内容の要約。
 */
export function formatRunOptionsSummary(
  run: ScheduleImportRunOptions,
): string {
  let result: string = "";

  const documentSummary =
    run.manualDocumentUrls.length > 0
      ? `\nドキュメント: ${run.manualDocumentUrls.length}件`
      : "";
  result = `モード: ${run.mode}${documentSummary}\n\nスケジュールインポートを実行しますか？`;
  return result;
}

/**
 * 確認ダイアログを表示し、ユーザーの選択に応じて処理を実行する。
 */
export function showConfirmationDialog(run: ScheduleImportRunOptions): void {
  const ui = Browser.msgBox(
    "確認",
    formatRunOptionsSummary(run),
    Browser.Buttons.YES_NO,
  );

  if (ui === "yes") {
    importSchedule(run);
  } else {
    Logger.log("操作はキャンセルされました。");
  }
}
