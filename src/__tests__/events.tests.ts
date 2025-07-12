import { describe, expect, test } from "@jest/globals";
import { parseFlexibleDate, validateTimezone, setEventStart, setEventEnd } from "../events";

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
  const createExpectedDate = (year: number, month: number, day: number, hours: number, minutes: number, seconds: number = 0) => {
    return new Date(year, month - 1, day, hours, minutes, seconds);
  };

  let startDate: Date;
  beforeEach(() => {
    startDate = createExpectedDate(2025, 7, 15, 9, 0, 0); // July 15, 2025, 09:00:00
  });

  test("should calculate end date using explicit end date and time", () => {
    const end = setEventEnd("2025-07-15", "11:30", startDate);
    const expected = createExpectedDate(2025, 7, 15, 11, 30, 0);
    expect(end.toString()).toBe(expected.toString());
    expect(end.getHours()).toBe(11);
    expect(end.getMinutes()).toBe(30);
  });

  test("should calculate end date using duration", () => {
    const end = setEventEnd(undefined, undefined, startDate, "120");
    const expected = createExpectedDate(2025, 7, 15, 11, 0, 0);
    expect(end.toString()).toBe(expected.toString());
    expect(end.getHours()).toBe(11);
    expect(end.getMinutes()).toBe(0);
  });

  test("should handle duration that crosses midnight", () => {
    const startLate = createExpectedDate(2025, 7, 15, 23, 0, 0); // July 15, 2025, 23:00:00
    const end = setEventEnd(undefined, undefined, startLate, "120");
    const expected = createExpectedDate(2025, 7, 16, 1, 0, 0); // July 16, 2025, 01:00:00
    expect(end.toString()).toBe(expected.toString());
    expect(end.getDate()).toBe(16);
    expect(end.getHours()).toBe(1);
  });

  test("should throw error for invalid end time format", () => {
    expect(() => setEventEnd("2025-01-01", "10", startDate)).toThrow("Invalid 'endTimeStr' format");
  });

  test("should throw error if end date is before start date (explicit)", () => {
    const start = createExpectedDate(2025, 7, 15, 10, 0, 0);
    expect(() => setEventEnd("2025-07-15", "09:00", start)).toThrow("End date and time cannot be before the start date and time.");
    expect(() => setEventEnd("2025-07-14", "10:00", start)).toThrow("End date and time cannot be before the start date and time.");
  });

  test("should throw error for invalid duration", () => {
    expect(() => setEventEnd(undefined, undefined, startDate, "-10")).toThrow("Invalid 'duration' value");
    expect(() => setEventEnd(undefined, undefined, startDate, "abc")).toThrow("Invalid 'duration' value");
  });

  test("should throw error if neither end date/time nor duration are provided", () => {
    expect(() => setEventEnd(undefined, undefined, startDate, undefined)).toThrow("Either end date & time must be provided, or duration must be provided.");
  });

  test("should prioritize explicit end date/time over duration if both are provided", () => {
    const end = setEventEnd("2025-07-15", "10:30", startDate, "60");
    const expected = createExpectedDate(2025, 7, 15, 10, 30, 0);
    expect(end.toString()).toBe(expected.toString());
    expect(end.getHours()).toBe(10);
    expect(end.getMinutes()).toBe(30);
  });
});
