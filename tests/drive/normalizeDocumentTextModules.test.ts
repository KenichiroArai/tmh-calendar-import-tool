import { describe, expect, it } from "vitest";
import { collectEntries } from "../../src/drive/normalizeDocumentText/collectEntries";
import { fixOcrDatePrefix } from "../../src/drive/normalizeDocumentText/fixOcrDatePrefix";
import {
  isOcrScheduleLineStart,
  isScheduleEntryStart,
} from "../../src/drive/normalizeDocumentText/scheduleEntryPatterns";

describe("scheduleEntryPatterns", () => {
  it("~ のみで OCR スケジュール行と判定する", () => {
    expect(isOcrScheduleLineStart("9/23(月)18:00~配信A")).toBe(true);
  });

  it("月 > 12 のみで OCR スケジュール行と判定する", () => {
    expect(isOcrScheduleLineStart("19/23(月)26:54放送局A")).toBe(true);
  });

  it("■ 付きスケジュール行を起点と判定する", () => {
    expect(isScheduleEntryStart("■9/23(月)18:00~配信A")).toBe(true);
  });
});

describe("fixOcrDatePrefix", () => {
  it("月が 12 以下の 2 桁月は変更しない", () => {
    expect(fixOcrDatePrefix("■10/15(月)18:00~配信A")).toBe(
      "■10/15(月)18:00~配信A",
    );
  });
});

describe("collectEntries", () => {
  it("■ 付き非スケジュール行を単独 passthrough する", () => {
    expect(collectEntries(["■放送局Bにて25:00から放送"])).toEqual([
      "■放送局Bにて25:00から放送",
    ]);
  });
});
