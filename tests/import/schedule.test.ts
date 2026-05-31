import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  DEFAULT_SCHEDULE_IMPORT_RUN,
  importSchedule,
  importScheduleCreateDocuments,
  importScheduleMoveTargets,
  importScheduleToCalendar,
} from "../../src/import/schedule";
import { LOG_SHEET_NAME } from "../../src/constants";
import { getRequiredConfig } from "../../src/config/scriptProperties";
import { writeLog } from "../../src/logging/writeLog";
import { createDocuments, getText } from "../../src/drive/document";
import { getTagetFileIds, scanImportTargetFolder } from "../../src/drive/targets";
import { deleteFileByName, moveFileToFolder } from "../../src/drive/files";
import { saveNormalizedTextFile } from "../../src/drive/text";
import { createCalendarImportFile } from "../../src/calendar/parser";
import { importCSVtoCalendar } from "../../src/calendar/import";

vi.mock("../../src/config/scriptProperties");
vi.mock("../../src/logging/writeLog");
vi.mock("../../src/drive/document");
vi.mock("../../src/drive/targets");
vi.mock("../../src/drive/files");
vi.mock("../../src/drive/text");
vi.mock("../../src/calendar/parser");
vi.mock("../../src/calendar/import");

const DOCUMENT_URL =
  "https://docs.google.com/document/d/1psjqhg0trmUAtcnrC4mcLlFF7YnxugF0FJNix5bAM4Y/edit?usp=sharing";
const DOCUMENT_ID = "1psjqhg0trmUAtcnrC4mcLlFF7YnxugF0FJNix5bAM4Y";

