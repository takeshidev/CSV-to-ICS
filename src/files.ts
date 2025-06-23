import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import csvParser from "csv-parser";
import { ICalCalendar, ICalEvent } from "ical-generator";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

interface CsvRow {
  // Define las propiedades esperadas de tus filas CSV
  "Start Date": string;
  "Start Time": string;
  "End Date": string;
  "End Time": string;
  Duration: string;
  "Time Zone": string;
  Subject: string;
  Description: string;
  "Reminder Time": string;
  UID: string;
}

export async function readCsvToArrayOfObjects(filename: string): Promise<CsvRow[]> {
  const fullPath = path.join(projectRoot, "files", "csv", filename);
  const results: CsvRow[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(fullPath)
      .pipe(csvParser())
      .on("data", (data: CsvRow) => results.push(data))
      .on("end", () => {
        console.log(`${filename} succesfully read. Rows parsed: ${results.length}`);
        resolve(results);
      })
      .on("error", (err) => {
        console.error(`ERROR: Could not read CSV file "${filename}":`, err);
        reject(err);
      });
  });
}

export async function generateEvents(parsedCsv: CsvRow[], calendar: ICalCalendar): Promise<ICalEvent[]> {
  let events: ICalEvent[] = [];

  parsedCsv.forEach((row) => {
    let start = new Date(`${row["Start Date"]} ${row["Start Time"]}`);
    let end = new Date(`${row["End Date"]} ${row["End Time"]}`);
    const event = new ICalEvent(
      {
        start: start,
        end: end,
        summary: row.Subject,
        // alarms?: ICalAlarm[] | ICalAlarmData[];
        // allDay?: boolean;
        // attachments?: string[];
        // attendees?: ICalAttendee[] | ICalAttendeeData[];
        // busystatus?: ICalEventBusyStatus | null;
        // categories?: ICalCategory[] | ICalCategoryData[];
        // class?: ICalEventClass | null;
        // created?: ICalDateTimeValue | null;
        // description?: ICalDescription | null | string;
        // floating?: boolean;
        // id?: null | number | string;
        // lastModified?: ICalDateTimeValue | null;
        // location?: ICalLocation | null | string;
        // organizer?: ICalOrganizer | null | string;
        // priority?: null | number;
        // recurrenceId?: ICalDateTimeValue | null;
        // repeating?: ICalRepeatingOptions | ICalRRuleStub | null | string;
        // sequence?: number;
        // stamp?: ICalDateTimeValue;
        // status?: ICalEventStatus | null;
        // timezone?: null | string;
        // transparency?: ICalEventTransparency | null;
        // url?: null | string;
        // x?: [string, string][] | Record<string, string> | {
        //     key: string;
        //     value: string;
        // }[];
      },
      calendar
    );
    events.push(event);
  });

  return events;
}

export async function writeIcsFile(icsContent: string, filename: string = "calendar.ics"): Promise<void> {
  const finalFilename = filename || "calendar.ics";
  const outputDir = path.join(projectRoot, "files", "ics");
  const filePath = path.join(outputDir, finalFilename);

  try {
    await fsp.mkdir(outputDir, { recursive: true });
    await fsp.writeFile(filePath, icsContent);

    console.log(`Great Success!!! File saved to: ${filePath}`);
  } catch (err) {
    console.error("ERROR: Could not write the file:", err);
  }
}
