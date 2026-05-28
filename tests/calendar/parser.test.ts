import { describe, it, expect, vi } from "vitest";
import { getWriteContents, createCalendarImportFile } from "../../src/calendar/parser";

vi.mock("../../src/drive/csv", () => ({
  createCsvFile: vi.fn(() => "mock-csv-file-id"),
}));

describe("getWriteContents", () => {
  it("通常のスケジュール行を CSV 形式に変換する", () => {
    const matchResult = [
      "全体マッチ",
      "1/15",
      "10:00",
      "会議",
    ] as unknown as RegExpMatchArray;

    const result = getWriteContents(matchResult);
    expect(result).toBe("\n1/15, 10:00, 会議, 会議");
  });

  it("■を含む行を2つのエントリに分割する", () => {
    const matchResult = [
      "全体マッチ",
      "1/15",
      "10:00",
      "会議■2/20(月)14:30 打合せ",
    ] as unknown as RegExpMatchArray;

    const result = getWriteContents(matchResult);
    expect(result).toContain("1/15, 10:00, 会議, 会議");
    expect(result).toContain("2/20, 14:30, 打合せ, 打合せ");
  });

  it("■を含むが PATTERN_DATA2 に一致しない場合は空文字を返す", () => {
    const matchResult = [
      "全体マッチ",
      "1/15",
      "10:00",
      "■不正データ",
    ] as unknown as RegExpMatchArray;

    const result = getWriteContents(matchResult);
    expect(result).toBe("");
  });
});

describe("createCalendarImportFile", () => {
  it("スケジュールテキストをパースして CSV ファイルを作成する", () => {
    const contents = " 1/15(月)10:00 会議";
    const result = createCalendarImportFile(
      "folder-id",
      "test.csv",
      contents,
      "output-folder-id",
    );
    expect(result).toBe("mock-csv-file-id");
  });

  it("■以外で始まりデータパターンに一致する行を CSV 形式に変換する", async () => {
    const { createCsvFile } = await import("../../src/drive/csv");
    const mockedCreateCsvFile = vi.mocked(createCsvFile);
    mockedCreateCsvFile.mockClear();

    createCalendarImportFile(
      "folder-id",
      "test.csv",
      "a1/15(月)10:00 会議",
      "output-folder-id",
    );

    const csvContents = mockedCreateCsvFile.mock.calls[0][2];
    expect(csvContents).toContain("1/15, 10:00, 会議, 会議");
  });

  it("空行やスペースのみの行をスキップする", async () => {
    const { createCsvFile } = await import("../../src/drive/csv");
    const mockedCreateCsvFile = vi.mocked(createCsvFile);
    mockedCreateCsvFile.mockClear();

    const contents = "\n  \n 1/15(月)10:00 会議\n\n";
    createCalendarImportFile(
      "folder-id",
      "test.csv",
      contents,
      "output-folder-id",
    );

    expect(mockedCreateCsvFile).toHaveBeenCalledWith(
      "folder-id",
      "test.csv",
      expect.any(String),
      "output-folder-id",
    );
  });

  it("データパターンに一致しない行はそのまま連結する", async () => {
    const { createCsvFile } = await import("../../src/drive/csv");
    const mockedCreateCsvFile = vi.mocked(createCsvFile);
    mockedCreateCsvFile.mockClear();

    const contents = "ヘッダー行\n 1/15(月)10:00 会議";
    createCalendarImportFile(
      "folder-id",
      "test.csv",
      contents,
      "output-folder-id",
    );

    const csvContents = mockedCreateCsvFile.mock.calls[0][2];
    // substring(1) で先頭1文字が除去されるため "ッダー行" になる
    expect(csvContents).toContain("ッダー行");
  });

  it("■で始まる行をパースする", async () => {
    const { createCsvFile } = await import("../../src/drive/csv");
    const mockedCreateCsvFile = vi.mocked(createCsvFile);
    mockedCreateCsvFile.mockClear();

    const contents = "■1/15(月)10:00 会議";
    createCalendarImportFile(
      "folder-id",
      "test.csv",
      contents,
      "output-folder-id",
    );

    const csvContents = mockedCreateCsvFile.mock.calls[0][2];
    expect(csvContents).toContain("1/15, 10:00, 会議, 会議");
  });

  it("■で始まるがパターン不一致の行をスキップする", async () => {
    const { createCsvFile } = await import("../../src/drive/csv");
    const mockedCreateCsvFile = vi.mocked(createCsvFile);
    mockedCreateCsvFile.mockClear();

    createCalendarImportFile(
      "folder-id",
      "test.csv",
      "■不正",
      "output-folder-id",
    );

    const csvContents = mockedCreateCsvFile.mock.calls[0][2];
    expect(csvContents).toBe("");
  });
});
