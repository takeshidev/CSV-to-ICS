import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import { parseFlexibleDate, validateTimezone, setEventStart, setEventEnd, generateEvents } from "../events";
import { ICalCalendar, ICalEvent } from "ical-generator";
import { SpiedFunction } from "jest-mock/build";
// Mock the ICalEvent class to simplify testing generateEvents
jest.mock("ical-generator", () => {
  return {
    ICalCalendar: jest.fn().mockImplementation(() => ({
      // Mock any methods of ICalCalendar that might be called, if necessary
    })),
    ICalEvent: jest.fn().mockImplementation((options, calendar) => {
      // Store the options passed to the constructor for verification
      return {
        _options: options, // Private property to store options for assertion
        // Add any methods you expect to be called on ICalEvent if needed
      };
    }),
  };
});

describe("Testing parseFlexibleDate", () => {
  test("Accepts a valid YYYY-MM-DD date", () => {
    const result = parseFlexibleDate("2025-03-30");
    expect(result).toEqual({ year: 2025, month: 2, day: 30 });
  });

  test("Accepts a valid YYYY/MM/DD date", () => {
    const result = parseFlexibleDate("2025/03/30");
    expect(result).toEqual({ year: 2025, month: 2, day: 30 });
  });

  test("Accepts a valid MM/DD/YYYY date", () => {
    const result = parseFlexibleDate("12/29/2025");
    expect(result).toEqual({ year: 2025, month: 11, day: 29 });
  });

  test("Accepts a valid unambiguous DD/MM/YYYY date", () => {
    const result = parseFlexibleDate("01/30/2025");
    expect(result).toEqual({ year: 2025, month: 0, day: 30 });
  });

  test("Throws error when date is empty", () => {
    const date = "";
    const result = () => {
      parseFlexibleDate(date);
    };
    expect(result).toThrow(`Unsupported date format: "${date}". Expected YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, or YYYY/MM/DD.`);
  });

  test("Throws error when date separator is invalid", () => {
    const date = "2025.03.30";
    const result = () => {
      parseFlexibleDate(date);
    };
    expect(result).toThrow(`Unsupported date format: "${date}". Expected YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, or YYYY/MM/DD.`);
  });

  test("Throws error when day or month is invalid", () => {
    const date = "2025/03/32";
    const result = () => {
      parseFlexibleDate(date);
    };
    expect(result).toThrow(`Invalid month or day value in date: "${date}"`);

    const date2 = "2025/13/29";
    const result2 = () => {
      parseFlexibleDate(date);
    };
    expect(result2).toThrow(`Invalid month or day value in date: "${date}"`);
  });
});

describe("Testing validateTimezone", () => {
  test("Accepts a valid IANA Timezone", () => {
    const result1 = () => {
      validateTimezone("America/Santiago");
    };
    expect(result1).not.toThrow();

    const result2 = () => {
      validateTimezone("America/New_York");
    };
    expect(result2).not.toThrow();

    const result3 = () => {
      validateTimezone("America/Toronto");
    };
    expect(result3).not.toThrow();

    const result4 = () => {
      validateTimezone("America/Buenos_Aires");
    };
    expect(result4).not.toThrow();
  });

  test("Throws error when timezone is invalid", () => {
    const timezone = "My time";
    const result1 = () => {
      validateTimezone(timezone);
    };
    expect(result1).toThrow(`The timezone "${timezone}" is not a valid IANA Time Zone identifier. Error: Invalid time zone specified: ${timezone}`);
  });
});

