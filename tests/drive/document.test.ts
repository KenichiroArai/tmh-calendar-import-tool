import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createDocument,
  getText,
  createDocuments,
} from "../../src/drive/document";
import { getTagetFileIds } from "../../src/drive/targets";
import { deleteDuplicateDocumentsInFolder } from "../../src/drive/files";
import { saveNormalizedTextFile } from "../../src/drive/text";

vi.mock("../../src/logging/writeLog", () => ({
  writeLog: vi.fn(),
}));

vi.mock("../../src/drive/targets", () => ({
  getTagetFileIds: vi.fn(() => []),
}));

vi.mock("../../src/drive/files", () => ({
  deleteDuplicateDocumentsInFolder: vi.fn(),
}));

vi.mock("../../src/drive/text", () => ({
  saveNormalizedTextFile: vi.fn(() => "normalized-text-file-id"),
}));

const defaultDrive = {
  Files: { copy: vi.fn(() => ({ id: "mock-converted-id" })) },
};

describe("createDocument", () => {
  beforeEach(() => {
    vi.stubGlobal("Drive", defaultDrive);
    vi.mocked((Drive as any).Files.copy).mockReset();
    vi.mocked(DriveApp.getFileById).mockReset();
    vi.mocked(DriveApp.getFolderById).mockReset();
  });

  it("OCR 変換後のドキュメント ID を返す", () => {
    vi.mocked((Drive as any).Files.copy).mockReturnValue({
      id: "converted-doc-id",
    });

    const mockFile = { moveTo: vi.fn() };
    vi.mocked(DriveApp.getFileById).mockReturnValue(mockFile as never);
    vi.mocked(DriveApp.getFolderById).mockReturnValue({} as never);

    const result = createDocument("input-file-id", "output-folder-id");
    expect(result).toBe("converted-doc-id");
  });

  it("ドキュメント ID が取得できない場合はエラーをスローする", () => {
    vi.mocked((Drive as any).Files.copy).mockReturnValue({ id: undefined });

    expect(() => createDocument("input-file-id", "output-folder-id")).toThrow(
      "OCR 変換後のドキュメント ID を取得できませんでした",
    );
  });

  it("Drive API が有効化されていない場合はエラーをスローする", () => {
    vi.stubGlobal("Drive", undefined);

    expect(() => createDocument("input-file-id", "output-folder-id")).toThrow(
      "Drive API が有効化されていません",
    );
  });
});

describe("getText", () => {
  it("ドキュメントからテキストを取得し正規化する", () => {
    const mockBody = { getText: vi.fn(() => "■ 1/15(月) 10:00 会議") };
    const mockDoc = { getBody: vi.fn(() => mockBody) };
    vi.mocked(DocumentApp.openById).mockReturnValue(mockDoc as never);

    const result = getText("doc-id");
    expect(result).toBe("■1/15(月)10:00会議");
  });
});

describe("createDocuments", () => {
  beforeEach(() => {
    vi.stubGlobal("Drive", defaultDrive);
    vi.mocked(getTagetFileIds).mockReset();
    vi.mocked(deleteDuplicateDocumentsInFolder).mockReset();
    vi.mocked(saveNormalizedTextFile).mockReset();
    vi.mocked((Drive as any).Files.copy).mockReset();
    vi.mocked(DriveApp.getFileById).mockReset();
    vi.mocked(DriveApp.getFolderById).mockReset();
  });

  it("対象ファイルがない場合は空配列を返す", () => {
    vi.mocked(getTagetFileIds).mockReturnValue([]);

    const result = createDocuments("input-folder-id", "output-folder-id");

    expect(result).toEqual([]);
  });

  it("対象ファイルを OCR 変換してドキュメント ID の一覧を返す", () => {
    vi.mocked(getTagetFileIds).mockReturnValue(["file-1"]);
    vi.mocked((Drive as any).Files.copy).mockReturnValue({
      id: "converted-doc-id",
    });

    const mockMoveTo = vi.fn();
    vi.mocked(DriveApp.getFileById).mockReturnValue({
      getName: vi.fn(() => "scan.png"),
      moveTo: mockMoveTo,
    } as never);
    vi.mocked(DriveApp.getFolderById).mockReturnValue({} as never);
    vi.mocked(DocumentApp.openById).mockReturnValue({
      getBody: vi.fn(() => ({
        getText: vi.fn(() => "■ 1/15(月) 10:00 会議"),
      })),
    } as never);

    const result = createDocuments("input-folder-id", "output-folder-id");

    expect(result).toEqual([
      { sourceFileId: "file-1", convertedFileId: "converted-doc-id" },
    ]);
    expect(mockMoveTo).toHaveBeenCalled();
    expect(saveNormalizedTextFile).toHaveBeenCalledWith(
      "scan.png",
      "■1/15(月)10:00会議",
      "output-folder-id",
    );
    expect(deleteDuplicateDocumentsInFolder).toHaveBeenCalledWith(
      "converted-doc-id",
      "output-folder-id",
    );
  });
});
