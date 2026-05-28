import { describe, it, expect, vi, beforeEach } from "vitest";
import { showConfirmationDialog } from "../../src/ui/confirmation";
import { importSchedule } from "../../src/import/schedule";

vi.mock("../../src/import/schedule", () => ({
  importSchedule: vi.fn(),
}));

describe("showConfirmationDialog", () => {
  beforeEach(() => {
    vi.mocked(Browser.msgBox).mockReset();
    vi.mocked(Logger.log).mockReset();
    vi.mocked(importSchedule).mockReset();
  });

  it("ユーザーが yes を選択した場合は importSchedule を実行する", () => {
    vi.mocked(Browser.msgBox).mockReturnValue("yes");

    showConfirmationDialog();

    expect(importSchedule).toHaveBeenCalledTimes(1);
    expect(Logger.log).not.toHaveBeenCalled();
  });

  it("ユーザーが no を選択した場合はキャンセルログを出力する", () => {
    vi.mocked(Browser.msgBox).mockReturnValue("no");

    showConfirmationDialog();

    expect(importSchedule).not.toHaveBeenCalled();
    expect(Logger.log).toHaveBeenCalledWith("操作はキャンセルされました。");
  });
});
