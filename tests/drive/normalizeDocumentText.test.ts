import { describe, it } from "vitest";
import { normalizeDocumentText } from "../../src/drive/normalizeDocumentText";

describe("normalizeDocumentText", () => {
  it("OCR ドキュメントのテキストをパーサー用に正規化する", () => {
    normalizeDocumentText("");
  });
});
