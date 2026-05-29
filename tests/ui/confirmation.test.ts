import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  formatRunOptionsSummary,
  showConfirmationDialog,
} from "../../src/ui/confirmation";
import { importSchedule } from "../../src/import/schedule";
import type { ScheduleImportRunOptions } from "../../src/import/schedule";

const testRun: ScheduleImportRunOptions = {
  mode: "all",
  manualDocumentUrls: [],
};

vi.mock("../../src/import/schedule", () => ({
  importSchedule: vi.fn(),
}));

describe("formatRunOptionsSummary", () => {
  it("モードのみの要約を返す", () => {
    expect(formatRunOptionsSummary(testRun)).toBe(
      "モード: all\n\nスケジュールインポートを実行しますか？",
    );
  });

  it("ドキュメント件数を含む要約を返す", () => {
    expect(
      formatRunOptionsSummary({
        mode: "importOnly",
        manualDocumentUrls: ["https://example.com/a", "id-b"],
      }),
    ).toBe(
      "モード: importOnly\nドキュメント: 2件\n\nスケジュールインポートを実行しますか？",
    );
  });
});

describe("showConfirmationDialog", () => {
  beforeEach(() => {
    vi.mocked(Browser.msgBox).mockReset();
    vi.mocked(Logger.log).mockReset();
    vi.mocked(importSchedule).mockReset();
  });

  it("ユーザーが yes を選択した場合は importSchedule を実行する", () => {
    vi.mocked(Browser.msgBox).mockReturnValue("yes");

    showConfirmationDialog(testRun);

    expect(Browser.msgBox).toHaveBeenCalledWith(
      "確認",
      formatRunOptionsSummary(testRun),
      Browser.Buttons.YES_NO,
    );
    expect(importSchedule).toHaveBeenCalledWith(testRun);
    expect(Logger.log).not.toHaveBeenCalled();
  });

  it("ユーザーが no を選択した場合はキャンセルログを出力する", () => {
    vi.mocked(Browser.msgBox).mockReturnValue("no");

    showConfirmationDialog(testRun);

    expect(importSchedule).not.toHaveBeenCalled();
    expect(Logger.log).toHaveBeenCalledWith("操作はキャンセルされました。");
  });
});
