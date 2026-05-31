import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTextFile, saveNormalizedTextFile } from "../../src/drive/text";
import { deleteFileByName } from "../../src/drive/files";

vi.mock("../../src/drive/files", () => ({
  deleteFileByName: vi.fn(),
}));

describe("createTextFile", () => {
  const mockMoveTo = vi.fn();
  const mockGetId = vi.fn(() => "new-text-file-id");

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
    };
    vi.mocked(DriveApp.getFolderById).mockReturnValue(mockFolder as never);
  });

  it("テキストファイルを作成しファイル ID を返す", () => {
    const result = createTextFile(
      "folder-id",
      "scan.png.txt",
      "■1/15(月)10:00会議",
      "output-folder-id",
    );

    expect(result).toBe("new-text-file-id");
  });

  it("Utilities.newBlob を正しいパラメータで呼び出す", () => {
    createTextFile("folder-id", "scan.png.txt", "contents", "output-folder-id");

    expect(Utilities.newBlob).toHaveBeenCalledWith(
      "",
      "text/plain",
      "scan.png.txt",
    );
  });

  it("ファイルを出力フォルダに移動する", () => {
    createTextFile("folder-id", "scan.png.txt", "contents", "output-folder-id");

    expect(mockMoveTo).toHaveBeenCalled();
  });
});

describe("saveNormalizedTextFile", () => {
  beforeEach(() => {
    vi.mocked(deleteFileByName).mockReset();

    const mockBlob = {
      setDataFromString: vi.fn(function (this: unknown) {
        return this;
      }),
    };
    vi.mocked(Utilities.newBlob).mockReturnValue(mockBlob as never);

    const mockFile = {
      getId: vi.fn(() => "saved-text-file-id"),
      moveTo: vi.fn(),
    };
    const mockFolder = {
      createFile: vi.fn(() => mockFile),
    };
    vi.mocked(DriveApp.getFolderById).mockReturnValue(mockFolder as never);
  });

  it("同名ファイルを削除して正規化テキストを保存する", () => {
    const result = saveNormalizedTextFile(
      "scan.png",
      "■1/15(月)10:00会議",
      "output-folder-id",
    );

    expect(deleteFileByName).toHaveBeenCalledWith("scan.png.txt");
    expect(result).toBe("saved-text-file-id");
  });
});