function setupSuccessfulCalendarImportMocks(): void {
  vi.mocked(getText).mockReturnValue("■1/15(月)10:00会議");
  vi.mocked(DriveApp.getFileById).mockReturnValue({
    getName: vi.fn(() => "scan.png"),
  } as never);
  vi.mocked(createCalendarImportFile).mockReturnValue("csv-1");
  vi.mocked(saveNormalizedTextFile).mockReturnValue("txt-1");
}

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
    vi.mocked(scanImportTargetFolder).mockReset();
    vi.mocked(deleteFileByName).mockReset();
    vi.mocked(saveNormalizedTextFile).mockReset();
    vi.mocked(createCalendarImportFile).mockReset();
    vi.mocked(importCSVtoCalendar).mockReset();
    vi.mocked(moveFileToFolder).mockReset();
    vi.mocked(Browser.msgBox).mockReset();
    vi.mocked(DriveApp.getFileById).mockReset();

    vi.mocked(getRequiredConfig).mockImplementation((key) => `config-${key}`);
    vi.mocked(scanImportTargetFolder).mockReturnValue({
      targetFileIds: [],
      skippedFiles: [],
    });
    vi.mocked(DriveApp.getFolderById).mockReturnValue({
      getName: vi.fn(() => "テストフォルダ"),
    } as never);
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

  describe('mode: "all"', () => {
    it("変換対象がない場合は警告ダイアログを表示する", () => {
      vi.mocked(createDocuments).mockReturnValue([]);

      importSchedule(DEFAULT_SCHEDULE_IMPORT_RUN);

      expect(mockClear).toHaveBeenCalled();
      expect(writeLog).toHaveBeenCalledWith(
        "インポート対象に該当ファイルがありません。",
      );
      expect(Browser.msgBox).toHaveBeenCalledWith(
        "警告",
        expect.any(String),
        Browser.Buttons.OK,
      );
    });

    it("正常完了時は成功ダイアログを表示する", () => {
      vi.mocked(createDocuments).mockReturnValue([
        { sourceFileId: "target-1", convertedFileId: "doc-1" },
      ]);
      setupSuccessfulCalendarImportMocks();

      importSchedule(DEFAULT_SCHEDULE_IMPORT_RUN);

      expect(deleteFileByName).toHaveBeenCalledWith("scan.png.csv");
      expect(saveNormalizedTextFile).not.toHaveBeenCalled();
      expect(importCSVtoCalendar).toHaveBeenCalledWith(
        "csv-1",
        "config-CALENDAR_ID",
      );
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
      vi.mocked(createDocuments).mockReturnValue([
        { sourceFileId: "target-1", convertedFileId: "doc-1" },
      ]);
      vi.mocked(getText).mockImplementation(() => {
        throw new Error("変換失敗");
      });
      vi.mocked(DriveApp.getFileById).mockReturnValue({
        getName: vi.fn(() => "scan"),
      } as never);

      importSchedule(DEFAULT_SCHEDULE_IMPORT_RUN);

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

      importSchedule(DEFAULT_SCHEDULE_IMPORT_RUN);

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

      importSchedule(DEFAULT_SCHEDULE_IMPORT_RUN);

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
      vi.mocked(createDocuments).mockReturnValue([
        { sourceFileId: "target-1", convertedFileId: "doc-1" },
      ]);
      vi.mocked(getText).mockImplementation(() => {
        throw "file raw error";
      });
      vi.mocked(DriveApp.getFileById).mockReturnValue({
        getName: vi.fn(() => "scan"),
      } as never);

      importSchedule(DEFAULT_SCHEDULE_IMPORT_RUN);

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

  describe('mode: "createDocumentsOnly"', () => {
    it("ドキュメント作成後にカレンダーインポートと移動を行わない", () => {
      vi.mocked(createDocuments).mockReturnValue([
        { sourceFileId: "target-1", convertedFileId: "doc-1" },
      ]);

      importSchedule({
        mode: "createDocumentsOnly",
        manualDocumentUrls: [],
      });

      expect(createDocuments).toHaveBeenCalled();
      expect(importCSVtoCalendar).not.toHaveBeenCalled();
      expect(moveFileToFolder).not.toHaveBeenCalled();
      expect(Browser.msgBox).toHaveBeenCalledWith(
        "成功",
        expect.any(String),
        Browser.Buttons.OK,
      );
    });
  });

  describe('mode: "importOnly"', () => {
    it("URL からファイルIDを解決してカレンダーインポートする", () => {
      setupSuccessfulCalendarImportMocks();

      importSchedule({
        mode: "importOnly",
        manualDocumentUrls: [DOCUMENT_URL],
      });

      expect(createDocuments).not.toHaveBeenCalled();
      expect(DriveApp.getFileById).toHaveBeenCalledWith(DOCUMENT_ID);
      expect(saveNormalizedTextFile).toHaveBeenCalledWith(
        "scan.png",
        "■1/15(月)10:00会議",
        "config-INTERMEDIATE_FILE_GENERATION_FOLDER_ID",
      );
      expect(importCSVtoCalendar).toHaveBeenCalledWith(
        "csv-1",
        "config-CALENDAR_ID",
      );
      expect(moveFileToFolder).not.toHaveBeenCalled();
    });

    it("ファイルIDを直接指定してカレンダーインポートする", () => {
      setupSuccessfulCalendarImportMocks();

      importSchedule({
        mode: "importOnly",
        manualDocumentUrls: [DOCUMENT_ID],
      });

      expect(createDocuments).not.toHaveBeenCalled();
      expect(DriveApp.getFileById).toHaveBeenCalledWith(DOCUMENT_ID);
      expect(importCSVtoCalendar).toHaveBeenCalled();
    });

    it("manualDocumentUrls が空の場合は警告ダイアログを表示する", () => {
      importSchedule({ mode: "importOnly", manualDocumentUrls: [] });

      expect(createDocuments).not.toHaveBeenCalled();
      expect(importCSVtoCalendar).not.toHaveBeenCalled();
      expect(writeLog).toHaveBeenCalledWith(
        "importOnly では manualDocumentUrls にドキュメント URL またはファイルIDを指定してください。",
      );
      expect(Browser.msgBox).toHaveBeenCalledWith(
        "警告",
        expect.any(String),
        Browser.Buttons.OK,
      );
    });
  });

  describe('mode: "moveOnly"', () => {
    it("インポート対象の移動のみ行う", () => {
      vi.mocked(scanImportTargetFolder).mockReturnValue({
        targetFileIds: ["target-1"],
        skippedFiles: [],
      });

      importSchedule({ mode: "moveOnly", manualDocumentUrls: [] });

      expect(createDocuments).not.toHaveBeenCalled();
      expect(importCSVtoCalendar).not.toHaveBeenCalled();
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

    it("移動対象が0件の場合は警告を記録する", () => {
      vi.mocked(scanImportTargetFolder).mockReturnValue({
        targetFileIds: [],
        skippedFiles: [],
      });

      importSchedule({ mode: "moveOnly", manualDocumentUrls: [] });

      expect(writeLog).toHaveBeenCalledWith(
        "警告: 移動対象の画像/PDFファイルが0件です。",
      );
      expect(moveFileToFolder).not.toHaveBeenCalled();
      expect(Browser.msgBox).toHaveBeenCalledWith(
        "警告",
        expect.any(String),
        Browser.Buttons.OK,
      );
    });

    it("フォルダ走査で対象外ファイルがある場合はログに記録する", () => {
      vi.mocked(scanImportTargetFolder).mockReturnValue({
        targetFileIds: [],
        skippedFiles: [
          {
            fileId: "txt-1",
            fileName: "a.txt",
            mimeType: "text/plain",
          },
        ],
      });

      importSchedule({ mode: "moveOnly", manualDocumentUrls: [] });

      expect(writeLog).toHaveBeenCalledWith(
        expect.stringContaining("対象外（画像/PDF以外）"),
      );
    });

    it("インポート対象フォルダにアクセスできない場合は警告を記録する", () => {
      let folderCallCount = 0;
      vi.mocked(DriveApp.getFolderById).mockImplementation(() => {
        folderCallCount += 1;
        if (folderCallCount <= 3) {
          return { getName: vi.fn(() => "テストフォルダ") } as never;
        }
        throw new Error("target access denied");
      });

      importSchedule({ mode: "moveOnly", manualDocumentUrls: [] });

      expect(writeLog).toHaveBeenCalledWith(
        expect.stringContaining("インポート対象フォルダID"),
      );
      expect(moveFileToFolder).not.toHaveBeenCalled();
      expect(Browser.msgBox).toHaveBeenCalledWith(
        "警告",
        expect.any(String),
        Browser.Buttons.OK,
      );
    });

    it("インポート対象フォルダへのアクセス失敗が非 Error でも警告を記録する", () => {
      let folderCallCount = 0;
      vi.mocked(DriveApp.getFolderById).mockImplementation(() => {
        folderCallCount += 1;
        if (folderCallCount <= 3) {
          return { getName: vi.fn(() => "テストフォルダ") } as never;
        }
        throw "target raw error";
      });

      importSchedule({ mode: "moveOnly", manualDocumentUrls: [] });

      expect(writeLog).toHaveBeenCalledWith(
        expect.stringContaining("target raw error"),
      );
    });

    it("インポート完了フォルダにアクセスできない場合は警告を記録する", () => {
      let folderCallCount = 0;
      vi.mocked(DriveApp.getFolderById).mockImplementation(() => {
        folderCallCount += 1;
        if (folderCallCount <= 4) {
          return { getName: vi.fn(() => "テストフォルダ") } as never;
        }
        throw new Error("completed access denied");
      });

      importSchedule({ mode: "moveOnly", manualDocumentUrls: [] });

      expect(writeLog).toHaveBeenCalledWith(
        expect.stringContaining("インポート完了フォルダID"),
      );
      expect(moveFileToFolder).not.toHaveBeenCalled();
      expect(Browser.msgBox).toHaveBeenCalledWith(
        "警告",
        expect.any(String),
        Browser.Buttons.OK,
      );
    });

    it("ファイル移動に失敗した場合は警告を記録する", () => {
      vi.mocked(scanImportTargetFolder).mockReturnValue({
        targetFileIds: ["target-1"],
        skippedFiles: [],
      });
      vi.mocked(moveFileToFolder).mockImplementation(() => {
        throw new Error("move failed");
      });

      importSchedule({ mode: "moveOnly", manualDocumentUrls: [] });

      expect(writeLog).toHaveBeenCalledWith(
        expect.stringContaining("移動失敗"),
      );
      expect(Browser.msgBox).toHaveBeenCalledWith(
        "警告",
        expect.any(String),
        Browser.Buttons.OK,
      );
    });

    it("非 Error の移動失敗でも警告を記録する", () => {
      vi.mocked(scanImportTargetFolder).mockReturnValue({
        targetFileIds: ["target-1"],
        skippedFiles: [],
      });
      vi.mocked(moveFileToFolder).mockImplementation(() => {
        throw "raw move error";
      });

      importSchedule({ mode: "moveOnly", manualDocumentUrls: [] });

      expect(writeLog).toHaveBeenCalledWith(
        expect.stringContaining("移動失敗"),
      );
      expect(writeLog).toHaveBeenCalledWith(
        expect.stringContaining("raw move error"),
      );
    });
  });

  describe("設定・変換の診断ログ", () => {
    it("設定フォルダ名の取得に Error が発生しても処理を続行する", () => {
      vi.mocked(DriveApp.getFolderById).mockImplementation((id: string) => {
        if (id === "config-INTERMEDIATE_FILE_GENERATION_FOLDER_ID") {
          throw new Error("config folder error");
        }
        return { getName: vi.fn(() => "テストフォルダ") } as never;
      });
      vi.mocked(createDocuments).mockReturnValue([
        { sourceFileId: "target-1", convertedFileId: "doc-1" },
      ]);
      setupSuccessfulCalendarImportMocks();

      importSchedule(DEFAULT_SCHEDULE_IMPORT_RUN);

      expect(writeLog).toHaveBeenCalledWith(
        expect.stringContaining("config folder error"),
      );
      expect(moveFileToFolder).toHaveBeenCalled();
    });

    it("設定フォルダ名の取得で非 Error が発生しても処理を続行する", () => {
      vi.mocked(DriveApp.getFolderById).mockImplementation((id: string) => {
        if (id === "config-IMPORT_COMPLETED_FOLDER_ID") {
          throw "folder raw error";
        }
        return { getName: vi.fn(() => "テストフォルダ") } as never;
      });
      vi.mocked(createDocuments).mockReturnValue([
        { sourceFileId: "target-1", convertedFileId: "doc-1" },
      ]);
      setupSuccessfulCalendarImportMocks();

      importSchedule(DEFAULT_SCHEDULE_IMPORT_RUN);

      expect(writeLog).toHaveBeenCalledWith(
        expect.stringContaining("folder raw error"),
      );
    });

    it("画像/PDF以外のみある場合は対象外ファイルをログに記録する", () => {
      vi.mocked(scanImportTargetFolder).mockReturnValue({
        targetFileIds: [],
        skippedFiles: [
          {
            fileId: "txt-1",
            fileName: "a.txt",
            mimeType: "text/plain",
          },
        ],
      });
      vi.mocked(createDocuments).mockReturnValue([]);

      importSchedule(DEFAULT_SCHEDULE_IMPORT_RUN);

      expect(writeLog).toHaveBeenCalledWith(
        expect.stringContaining("対象外（画像/PDF以外）"),
      );
      expect(writeLog).toHaveBeenCalledWith(
        expect.stringContaining("画像/PDF 以外のため対象外"),
      );
    });

    it("変換対象がある場合も対象外ファイルをログに記録する", () => {
      vi.mocked(scanImportTargetFolder).mockReturnValue({
        targetFileIds: ["img-1"],
        skippedFiles: [
          {
            fileId: "txt-1",
            fileName: "a.txt",
            mimeType: "text/plain",
          },
        ],
      });
      vi.mocked(createDocuments).mockReturnValue([
        { sourceFileId: "img-1", convertedFileId: "doc-1" },
      ]);
      setupSuccessfulCalendarImportMocks();

      importSchedule(DEFAULT_SCHEDULE_IMPORT_RUN);

      expect(writeLog).toHaveBeenCalledWith(
        expect.stringContaining("対象外（画像/PDF以外）"),
      );
    });
  });
});

describe("importScheduleCreateDocuments", () => {
  const mockClear = vi.fn();
  const mockLogSheet = { clear: mockClear };

  beforeEach(() => {
    mockClear.mockClear();
    vi.mocked(writeLog).mockReset();
    vi.mocked(getRequiredConfig).mockReset();
    vi.mocked(createDocuments).mockReset();
    vi.mocked(scanImportTargetFolder).mockReset();
    vi.mocked(importCSVtoCalendar).mockReset();
    vi.mocked(moveFileToFolder).mockReset();
    vi.mocked(Browser.msgBox).mockReset();

    vi.mocked(getRequiredConfig).mockImplementation((key) => `config-${key}`);
    vi.mocked(scanImportTargetFolder).mockReturnValue({
      targetFileIds: ["target-1"],
      skippedFiles: [],
    });
    vi.mocked(DriveApp.getFolderById).mockReturnValue({
      getName: vi.fn(() => "テストフォルダ"),
    } as never);
    vi.mocked(SpreadsheetApp.getActiveSpreadsheet).mockReturnValue({
      getSheetByName: vi.fn((name: string) =>
        name === LOG_SHEET_NAME ? mockLogSheet : null,
      ),
    } as never);
  });

  it("ドキュメント作成のみ実行する", () => {
    vi.mocked(createDocuments).mockReturnValue([
      { sourceFileId: "target-1", convertedFileId: "doc-1" },
    ]);

    importScheduleCreateDocuments();

    expect(createDocuments).toHaveBeenCalled();
    expect(importCSVtoCalendar).not.toHaveBeenCalled();
    expect(moveFileToFolder).not.toHaveBeenCalled();
  });
});

describe("importScheduleToCalendar", () => {
  const mockClear = vi.fn();
  const mockLogSheet = { clear: mockClear };

  beforeEach(() => {
    mockClear.mockClear();
    vi.mocked(writeLog).mockReset();
    vi.mocked(getRequiredConfig).mockReset();
    vi.mocked(createDocuments).mockReset();
    vi.mocked(getText).mockReset();
    vi.mocked(importCSVtoCalendar).mockReset();
    vi.mocked(Browser.msgBox).mockReset();
    vi.mocked(DriveApp.getFileById).mockReset();

    vi.mocked(getRequiredConfig).mockImplementation((key) => `config-${key}`);
    vi.mocked(SpreadsheetApp.getActiveSpreadsheet).mockReturnValue({
      getSheetByName: vi.fn((name: string) =>
        name === LOG_SHEET_NAME ? mockLogSheet : null,
      ),
    } as never);
  });

  it("指定したドキュメントIDでカレンダーインポートする", () => {
    setupSuccessfulCalendarImportMocks();

    importScheduleToCalendar([DOCUMENT_ID]);

    expect(createDocuments).not.toHaveBeenCalled();
    expect(DriveApp.getFileById).toHaveBeenCalledWith(DOCUMENT_ID);
    expect(importCSVtoCalendar).toHaveBeenCalled();
  });

  it("ドキュメントIDが空の場合は警告ダイアログを表示する", () => {
    importScheduleToCalendar([]);

    expect(importCSVtoCalendar).not.toHaveBeenCalled();
    expect(writeLog).toHaveBeenCalledWith(
      "importOnly では manualDocumentUrls にドキュメント URL またはファイルIDを指定してください。",
    );
    expect(Browser.msgBox).toHaveBeenCalledWith(
      "警告",
      expect.any(String),
      Browser.Buttons.OK,
    );
  });
});

describe("importScheduleMoveTargets", () => {
  const mockClear = vi.fn();
  const mockLogSheet = { clear: mockClear };

  beforeEach(() => {
    mockClear.mockClear();
    vi.mocked(getRequiredConfig).mockReset();
    vi.mocked(createDocuments).mockReset();
    vi.mocked(scanImportTargetFolder).mockReset();
    vi.mocked(moveFileToFolder).mockReset();
    vi.mocked(importCSVtoCalendar).mockReset();
    vi.mocked(Browser.msgBox).mockReset();

    vi.mocked(getRequiredConfig).mockImplementation((key) => `config-${key}`);
    vi.mocked(scanImportTargetFolder).mockReturnValue({
      targetFileIds: ["target-1"],
      skippedFiles: [],
    });
    vi.mocked(DriveApp.getFolderById).mockReturnValue({
      getName: vi.fn(() => "テストフォルダ"),
    } as never);
    vi.mocked(SpreadsheetApp.getActiveSpreadsheet).mockReturnValue({
      getSheetByName: vi.fn((name: string) =>
        name === LOG_SHEET_NAME ? mockLogSheet : null,
      ),
    } as never);
  });

  it("インポート対象の移動のみ実行する", () => {
    vi.mocked(scanImportTargetFolder).mockReturnValue({
      targetFileIds: ["target-1"],
      skippedFiles: [],
    });

    importScheduleMoveTargets();

    expect(createDocuments).not.toHaveBeenCalled();
    expect(importCSVtoCalendar).not.toHaveBeenCalled();
    expect(moveFileToFolder).toHaveBeenCalledWith(
      "target-1",
      "config-IMPORT_COMPLETED_FOLDER_ID",
    );
  });
});
