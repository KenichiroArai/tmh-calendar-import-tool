import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteFileById, deleteFileByName, moveFileToFolder } from "../../src/drive/files";

describe("deleteFileById", () => {
  beforeEach(() => {
    vi.mocked(DriveApp.getFileById).mockReset();
    vi.mocked(DriveApp.getFilesByName).mockReset();
  });

  it("対象外ファイル以外を削除する", () => {
    const mockSetTrashed = vi.fn();
    vi.mocked(DriveApp.getFileById).mockReturnValue({
      getName: vi.fn(() => "test-file.png"),
    } as never);

    const mockFiles = [
      { getId: () => "file-1", setTrashed: mockSetTrashed },
      { getId: () => "excluded-id", setTrashed: vi.fn() },
    ];
    let index = 0;
    vi.mocked(DriveApp.getFilesByName).mockReturnValue({
      hasNext: vi.fn(() => index < mockFiles.length),
      next: vi.fn(() => mockFiles[index++]),
    } as never);

    deleteFileById("file-id", "excluded-id");

    expect(mockSetTrashed).toHaveBeenCalledWith(true);
  });
});

describe("deleteFileByName", () => {
  beforeEach(() => {
    vi.mocked(DriveApp.getFilesByName).mockReset();
  });

  it("ファイル名に一致するファイルを全て削除する", () => {
    const mockSetTrashed1 = vi.fn();
    const mockSetTrashed2 = vi.fn();
    const mockFiles = [
      { setTrashed: mockSetTrashed1 },
      { setTrashed: mockSetTrashed2 },
    ];
    let index = 0;
    vi.mocked(DriveApp.getFilesByName).mockReturnValue({
      hasNext: vi.fn(() => index < mockFiles.length),
      next: vi.fn(() => mockFiles[index++]),
    } as never);

    deleteFileByName("test-file.csv");

    expect(mockSetTrashed1).toHaveBeenCalledWith(true);
    expect(mockSetTrashed2).toHaveBeenCalledWith(true);
  });
});

describe("moveFileToFolder", () => {
  beforeEach(() => {
    vi.mocked(DriveApp.getFileById).mockReset();
    vi.mocked(DriveApp.getFolderById).mockReset();
  });

  it("ファイルを指定フォルダに移動する", () => {
    const mockMoveTo = vi.fn();
    vi.mocked(DriveApp.getFileById).mockReturnValue({
      moveTo: mockMoveTo,
    } as never);

    const mockFolder = {};
    vi.mocked(DriveApp.getFolderById).mockReturnValue(mockFolder as never);

    moveFileToFolder("file-id", "folder-id");

    expect(mockMoveTo).toHaveBeenCalledWith(mockFolder);
  });
});
