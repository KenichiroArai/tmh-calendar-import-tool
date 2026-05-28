import { describe, it, expect, vi, beforeEach } from "vitest";
import { writeLog } from "../../src/logging/writeLog";
import { LOG_SHEET_NAME, MAX_CELL_LENGTH } from "../../src/constants";

describe("writeLog", () => {
  const mockSetValue = vi.fn();
  let lastRow = 0;

  const mockRange = {
    setValue: mockSetValue,
  };

  const mockLogSheet = {
    getLastRow: vi.fn(() => lastRow),
    getRange: vi.fn(() => mockRange),
  };

  beforeEach(() => {
    lastRow = 0;
    mockSetValue.mockClear();
    vi.mocked(mockLogSheet.getLastRow).mockImplementation(() => lastRow);
    vi.mocked(mockLogSheet.getRange).mockImplementation(() => mockRange);
    vi.mocked(SpreadsheetApp.getActiveSpreadsheet).mockReturnValue({
      getSheetByName: vi.fn((name: string) =>
        name === LOG_SHEET_NAME ? mockLogSheet : null,
      ),
    } as never);
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("ログシートにメッセージを1行書き込む", () => {
    writeLog("テストメッセージ");

    expect(console.log).toHaveBeenCalledWith("テストメッセージ");
    expect(mockLogSheet.getRange).toHaveBeenCalledWith(1, 1);
    expect(mockSetValue).toHaveBeenCalledWith("テストメッセージ");
  });

  it("ログシートが見つからない場合はエラーをスローする", () => {
    vi.mocked(SpreadsheetApp.getActiveSpreadsheet).mockReturnValue({
      getSheetByName: vi.fn(() => null),
    } as never);

    expect(() => writeLog("テスト")).toThrow(
      "ログシートが見つかりません。シート名「" + LOG_SHEET_NAME + "」を確認してください。",
    );
  });

  it("セル最大文字数を超えるメッセージを分割して書き込む", () => {
    const longMessage = "a".repeat(MAX_CELL_LENGTH + 100);
    vi.mocked(mockLogSheet.getLastRow).mockImplementation(() => {
      const current = lastRow;
      lastRow++;
      return current;
    });

    writeLog(longMessage);

    expect(mockSetValue).toHaveBeenCalledTimes(2);
    expect(mockSetValue.mock.calls[0][0]).toHaveLength(MAX_CELL_LENGTH);
    expect(mockSetValue.mock.calls[1][0]).toHaveLength(100);
  });
});
