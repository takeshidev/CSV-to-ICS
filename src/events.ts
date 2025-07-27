import { ICalCalendar, ICalEvent } from "ical-generator";

const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/; // HH:MM or HH:MM:SS

export interface CsvRow {
  Subject: string;
  "Start Date": string;
  "Start Time": string;
  "End Date": string;
  "End Time": string; //  HH:MM, duration or "All day"
  "Time Zone": string;
  Description: string;
  "Reminder Time": string;
  UID: string;
}

/**
 * Helper function to parse a date string flexibly (YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, YYYY/MM/DD).
 * Returns an object with year, month (0-indexed), and day.
 * Throws an error if the format is invalid or parts are not valid numbers for a date.
 */
export function parseFlexibleDate(dateStr: string): { year: number; month: number; day: number } {
  let match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/); // YYYY-MM-DD
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // Month is 0-indexed in Date constructor
    const day = parseInt(match[3], 10);
    return { year, month, day };
  }

  match = dateStr.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/); // YYYY/MM/DD
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);

    if (month < 0 || month > 11 || day < 1 || day > 31) {
      throw new Error(`Invalid month or day value in date: "${dateStr}"`);
    }
    return { year, month, day };
  }

  match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); // MM/DD/YYYY or DD/MM/YYYY
  if (match) {
    // Attempt to parse as MM/DD/YYYY first
    const mm = parseInt(match[1], 10);
    const dd = parseInt(match[2], 10);
    const yyyy = parseInt(match[3], 10);

    // Heuristic: If first part > 12, assume DD/MM/YYYY, otherwise assume MM/DD/YYYY
    let year, month, day;
    if (mm > 12 && dd <= 12) {
      // e.g., 30/01/2025 (DD/MM/YYYY)
      day = mm;
      month = dd - 1;
      year = yyyy;
    } else {
      // Assume MM/DD/YYYY or unambiguous DD/MM/YYYY (e.g. 01/30/2025)
      month = mm - 1;
      day = dd;
      year = yyyy;
    }

    if (month < 0 || month > 11 || day < 1 || day > 31) {
      throw new Error(`Invalid month or day value in date: "${dateStr}"`);
    }

    return { year, month, day };
  }

  throw new Error(`Unsupported date format: "${dateStr}". Expected YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, or YYYY/MM/DD.`);
}

export function validateTimezone(timezone: string): void {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
  } catch (e: any) {
    throw new Error(`The timezone "${timezone}" is not a valid IANA Time Zone identifier. Error: ${e.message}`);
  }
}

export function setEventStart(startDateStr: string, startTimeStr: string): Date {
  if (!startDateStr) {
    throw new Error("'Start Date' cannot be empty or null.");
  }
  if (!startTimeStr) {
    throw new Error("'Start Time' cannot be empty or null.");
  }

  if (startTimeStr.toLowerCase() === "all day") {
    let year: number, month: number, day: number;
    try {
      ({ year, month, day } = parseFlexibleDate(startDateStr));
    } catch (e: any) {
      throw new Error(`Error parsing 'Start Date' format for All Day event: ${e.message}`);
    }

    const date = new Date(year, month, day, 0, 0, 0); // Set to start of the day
    if (isNaN(date.getTime())) {
      throw new Error(`Date components form an invalid date for All Day event (e.g., Feb 30th): ${startDateStr}`);
    }
    return date;
  }

  if (!timeRegex.test(startTimeStr)) {
    throw new Error(`'Start Time' format is invalid: "${startTimeStr}". Expected HH:MM or HH:MM:SS, or "All day".`);
  }

  let year: number, month: number, day: number;
  try {
    ({ year, month, day } = parseFlexibleDate(startDateStr));
  } catch (e: any) {
    throw new Error(`Error parsing 'Start Date' format: ${e.message}`);
  }

  // Parse time components
  const [hoursStr, minutesStr, secondsStr = "00"] = startTimeStr.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  const seconds = parseInt(secondsStr, 10);

  if (isNaN(hours) || hours < 0 || hours > 23 || isNaN(minutes) || minutes < 0 || minutes > 59 || isNaN(seconds) || seconds < 0 || seconds > 59) {
    throw new Error(`Invalid time components in '${startTimeStr}'.`);
  }

  // Construct the Date object
  let proposedDate: Date;
  try {
    proposedDate = new Date(year, month, day, hours, minutes, seconds);
  } catch (error: any) {
    throw new Error(`Error during date and time processing: ${error.message}`);
  }
  return proposedDate;
}

