import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createDocument, getText, createDocuments } from "../../src/drive/document";
import { getTagetFileIds } from "../../src/drive/targets";
import { deleteFileById } from "../../src/drive/files";

vi.mock("../../src/logging/writeLog", () => ({
  writeLog: vi.fn(),
}));

vi.mock("../../src/drive/targets", () => ({
  getTagetFileIds: vi.fn(() => []),
}));

vi.mock("../../src/drive/files", () => ({
  deleteFileById: vi.fn(),
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
  it("ドキュメントからテキストを取得する", () => {
    const mockBody = { getText: vi.fn(() => "抽出されたテキスト") };
    const mockDoc = { getBody: vi.fn(() => mockBody) };
    vi.mocked(DocumentApp.openById).mockReturnValue(mockDoc as never);

    const result = getText("doc-id");
    expect(result).toBe("抽出されたテキスト");
  });
});

describe("createDocuments", () => {
  beforeEach(() => {
    vi.stubGlobal("Drive", defaultDrive);
    vi.mocked(getTagetFileIds).mockReset();
    vi.mocked(deleteFileById).mockReset();
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

    const result = createDocuments("input-folder-id", "output-folder-id");

    expect(result).toEqual(["converted-doc-id"]);
    expect(mockMoveTo).toHaveBeenCalled();
    expect(deleteFileById).toHaveBeenCalledWith(
      "converted-doc-id",
      "converted-doc-id",
    );
  });
});
