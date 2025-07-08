import { describe, expect, test } from "@jest/globals";
import { parseFlexibleDate } from "../events";

describe("Events testing", () => {
  describe("parseFlexibleDate", () => {
    test("Accepts a valid date", () => {
      let result = parseFlexibleDate("2025-03-30");

      expect(result).toEqual({ year: 2025, month: 2, day: 30 });
    });
    test("Accepts a valid unambiguous DD/MM/YYYY date", () => {
      let result = parseFlexibleDate("01/30/2025");

      expect(result).toEqual({ year: 2025, month: 0, day: 30 });
    });
  });
});
