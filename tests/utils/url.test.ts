import { describe, it, expect } from "vitest";
import { extractIdFromUrl } from "../../src/utils/url";

describe("extractIdFromUrl", () => {
  it("Google Docs の URL からファイル ID を抽出できる", () => {
    const url =
      "https://docs.google.com/document/d/1psjqhg0trmUAtcnrC4mcLlFF7YnxugF0FJNix5bAM4Y/edit?usp=sharing";
    expect(extractIdFromUrl(url)).toBe(
      "1psjqhg0trmUAtcnrC4mcLlFF7YnxugF0FJNix5bAM4Y",
    );
  });

  it("Google Drive の URL からファイル ID を抽出できる", () => {
    const url =
      "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/view";
    expect(extractIdFromUrl(url)).toBe("1AbCdEfGhIjKlMnOpQrStUvWxYz");
  });

  it("Google Spreadsheet の URL からファイル ID を抽出できる", () => {
    const url =
      "https://docs.google.com/spreadsheets/d/1_abc-XYZ123/edit#gid=0";
    expect(extractIdFromUrl(url)).toBe("1_abc-XYZ123");
  });

  it("ID を含まない URL の場合はエラーをスローする", () => {
    const url = "https://www.google.com/";
    expect(() => extractIdFromUrl(url)).toThrow(
      "URLからIDを抽出できませんでした",
    );
  });

  it("/d/ パターンが存在しない URL の場合はエラーをスローする", () => {
    const url = "https://docs.google.com/document/edit";
    expect(() => extractIdFromUrl(url)).toThrow(
      "URLからIDを抽出できませんでした",
    );
  });
});
