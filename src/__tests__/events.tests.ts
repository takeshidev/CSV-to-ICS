import { describe, expect, test } from "@jest/globals";
import { parseFlexibleDate } from "../events";

describe("Testing parseFlexibleDate", () => {
  test("Accepts a valid YYYY-MM-DD date", () => {
    const result = parseFlexibleDate("2025-03-30");
    expect(result).toEqual({ year: 2025, month: 2, day: 30 });
  });

  test("Accepts a valid unambiguous DD/MM/YYYY date", () => {
    const result = parseFlexibleDate("01/30/2025");
    expect(result).toEqual({ year: 2025, month: 0, day: 30 });
  });

  test("Throws error when date is empty", () => {
    const result = () => {
      parseFlexibleDate("");
    };
    expect(result).toThrow('Unsupported date format: "". Expected YYYY-MM-DD, MM/DD/YYYY, or DD/MM/YYYY');
  });
});
