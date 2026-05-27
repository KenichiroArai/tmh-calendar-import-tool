import { vi } from "vitest";

// --- SpreadsheetApp ---
const mockRange = {
  setValue: vi.fn(),
};

const mockSheet = {
  getLastRow: vi.fn(() => 0),
  getRange: vi.fn(() => mockRange),
  getSheetByName: vi.fn(() => mockSheet),
  clear: vi.fn(),
};

const mockSpreadsheet = {
  getSheetByName: vi.fn(() => mockSheet),
};

vi.stubGlobal("SpreadsheetApp", {
  getActiveSpreadsheet: vi.fn(() => mockSpreadsheet),
});

// --- DriveApp ---
const mockBlob = {
  getDataAsString: vi.fn(() => ""),
  setDataFromString: vi.fn(function (this: typeof mockBlob) {
    return this;
  }),
};

const mockDriveFile = {
  getId: vi.fn(() => "mock-file-id"),
  getName: vi.fn(() => "mock-file-name"),
  getMimeType: vi.fn(() => "image/png"),
  setTrashed: vi.fn(),
  moveTo: vi.fn(),
  getBlob: vi.fn(() => mockBlob),
};

const mockFileIterator = {
  hasNext: vi.fn(() => false),
  next: vi.fn(() => mockDriveFile),
};

const mockFolder = {
  getFiles: vi.fn(() => mockFileIterator),
  createFile: vi.fn(() => mockDriveFile),
};

vi.stubGlobal("DriveApp", {
  getFileById: vi.fn(() => mockDriveFile),
  getFolderById: vi.fn(() => mockFolder),
  getFilesByName: vi.fn(() => mockFileIterator),
});

// --- Utilities ---
vi.stubGlobal("Utilities", {
  newBlob: vi.fn(() => mockBlob),
  parseCsv: vi.fn(() => []),
});

// --- PropertiesService ---
const mockProperties = {
  getProperty: vi.fn(() => "mock-value"),
};

vi.stubGlobal("PropertiesService", {
  getScriptProperties: vi.fn(() => mockProperties),
});

// --- CalendarApp ---
const mockCalendar = {
  createEvent: vi.fn(),
};

vi.stubGlobal("CalendarApp", {
  getCalendarById: vi.fn(() => mockCalendar),
});

// --- DocumentApp ---
const mockBody = {
  getText: vi.fn(() => ""),
};

const mockDocument = {
  getBody: vi.fn(() => mockBody),
};

vi.stubGlobal("DocumentApp", {
  openById: vi.fn(() => mockDocument),
});

// --- Drive (Advanced Service) ---
const mockDriveFiles = {
  copy: vi.fn(() => ({ id: "mock-converted-id" })),
};

vi.stubGlobal("Drive", {
  Files: mockDriveFiles,
});

// --- MimeType ---
vi.stubGlobal("MimeType", {
  GOOGLE_DOCS: "application/vnd.google-apps.document",
});

// --- Browser ---
vi.stubGlobal("Browser", {
  msgBox: vi.fn(() => "yes"),
  Buttons: {
    OK: "ok",
    YES_NO: "yes_no",
  },
});

// --- Logger ---
vi.stubGlobal("Logger", {
  log: vi.fn(),
});