export function setEventEnd(endDateStr: string, endTimeStr: string, start: Date, isAllDayEvent: boolean): Date {
  if (!(start instanceof Date) || isNaN(start.getTime())) {
    throw new Error("The 'start' parameter must be a valid Date object.");
  }

  let endDateTime: Date;

  // All day event, no explicit end date or time
  if (isAllDayEvent && !endDateStr && !endTimeStr) {
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1, 0, 0, 0); // Start of the next day
  }

  // All day, valid (?) date
  if (isAllDayEvent && endDateStr) {
    let year: number, month: number, day: number;
    try {
      ({ year, month, day } = parseFlexibleDate(endDateStr));
    } catch (e: any) {
      throw new Error(`Error parsing 'End Date' format: ${e.message}`);
    }
    const endOfEndDate = new Date(year, month, day + 1, 0, 0, 0); // For ical-generator, an all-day event that ends on the same day should have its 'end' set to the start of the next day.
    return endOfEndDate;
  }

  if (endDateStr && endTimeStr && timeRegex.test(endTimeStr)) {
    let year: number, month: number, day: number;
    try {
      ({ year, month, day } = parseFlexibleDate(endDateStr));
    } catch (e: any) {
      throw new Error(`Error parsing 'End Date' format: ${e.message}`);
    }

    const [hoursStr, minutesStr, secondsStr = "00"] = endTimeStr.split(":");
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    const seconds = parseInt(secondsStr, 10);

    if (isNaN(hours) || hours < 0 || hours > 23 || isNaN(minutes) || minutes < 0 || minutes > 59 || isNaN(seconds) || seconds < 0 || seconds > 59) {
      throw new Error(`Invalid time components in '${endTimeStr}'.`);
    }

    try {
      endDateTime = new Date(year, month, day, hours, minutes, seconds);

      if (isNaN(endDateTime.getTime())) {
        throw new Error(`Date components form an invalid end date (e.g., Feb 30th): ${endDateStr} ${endTimeStr}`);
      }

      if (endDateTime.getTime() < start.getTime()) {
        throw new Error("End date and time cannot be before the start date and time.");
      }
    } catch (error: any) {
      throw new Error(`Error processing explicit end date and time: ${error.message}`);
    }
  }
  // If 'End Time' is not a valid time, but a duration number
  else if (endTimeStr && !isNaN(parseInt(endTimeStr, 10))) {
    const durationMinutes = parseInt(endTimeStr, 10);
    console.warn(`Duration in minutes: ${durationMinutes}`);

    if (durationMinutes < 0) {
      throw new Error(`Invalid duration value from 'End Time' (${endTimeStr}). Must be a non-negative number of minutes.`);
    }
    endDateTime = new Date(start.getTime() + durationMinutes * 60 * 1000);
  } else {
    const defaultDurationMinutes = 60;
    endDateTime = new Date(start.getTime() + defaultDurationMinutes * 60 * 1000);
    console.warn(`No explicit End Date/Time or valid duration found. Defaulting to ${defaultDurationMinutes} minutes for Subject starting at ${start.toLocaleString()}.`);
  }

  return endDateTime;
}

export async function generateEvents(parsedCsv: CsvRow[], calendar: ICalCalendar): Promise<ICalEvent[]> {
  let events: ICalEvent[] = [];

  for (let i = 0; i < parsedCsv.length; i++) {
    const row = parsedCsv[i];
    try {
      const timezone = row["Time Zone"] || undefined;
      const start = setEventStart(row["Start Date"], row["Start Time"]);
      const isAllDay = row["Start Time"].toLowerCase() === "all day" || row["End Time"].toLowerCase() === "all day";
      const end = setEventEnd(row["End Date"], row["End Time"], start, isAllDay);

      if (timezone) {
        validateTimezone(timezone);
      }

      const event = new ICalEvent(
        {
          start: start,
          end: end,
          summary: row.Subject,
          description: row.Description,
          id: row.UID || undefined,
          timezone: timezone,
          allDay: isAllDay,
        },
        calendar
      );
      events.push(event);
    } catch (error: any) {
      console.error(`Error processing row ${i + 1} (Subject: "${row.Subject}"): ${error.message}`);
    }
  }
  return events;
}
