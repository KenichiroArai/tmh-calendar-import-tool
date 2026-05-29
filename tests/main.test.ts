import { describe, it, expect, vi, beforeEach } from "vitest";
import { myFunction } from "../src/main";
import { readScheduleImportRunFromSheet } from "../src/config/runOptionsFromSheet";
import { showConfirmationDialog } from "../src/ui/confirmation";

vi.mock("../src/config/runOptionsFromSheet", () => ({
  readScheduleImportRunFromSheet: vi.fn(),
}));

vi.mock("../src/ui/confirmation", () => ({
  showConfirmationDialog: vi.fn(),
}));

describe("myFunction", () => {
  beforeEach(() => {
    vi.mocked(readScheduleImportRunFromSheet).mockReset();
    vi.mocked(showConfirmationDialog).mockReset();
  });

  it("スプレッドシートの実行オプションを読み取り確認ダイアログに渡す", () => {
    const run = {
      mode: "all" as const,
      manualDocumentUrls: [] as string[],
    };
    vi.mocked(readScheduleImportRunFromSheet).mockReturnValue(run);

    myFunction();

    expect(readScheduleImportRunFromSheet).toHaveBeenCalled();
    expect(showConfirmationDialog).toHaveBeenCalledWith(run);
  });
});
