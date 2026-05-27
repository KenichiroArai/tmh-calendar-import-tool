import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDocument, getText } from "../../src/drive/document";

vi.mock("../../src/logging/writeLog", () => ({
  writeLog: vi.fn(),
}));

vi.mock("../../src/drive/targets", () => ({
  getTagetFileIds: vi.fn(() => []),
}));

vi.mock("../../src/drive/files", () => ({
  deleteFileById: vi.fn(),
}));

describe("createDocument", () => {
  beforeEach(() => {
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
