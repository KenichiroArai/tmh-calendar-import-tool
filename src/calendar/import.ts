/**
 * CSVからカレンダーにインポートする。
 * @param csvFileId CSVファイルID
 * @param calendarId カレンダーID
 */
function importCSVtoCalendar(csvFileId: string, calendarId: string): void {
  const calendar = CalendarApp.getCalendarById(calendarId);
  if (!calendar) {
    throw new Error("カレンダーが見つかりません: " + calendarId);
  }

  const file = DriveApp.getFileById(csvFileId);
  const csvDatas = Utilities.parseCsv(file.getBlob().getDataAsString());

  for (const line of csvDatas) {
    const title = line[2];
    const year = new Date().getFullYear(); // TODO KenichiroArai 2024/12/30 今日より前であれば+1する
    const date = new Date(year + "/" + line[0]);
    const times = line[1].split(":");
    const hours = Number(times[0]);
    date.setHours(hours);
    const minutes = Number(times[1]);
    date.setMinutes(minutes);
    const startTime = date;
    const endTime = date;
    const description = line[3];

    writeLog(
      "【カレンダーインポートデータ】title:" +
        title +
        ", startTime:" +
        startTime +
        ", endTime:" +
        endTime +
        ", description:" +
        description,
    );

    calendar.createEvent(title, startTime, endTime, {
      description: description,
    });
  }
}