describe("Testing setEventStart", () => {
  const createExpectedDate = (year: number, month: number, day: number, hours: number, minutes: number, seconds: number = 0) => {
    return new Date(year, month - 1, day, hours, minutes, seconds); // Month is 1-indexed
  };

  test("should set event start with HH:MM time correctly", () => {
    const start = setEventStart("2025-07-15", "10:30");
    const expected = createExpectedDate(2025, 7, 15, 10, 30, 0);
    expect(start.toString()).toBe(expected.toString());
    expect(start.getFullYear()).toBe(2025);
    expect(start.getMonth()).toBe(6); // July (0-indexed)
    expect(start.getDate()).toBe(15);
    expect(start.getHours()).toBe(10);
    expect(start.getMinutes()).toBe(30);
    expect(start.getSeconds()).toBe(0);
  });

  test("should set event start with HH:MM:SS time correctly", () => {
    const start = setEventStart("2025/12/25", "23:59:05");
    const expected = createExpectedDate(2025, 12, 25, 23, 59, 5);
    expect(start.toString()).toBe(expected.toString());
    expect(start.getFullYear()).toBe(2025);
    expect(start.getMonth()).toBe(11); // December (0-indexed)
    expect(start.getDate()).toBe(25);
    expect(start.getHours()).toBe(23);
    expect(start.getMinutes()).toBe(59);
    expect(start.getSeconds()).toBe(5);
  });

  test("should handle 'All day' start time correctly", () => {
    const start = setEventStart("2025-08-01", "All day");
    const expected = createExpectedDate(2025, 8, 1, 0, 0, 0);
    expect(start.toString()).toBe(expected.toString());
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
  });

  test("should throw error for empty start date", () => {
    expect(() => setEventStart("", "10:00")).toThrow("'Start Date' cannot be empty or null.");
  });

  test("should throw error for empty start time", () => {
    expect(() => setEventStart("2025-01-01", "")).toThrow("'Start Time' cannot be empty or null.");
  });

  test("should throw error for invalid time format", () => {
    expect(() => setEventStart("2025-01-01", "10")).toThrow("'Start Time' format is invalid");
    expect(() => setEventStart("2025-01-01", "10:3")).toThrow("'Start Time' format is invalid");
    expect(() => setEventStart("2025-01-01", "25:00")).toThrow("Invalid time components in '25:00'");
    expect(() => setEventStart("2025-01-01", "10:65")).toThrow("Invalid time components in '10:65'");
  });
});

describe("Testing setEventEnd", () => {
  const createExpectedDate: (year: number, month: number, day: number, hours: number, minutes: number, seconds?: number) => Date = (
    year,
    month,
    day,
    hours,
    minutes,
    seconds = 0
  ) => {
    return new Date(year, month - 1, day, hours, minutes, seconds);
  };

  let startDate: Date;
  beforeEach(() => {
    startDate = createExpectedDate(2025, 7, 15, 9, 0, 0); // July 15, 2025, 09:00:00
  });

  test("should set end date for all-day event to the beginning of the next day", () => {
    console.log("setEventEnd-01: should set end date for all-day event to the beginning of the next day");

    const start = createExpectedDate(2025, 7, 15, 0, 0, 0); // 2025-07-15T04:00:00.000Z
    console.log("startForAllDay", start);

    const end = setEventEnd("", "", start, true); // No explicit end, just an all-day flag
    console.log("end", end);

    const expected = createExpectedDate(2025, 7, 16, 0, 0, 0); // Start of July 16
    console.log("expected", expected);

    expect(end.toString()).toBe(expected.toString());
    expect(end.getFullYear()).toBe(2025);
    expect(end.getMonth()).toBe(6); // July (0-indexed)
    expect(end.getDate()).toBe(16);
    expect(end.getHours()).toBe(0);
    expect(end.getMinutes()).toBe(0);
  });

  test("should calculate end date using explicit end date and time", () => {
    console.log("setEventEnd-02: should calculate end date using explicit end date and time");

    const end = setEventEnd("2025-07-15", "11:30", startDate, false);
    const expected = createExpectedDate(2025, 7, 15, 11, 30, 0);
    expect(end.toString()).toBe(expected.toString());
    expect(end.getHours()).toBe(11);
    expect(end.getMinutes()).toBe(30);
  });

  test("should calculate end date using explicit end date and time with seconds", () => {
    const end = setEventEnd("2025-07-15", "11:30:45", startDate, false);
    const expected = createExpectedDate(2025, 7, 15, 11, 30, 45);
    expect(end.toString()).toBe(expected.toString());
    expect(end.getHours()).toBe(11);
    expect(end.getMinutes()).toBe(30);
    expect(end.getSeconds()).toBe(45);
  });

  test("should calculate end date when it's on a different day than start", () => {
    const end = setEventEnd("2025-07-16", "10:00", startDate, false);
    const expected = createExpectedDate(2025, 7, 16, 10, 0, 0);
    expect(end.toString()).toBe(expected.toString());
    expect(end.getDate()).toBe(16);
    expect(end.getHours()).toBe(10);
  });

  test("should calculate end date by adding duration when endTimeStr is not a time and endDateStr is a number", () => {
    const end = setEventEnd("120", "not a time", startDate, false);
    const expected = createExpectedDate(2025, 7, 15, 10, 0, 0);
    expect(end.toString()).toBe(expected.toString());
    expect(end.getHours()).toBe(11);
    expect(end.getMinutes()).toBe(0);
  });

  test("should handle duration that crosses midnight correctly", () => {
    const startLate = createExpectedDate(2025, 7, 15, 23, 0, 0);
    const end = setEventEnd("120", "not a time", startLate, false);
    const expected = createExpectedDate(2025, 7, 16, 1, 0, 0);
    expect(end.toString()).toBe(expected.toString());
    expect(end.getDate()).toBe(16);
    expect(end.getHours()).toBe(1);
  });

  // test("should use a default 60-minute duration when no explicit end or valid duration is provided", () => {
  //   const end = setEventEnd(undefined, undefined, startDate, false);
  //   const expected = createExpectedDate(2025, 7, 15, 10, 0, 0); // 9:00 + 60 minutes = 10:00
  //   expect(end.toString()).toBe(expected.toString());
  //   expect(end.getHours()).toBe(10);
  //   expect(end.getMinutes()).toBe(0);
  // });

  test("should throw error if 'start' parameter is not a valid Date object", () => {
    expect(() => setEventEnd("2025-07-15", "10:00", null as any, false)).toThrow("The 'start' parameter must be a valid Date object.");
    expect(() => setEventEnd("2025-07-15", "10:00", new Date("invalid date"), false)).toThrow("The 'start' parameter must be a valid Date object.");
  });

  test("should throw error if explicit end date and time is before start date and time", () => {
    const start = createExpectedDate(2025, 7, 15, 10, 0, 0);
    expect(() => setEventEnd("2025-07-15", "09:00", start, false)).toThrow("End date and time cannot be before the start date and time.");
    expect(() => setEventEnd("2025-07-14", "10:00", start, false)).toThrow("End date and time cannot be before the start date and time.");
  });

  test("should throw error for invalid explicit end time format", () => {
    console.log("==========================");

    let result = setEventEnd("2025-07-15", "invalid-time", startDate, false);
    console.log(`Testing invalid end time: ${result}`); // Wed Jul 16 2025 18:45:00 GMT-0400 (Chile Standard Time)
    console.log("==========================");

    expect(() => setEventEnd("2025-07-15", "invalid-time", startDate, false)).toThrow(`Invalid time components in 'invalid-time'.`);
    expect(() => setEventEnd("2025-07-15", "25:00", startDate, false)).toThrow(`Invalid time components in '25:00'.`);
  });

  test("should throw error for invalid duration value (negative)", () => {
    expect(() => setEventEnd("-10", "not a time", startDate, false)).toThrow(`Invalid duration value from 'End Date' (-10). Must be a non-negative number of minutes.`);
  });

  test("should throw error for invalid end date components (e.g., Feb 30th)", () => {
    expect(() => setEventEnd("2025-02-30", "10:00", startDate, false)).toThrow(`Date components form an invalid end date (e.g., Feb 30th): 2025-02-30 10:00`);
  });
});

