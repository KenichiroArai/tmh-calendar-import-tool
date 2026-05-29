import { describe, it, expect } from "vitest";
import {
  CONTROL_PANEL_OVERVIEW_TEXT,
  MAX_CELL_LENGTH,
} from "../src/constants";

describe("CONTROL_PANEL_OVERVIEW_TEXT", () => {
  it("モード・ドキュメントURLの項目名と各モード値の説明を含む", () => {
    expect(CONTROL_PANEL_OVERVIEW_TEXT).toContain("「モード」");
    expect(CONTROL_PANEL_OVERVIEW_TEXT).toContain("「ドキュメントURL」");
    expect(CONTROL_PANEL_OVERVIEW_TEXT).not.toContain("B2");
    expect(CONTROL_PANEL_OVERVIEW_TEXT).not.toContain("B3");
    expect(CONTROL_PANEL_OVERVIEW_TEXT).toContain("all …");
    expect(CONTROL_PANEL_OVERVIEW_TEXT).toContain("createDocumentsOnly …");
    expect(CONTROL_PANEL_OVERVIEW_TEXT).toContain("importOnly …");
    expect(CONTROL_PANEL_OVERVIEW_TEXT).toContain("moveOnly …");
    expect(CONTROL_PANEL_OVERVIEW_TEXT.length).toBeLessThanOrEqual(
      MAX_CELL_LENGTH,
    );
  });
});
