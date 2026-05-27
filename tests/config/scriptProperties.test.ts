import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRequiredConfig } from "../../src/config/scriptProperties";

describe("getRequiredConfig", () => {
  beforeEach(() => {
    vi.mocked(PropertiesService.getScriptProperties().getProperty).mockReset();
  });

  it("Script Properties から値を取得できる", () => {
    vi.mocked(PropertiesService.getScriptProperties().getProperty).mockReturnValue(
      "test-folder-id",
    );

    const result = getRequiredConfig("IMPORT_TARGET_FOLDER_ID");
    expect(result).toBe("test-folder-id");
  });

  it("値が空文字の場合はエラーをスローする", () => {
    vi.mocked(PropertiesService.getScriptProperties().getProperty).mockReturnValue("");

    expect(() => getRequiredConfig("CALENDAR_ID")).toThrow(
      "Script Properties の設定値が未定義です",
    );
  });

  it("値が null の場合はエラーをスローする", () => {
    vi.mocked(PropertiesService.getScriptProperties().getProperty).mockReturnValue(null);

    expect(() => getRequiredConfig("IMPORT_COMPLETED_FOLDER_ID")).toThrow(
      "Script Properties の設定値が未定義です",
    );
  });
});
