import { describe, expect, test } from "@jest/globals";
import { parseFlexibleDate, validateTimezone } from "../events";

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
