import { ICalCalendar, ICalEvent, ICalEventData } from "ical-generator";
import { getVtimezoneComponent } from "@touch4it/ical-timezones";
import { readCsvToArrayOfObjects, writeIcsFile } from "./files.js";
import { generateEvents } from "./events.js";

const cal = new ICalCalendar();
cal.timezone({
  name: "GETMESOMETIMEZONES",
  generator: getVtimezoneComponent,
});

// Resolve input file name
const csvFilename = process.argv[2] ? process.argv[2] : "Sample.csv";
let baseFilename: string;
if (csvFilename && csvFilename.endsWith(".csv")) {
  baseFilename = csvFilename.slice(0, -4);
} else {
  baseFilename = csvFilename;
}

// Resolve output file name
const icsFilename = process.argv[3] ? process.argv[3] : baseFilename + ".ics";
console.info("Converting", csvFilename, "to", icsFilename);

// Read CSV
const parsedData = await readCsvToArrayOfObjects(csvFilename);

// Generate events
const events = await generateEvents(parsedData, cal);

events.forEach((event: ICalEvent | ICalEventData) => {
  cal.createEvent(event);
});

// Output file
await writeIcsFile(cal.toString(), icsFilename);
