import { describe, it, expect, vi } from "vitest";
import {
  parseManualDocumentUrls,
  parseScheduleImportMode,
  readScheduleImportRunFromSheet,
} from "../../src/config/runOptionsFromSheet";
import {
  CONTROL_PANEL_DOCUMENT_URLS_CELL,
  CONTROL_PANEL_MODE_CELL,
  CONTROL_PANEL_MODE_LABEL,
} from "../../src/constants";

function createSheet(mode: unknown, documentUrls: unknown) {
  const ranges: Record<string, { getValue: () => unknown }> = {
    [CONTROL_PANEL_MODE_CELL]: { getValue: () => mode },
    [CONTROL_PANEL_DOCUMENT_URLS_CELL]: { getValue: () => documentUrls },
  };
  return {
    getRange: vi.fn((a1: string) => ranges[a1]),
  } as unknown as GoogleAppsScript.Spreadsheet.Sheet;
}

describe("parseScheduleImportMode", () => {
  it.each([
    "all",
    "createDocumentsOnly",
    "importOnly",
    "moveOnly",
  ] as const)("有効なモード %s をそのまま返す", (mode) => {
    expect(parseScheduleImportMode(mode)).toBe(mode);
  });

  it("前後の空白を除去する", () => {
    expect(parseScheduleImportMode("  all  ")).toBe("all");
  });

  it("空または不正な値の場合はエラーをスローする", () => {
    expect(() => parseScheduleImportMode("")).toThrow(
      `モードが不正です。「${CONTROL_PANEL_MODE_LABEL}」`,
    );
    expect(() => parseScheduleImportMode("invalid")).toThrow('（入力値: "invalid"）');
    expect(() => parseScheduleImportMode(null)).toThrow('（入力値: ""）');
  });
});

describe("parseManualDocumentUrls", () => {
  it("空の場合は空配列を返す", () => {
    expect(parseManualDocumentUrls("")).toEqual([]);
    expect(parseManualDocumentUrls(null)).toEqual([]);
    expect(parseManualDocumentUrls("   ")).toEqual([]);
  });

  it("1件の URL を返す", () => {
    const url = "https://docs.google.com/document/d/abc/edit";
    expect(parseManualDocumentUrls(url)).toEqual([url]);
  });

  it("改行区切りで複数件を返す", () => {
    expect(
      parseManualDocumentUrls("https://a.example/doc\nhttps://b.example/doc"),
    ).toEqual(["https://a.example/doc", "https://b.example/doc"]);
  });

  it("カンマ区切りで複数件を返す", () => {
    expect(
      parseManualDocumentUrls(
        "https://a.example/doc, https://b.example/doc",
      ),
    ).toEqual(["https://a.example/doc", "https://b.example/doc"]);
  });

  it("空白のみの要素は除外する", () => {
    expect(parseManualDocumentUrls("id1,\n,\nid2")).toEqual(["id1", "id2"]);
  });
});

describe("readScheduleImportRunFromSheet", () => {
  it("シートの B2・B3 から実行オプションを組み立てる", () => {
    const sheet = createSheet("importOnly", "https://example.com/doc\nid-2");

    expect(readScheduleImportRunFromSheet(sheet)).toEqual({
      mode: "importOnly",
      manualDocumentUrls: ["https://example.com/doc", "id-2"],
    });
    expect(sheet.getRange).toHaveBeenCalledWith(CONTROL_PANEL_MODE_CELL);
    expect(sheet.getRange).toHaveBeenCalledWith(
      CONTROL_PANEL_DOCUMENT_URLS_CELL,
    );
  });

  it("引数省略時はアクティブシートから読み取る", () => {
    const sheet = createSheet("all", "");
    vi.mocked(SpreadsheetApp.getActiveSpreadsheet).mockReturnValue({
      getActiveSheet: vi.fn(() => sheet),
    } as never);

    expect(readScheduleImportRunFromSheet()).toEqual({
      mode: "all",
      manualDocumentUrls: [],
    });
  });
});
