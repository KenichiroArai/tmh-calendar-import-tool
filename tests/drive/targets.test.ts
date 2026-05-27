import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTagetFileIds } from "../../src/drive/targets";

describe("getTagetFileIds", () => {
  beforeEach(() => {
    vi.mocked(DriveApp.getFolderById).mockReset();
  });

  it("画像ファイルの ID を返す", () => {
    const mockFiles = [
      { getId: () => "img-1", getMimeType: () => "image/png", getName: () => "a.png" },
      { getId: () => "img-2", getMimeType: () => "image/jpeg", getName: () => "b.jpg" },
    ];
    let index = 0;
    const mockIterator = {
      hasNext: vi.fn(() => index < mockFiles.length),
      next: vi.fn(() => mockFiles[index++]),
    };
    vi.mocked(DriveApp.getFolderById).mockReturnValue({
      getFiles: vi.fn(() => mockIterator),
    } as never);

    const result = getTagetFileIds("folder-id");
    expect(result).toEqual(["img-1", "img-2"]);
  });

  it("PDF ファイルの ID を返す", () => {
    const mockFiles = [
      { getId: () => "pdf-1", getMimeType: () => "application/pdf", getName: () => "a.pdf" },
    ];
    let index = 0;
    const mockIterator = {
      hasNext: vi.fn(() => index < mockFiles.length),
      next: vi.fn(() => mockFiles[index++]),
    };
    vi.mocked(DriveApp.getFolderById).mockReturnValue({
      getFiles: vi.fn(() => mockIterator),
    } as never);

    const result = getTagetFileIds("folder-id");
    expect(result).toEqual(["pdf-1"]);
  });

  it("画像・PDF 以外のファイルは除外する", () => {
    const mockFiles = [
      { getId: () => "txt-1", getMimeType: () => "text/plain", getName: () => "a.txt" },
      { getId: () => "img-1", getMimeType: () => "image/png", getName: () => "b.png" },
    ];
    let index = 0;
    const mockIterator = {
      hasNext: vi.fn(() => index < mockFiles.length),
      next: vi.fn(() => mockFiles[index++]),
    };
    vi.mocked(DriveApp.getFolderById).mockReturnValue({
      getFiles: vi.fn(() => mockIterator),
    } as never);

    const result = getTagetFileIds("folder-id");
    expect(result).toEqual(["img-1"]);
  });

  it("フォルダにファイルがない場合は空配列を返す", () => {
    const mockIterator = {
      hasNext: vi.fn(() => false),
      next: vi.fn(),
    };
    vi.mocked(DriveApp.getFolderById).mockReturnValue({
      getFiles: vi.fn(() => mockIterator),
    } as never);

    const result = getTagetFileIds("folder-id");
    expect(result).toEqual([]);
  });
});
