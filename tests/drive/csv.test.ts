import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCsvFile } from "../../src/drive/csv";

describe("createCsvFile", () => {
  const mockMoveTo = vi.fn();
  const mockGetId = vi.fn(() => "new-csv-file-id");

  beforeEach(() => {
    mockMoveTo.mockClear();
    mockGetId.mockClear();

    const mockBlob = {
      setDataFromString: vi.fn(function (this: unknown) {
        return this;
      }),
    };
    vi.mocked(Utilities.newBlob).mockReturnValue(mockBlob as never);

    const mockFile = {
      getId: mockGetId,
      moveTo: mockMoveTo,
    };
    const mockFolder = {
      createFile: vi.fn(() => mockFile),
      getFiles: vi.fn(),
    };
    vi.mocked(DriveApp.getFolderById).mockReturnValue(mockFolder as never);
  });

  it("CSV ファイルを作成しファイル ID を返す", () => {
    const result = createCsvFile(
      "folder-id",
      "test.csv",
      "1/15, 10:00, 会議, 会議",
      "output-folder-id",
    );

    expect(result).toBe("new-csv-file-id");
  });

  it("Utilities.newBlob を正しいパラメータで呼び出す", () => {
    createCsvFile("folder-id", "test.csv", "contents", "output-folder-id");

    expect(Utilities.newBlob).toHaveBeenCalledWith("", "text/csv", "test.csv");
  });

  it("ファイルを出力フォルダに移動する", () => {
    createCsvFile("folder-id", "test.csv", "contents", "output-folder-id");

    expect(mockMoveTo).toHaveBeenCalled();
  });
});
