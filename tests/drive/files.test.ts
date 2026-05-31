import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  deleteDuplicateDocumentsInFolder,
  deleteFileByName,
  moveFileToFolder,
} from "../../src/drive/files";

describe("deleteDuplicateDocumentsInFolder", () => {
  beforeEach(() => {
    vi.mocked(DriveApp.getFileById).mockReset();
    vi.mocked(DriveApp.getFolderById).mockReset();
  });

  it("フォルダ内の同名 Google ドキュメントのみ削除する", () => {
    const mockSetTrashed = vi.fn();
    vi.mocked(DriveApp.getFileById).mockReturnValue({
      getName: vi.fn(() => "scan.png"),
    } as never);

    const mockFiles = [
      {
        getId: () => "keep-id",
        getMimeType: () => MimeType.GOOGLE_DOCS,
        setTrashed: vi.fn(),
      },
      {
        getId: () => "duplicate-doc-id",
        getMimeType: () => MimeType.GOOGLE_DOCS,
        setTrashed: mockSetTrashed,
      },
      {
        getId: () => "source-image-id",
        getMimeType: () => "image/png",
        setTrashed: vi.fn(),
      },
    ];
    let index = 0;
    const mockIterator = {
      hasNext: vi.fn(() => index < mockFiles.length),
      next: vi.fn(() => mockFiles[index++]),
    };
    vi.mocked(DriveApp.getFolderById).mockReturnValue({
      getFilesByName: vi.fn(() => mockIterator),
    } as never);

    deleteDuplicateDocumentsInFolder("keep-id", "folder-id");

    expect(mockSetTrashed).toHaveBeenCalledTimes(1);
    expect(mockSetTrashed).toHaveBeenCalledWith(true);
  });

  it("残すファイル ID のドキュメントは削除しない", () => {
    const mockSetTrashed = vi.fn();
    vi.mocked(DriveApp.getFileById).mockReturnValue({
      getName: vi.fn(() => "scan.png"),
    } as never);

    const mockFiles = [
      {
        getId: () => "keep-id",
        getMimeType: () => MimeType.GOOGLE_DOCS,
        setTrashed: mockSetTrashed,
      },
    ];
    let index = 0;
    const mockIterator = {
      hasNext: vi.fn(() => index < mockFiles.length),
      next: vi.fn(() => mockFiles[index++]),
    };
    vi.mocked(DriveApp.getFolderById).mockReturnValue({
      getFilesByName: vi.fn(() => mockIterator),
    } as never);

    deleteDuplicateDocumentsInFolder("keep-id", "folder-id");

    expect(mockSetTrashed).not.toHaveBeenCalled();
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
