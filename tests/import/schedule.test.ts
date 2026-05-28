import { describe, it, expect, vi, beforeEach } from "vitest";
import { importSchedule } from "../../src/import/schedule";
import { LOG_SHEET_NAME } from "../../src/constants";
import { getRequiredConfig } from "../../src/config/scriptProperties";
import { writeLog } from "../../src/logging/writeLog";
import { createDocuments, getText } from "../../src/drive/document";
import { getTagetFileIds } from "../../src/drive/targets";
import { deleteFileByName, moveFileToFolder } from "../../src/drive/files";
import { createCalendarImportFile } from "../../src/calendar/parser";
import { importCSVtoCalendar } from "../../src/calendar/import";

vi.mock("../../src/config/scriptProperties");
vi.mock("../../src/logging/writeLog");
vi.mock("../../src/drive/document");
vi.mock("../../src/drive/targets");
vi.mock("../../src/drive/files");
vi.mock("../../src/calendar/parser");
vi.mock("../../src/calendar/import");

describe("importSchedule", () => {
  const mockClear = vi.fn();
  const mockLogSheet = { clear: mockClear };

  beforeEach(() => {
    mockClear.mockClear();
    vi.mocked(writeLog).mockReset();
    vi.mocked(getRequiredConfig).mockReset();
    vi.mocked(createDocuments).mockReset();
    vi.mocked(getText).mockReset();
    vi.mocked(getTagetFileIds).mockReset();
    vi.mocked(deleteFileByName).mockReset();
    vi.mocked(createCalendarImportFile).mockReset();
    vi.mocked(importCSVtoCalendar).mockReset();
    vi.mocked(moveFileToFolder).mockReset();
    vi.mocked(Browser.msgBox).mockReset();

    vi.mocked(getRequiredConfig).mockImplementation((key) => `config-${key}`);
    vi.mocked(SpreadsheetApp.getActiveSpreadsheet).mockReturnValue({
      getSheetByName: vi.fn((name: string) =>
        name === LOG_SHEET_NAME ? mockLogSheet : null,
      ),
    } as never);
  });

  it("ログシートが見つからない場合はエラーをスローする", () => {
    vi.mocked(SpreadsheetApp.getActiveSpreadsheet).mockReturnValue({
      getSheetByName: vi.fn(() => null),
    } as never);

    expect(() => importSchedule()).toThrow(
      "ログシートが見つかりません。シート名「" + LOG_SHEET_NAME + "」を確認してください。",
    );
  });

  it("変換対象がない場合は警告ダイアログを表示する", () => {
    vi.mocked(createDocuments).mockReturnValue([]);

    importSchedule();

    expect(mockClear).toHaveBeenCalled();
    expect(writeLog).toHaveBeenCalledWith("インポート対象に該当ファイルがありません。");
    expect(Browser.msgBox).toHaveBeenCalledWith(
      "警告",
      expect.any(String),
      Browser.Buttons.OK,
    );
  });

  it("正常完了時は成功ダイアログを表示する", () => {
    vi.mocked(createDocuments).mockReturnValue(["doc-1"]);
    vi.mocked(getText).mockReturnValue(" 1/15(月)10:00 会議");
    vi.mocked(DriveApp.getFileById).mockReturnValue({
      getName: vi.fn(() => "scan"),
    } as never);
    vi.mocked(createCalendarImportFile).mockReturnValue("csv-1");
    vi.mocked(getTagetFileIds).mockReturnValue(["target-1"]);

    importSchedule();

    expect(deleteFileByName).toHaveBeenCalledWith("scan.csv");
    expect(importCSVtoCalendar).toHaveBeenCalledWith("csv-1", "config-CALENDAR_ID");
    expect(moveFileToFolder).toHaveBeenCalledWith(
      "target-1",
      "config-IMPORT_COMPLETED_FOLDER_ID",
    );
    expect(Browser.msgBox).toHaveBeenCalledWith(
      "成功",
      expect.any(String),
      Browser.Buttons.OK,
    );
  });

  it("ファイル単位のエラー時は警告ダイアログを表示する", () => {
    vi.mocked(createDocuments).mockReturnValue(["doc-1"]);
    vi.mocked(getText).mockImplementation(() => {
      throw new Error("変換失敗");
    });
    vi.mocked(DriveApp.getFileById).mockReturnValue({
      getName: vi.fn(() => "scan"),
    } as never);
    vi.mocked(getTagetFileIds).mockReturnValue([]);

    importSchedule();

    expect(writeLog).toHaveBeenCalledWith(
      expect.stringContaining("エラーが発生しました: 変換失敗"),
    );
    expect(Browser.msgBox).toHaveBeenCalledWith(
      "警告",
      expect.any(String),
      Browser.Buttons.OK,
    );
  });

  it("全体エラー時は失敗ダイアログを表示する", () => {
    vi.mocked(createDocuments).mockImplementation(() => {
      throw new Error("OCR 失敗");
    });

    importSchedule();

    expect(writeLog).toHaveBeenCalledWith(
      expect.stringContaining("エラーが発生しました: OCR 失敗"),
    );
    expect(Browser.msgBox).toHaveBeenCalledWith(
      "失敗",
      expect.any(String),
      Browser.Buttons.OK,
    );
  });

  it("非 Error の throw でもエラーメッセージを記録する", () => {
    vi.mocked(createDocuments).mockImplementation(() => {
      throw "raw error";
    });

    importSchedule();

    expect(writeLog).toHaveBeenCalledWith(
      expect.stringContaining("エラーが発生しました: raw error"),
    );
    expect(Browser.msgBox).toHaveBeenCalledWith(
      "失敗",
      expect.any(String),
      Browser.Buttons.OK,
    );
  });

  it("ファイル単位で非 Error の throw でも警告ダイアログを表示する", () => {
    vi.mocked(createDocuments).mockReturnValue(["doc-1"]);
    vi.mocked(getText).mockImplementation(() => {
      throw "file raw error";
    });
    vi.mocked(DriveApp.getFileById).mockReturnValue({
      getName: vi.fn(() => "scan"),
    } as never);
    vi.mocked(getTagetFileIds).mockReturnValue([]);

    importSchedule();

    expect(writeLog).toHaveBeenCalledWith(
      expect.stringContaining("エラーが発生しました: file raw error"),
    );
    expect(Browser.msgBox).toHaveBeenCalledWith(
      "警告",
      expect.any(String),
      Browser.Buttons.OK,
    );
  });
});