describe("Testing generateEvents", () => {
  let mockCalendar: ICalCalendar;
  // Removed the explicit 'jest.SpyInstance' type annotation here.
  // TypeScript will infer the correct type from jest.spyOn.
  let consoleErrorSpy: SpiedFunction<{ (...data: any[]): void; (message?: any, ...optionalParams: any[]): void }>;
  const createExpectedDate = (year: number, month: number, day: number, hours: number, minutes: number, seconds: number = 0) => {
    return new Date(year, month - 1, day, hours, minutes, seconds); // Month is 1-indexed
  };

  beforeEach(() => {
    // Reset the mock before each test
    (ICalEvent as jest.Mock).mockClear();
    mockCalendar = new ICalCalendar();
    // Assign the result of jest.spyOn directly. TypeScript will infer its type.
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore(); // Restore original console.error after each test
  });

  test("should generate events correctly for valid CSV rows", async () => {
    const parsedCsv = [
      {
        Subject: "Meeting 1",
        "Start Date": "2025-01-01",
        "Start Time": "09:00",
        "End Date": "2025-01-01",
        "End Time": "10:00",
        "Time Zone": "America/New_York",
        Description: "Project discussion",
        "Reminder Time": "15",
        UID: "event-1",
      },
      {
        Subject: "All Day Event",
        "Start Date": "2025-01-02",
        "Start Time": "All day",
        "End Date": "", // For all-day events, End Date/Time can be empty
        "End Time": "All day",
        "Time Zone": "America/Los_Angeles",
        Description: "Conference day 1",
        "Reminder Time": "0",
        UID: "event-2",
      },
    ];

    const events = await generateEvents(parsedCsv, mockCalendar);

    expect(events.length).toBe(2);
    expect(ICalEvent).toHaveBeenCalledTimes(2);

    // Verify first event
    const event1Options = (events[0] as any)._options;
    expect(event1Options.start.toString()).toBe(createExpectedDate(2025, 1, 1, 9, 0, 0).toString());
    expect(event1Options.end.toString()).toBe(createExpectedDate(2025, 1, 1, 10, 0, 0).toString());
    expect(event1Options.summary).toBe("Meeting 1");
    expect(event1Options.description).toBe("Project discussion");
    expect(event1Options.id).toBe("event-1");
    expect(event1Options.timezone).toBe("America/New_York");
    expect(event1Options.allDay).toBe(false);

    // Verify second event (all day)
    const event2Options = (events[1] as any)._options;
    expect(event2Options.start.toString()).toBe(createExpectedDate(2025, 1, 2, 0, 0, 0).toString());
    expect(event2Options.end.toString()).toBe(createExpectedDate(2025, 1, 3, 0, 0, 0).toString()); // All day event ends at start of next day
    expect(event2Options.summary).toBe("All Day Event");
    expect(event2Options.description).toBe("Conference day 1");
    expect(event2Options.id).toBe("event-2");
    expect(event2Options.timezone).toBe("America/Los_Angeles");
    expect(event2Options.allDay).toBe(true);
  });

  test("should handle events with default duration when end date/time is missing", async () => {
    const parsedCsv = [
      {
        Subject: "Short Meeting",
        "Start Date": "2025-03-10",
        "Start Time": "14:00",
        "End Date": "", // Missing
        "End Time": "", // Missing
        "Time Zone": "Europe/London",
        Description: "Quick chat",
        "Reminder Time": "5",
        UID: "event-3",
      },
    ];

    const events = await generateEvents(parsedCsv, mockCalendar);

    expect(events.length).toBe(1);
    const eventOptions = (events[0] as any)._options;
    expect(eventOptions.start.toString()).toBe(createExpectedDate(2025, 3, 10, 14, 0, 0).toString());
    expect(eventOptions.end.toString()).toBe(createExpectedDate(2025, 3, 10, 15, 0, 0).toString()); // 14:00 + 60 min default
    expect(eventOptions.summary).toBe("Short Meeting");
    expect(eventOptions.allDay).toBe(false);
    expect(consoleErrorSpy).not.toHaveBeenCalled(); // No errors for default duration
  });

  test("should log an error and skip invalid rows, but continue processing valid ones", async () => {
    const parsedCsv = [
      {
        Subject: "Valid Event",
        "Start Date": "2025-04-01",
        "Start Time": "10:00",
        "End Date": "2025-04-01",
        "End Time": "11:00",
        "Time Zone": "America/Santiago",
        Description: "Good event",
        "Reminder Time": "10",
        UID: "event-4",
      },
      {
        Subject: "Invalid Event (Bad Start Time)",
        "Start Date": "2025-04-02",
        "Start Time": "invalid-time", // This will cause an error
        "End Date": "2025-04-02",
        "End Time": "12:00",
        "Time Zone": "America/Santiago",
        Description: "Bad start time",
        "Reminder Time": "0",
        UID: "event-5",
      },
      {
        Subject: "Another Valid Event",
        "Start Date": "2025-04-03",
        "Start Time": "09:30",
        "End Date": "2025-04-03",
        "End Time": "10:30",
        "Time Zone": "America/Santiago",
        Description: "Another good one",
        "Reminder Time": "30",
        UID: "event-6",
      },
    ];

    const events = await generateEvents(parsedCsv, mockCalendar);

    expect(events.length).toBe(2); // Only 2 valid events should be processed
    expect(ICalEvent).toHaveBeenCalledTimes(2);

    // Check that an error was logged for the invalid row
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error processing row 2 (Subject: "Invalid Event (Bad Start Time)"):'));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('\'Start Time\' format is invalid: "invalid-time". Expected HH:MM or HH:MM:SS, or "All day".'));

    // Verify that the valid events are still created
    expect((events[0] as any)._options.summary).toBe("Valid Event");
    expect((events[1] as any)._options.summary).toBe("Another Valid Event");
  });

  test("should return an empty array if parsedCsv is empty", async () => {
    const parsedCsv: any[] = [];
    const events = await generateEvents(parsedCsv, mockCalendar);
    expect(events.length).toBe(0);
    expect(ICalEvent).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  test("should handle invalid timezone gracefully", async () => {
    const parsedCsv = [
      {
        Subject: "Event with Invalid TZ",
        "Start Date": "2025-05-01",
        "Start Time": "10:00",
        "End Date": "2025-05-01",
        "End Time": "11:00",
        "Time Zone": "Invalid/TimeZone", // This will cause an error
        Description: "Bad TZ",
        "Reminder Time": "0",
        UID: "event-7",
      },
    ];

    const events = await generateEvents(parsedCsv, mockCalendar);

    expect(events.length).toBe(0); // Event should not be created
    expect(ICalEvent).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error processing row 1 (Subject: "Event with Invalid TZ"):'));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('The timezone "Invalid/TimeZone" is not a valid IANA Time Zone identifier.'));
  });
});
