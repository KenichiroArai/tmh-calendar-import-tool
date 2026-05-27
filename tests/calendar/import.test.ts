import { describe, it, expect, vi, beforeEach } from "vitest";
import { importCSVtoCalendar } from "../../src/calendar/import";

vi.mock("../../src/logging/writeLog", () => ({
  writeLog: vi.fn(),
}));

describe("importCSVtoCalendar", () => {
  beforeEach(() => {
    vi.mocked(CalendarApp.getCalendarById).mockReset();
    vi.mocked(DriveApp.getFileById).mockReset();
    vi.mocked(Utilities.parseCsv).mockReset();
  });

  it("カレンダーが見つからない場合はエラーをスローする", () => {
    vi.mocked(CalendarApp.getCalendarById).mockReturnValue(null as never);

    expect(() => importCSVtoCalendar("csv-id", "bad-calendar-id")).toThrow(
      "カレンダーが見つかりません",
    );
  });

  it("CSV データからカレンダーイベントを作成する", () => {
    const mockCreateEvent = vi.fn();
    vi.mocked(CalendarApp.getCalendarById).mockReturnValue({
      createEvent: mockCreateEvent,
    } as never);

    const mockBlob = { getDataAsString: vi.fn(() => "csv-content") };
    vi.mocked(DriveApp.getFileById).mockReturnValue({
      getBlob: vi.fn(() => mockBlob),
    } as never);

    vi.mocked(Utilities.parseCsv).mockReturnValue([
      ["1/15", "10:00", "会議", "詳細"],
    ]);

    importCSVtoCalendar("csv-file-id", "calendar-id");

    expect(mockCreateEvent).toHaveBeenCalledTimes(1);
    expect(mockCreateEvent).toHaveBeenCalledWith(
      "会議",
      expect.any(Date),
      expect.any(Date),
      { description: "詳細" },
    );
  });

  it("複数行の CSV データを処理する", () => {
    const mockCreateEvent = vi.fn();
    vi.mocked(CalendarApp.getCalendarById).mockReturnValue({
      createEvent: mockCreateEvent,
    } as never);

    const mockBlob = { getDataAsString: vi.fn(() => "") };
    vi.mocked(DriveApp.getFileById).mockReturnValue({
      getBlob: vi.fn(() => mockBlob),
    } as never);

    vi.mocked(Utilities.parseCsv).mockReturnValue([
      ["1/15", "10:00", "会議A", "詳細A"],
      ["2/20", "14:30", "会議B", "詳細B"],
    ]);

    importCSVtoCalendar("csv-file-id", "calendar-id");

    expect(mockCreateEvent).toHaveBeenCalledTimes(2);
  });
});
