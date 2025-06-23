import { ICalCalendar, ICalEvent, ICalEventData } from "ical-generator";
import { getVtimezoneComponent } from "@touch4it/ical-timezones";
import { generateEvents, readCsvToArrayOfObjects, writeIcsFile } from "./files.js";

const cal = new ICalCalendar();
cal.timezone({
  name: "GETMESOMETIMEZONES",
  generator: getVtimezoneComponent,
});

const csvFilename = process.argv[2] ? process.argv[2] : "Sample.csv";
let baseFilename: string;
if (csvFilename && csvFilename.endsWith(".csv")) {
  baseFilename = csvFilename.slice(0, -4);
} else {
  baseFilename = csvFilename;
}
const icsFilename = process.argv[3] ? process.argv[3] : baseFilename + ".ics";
console.info("Converting", csvFilename, "to", icsFilename);

const parsedData = await readCsvToArrayOfObjects(csvFilename);

const events = await generateEvents(parsedData, cal);

events.forEach((event: ICalEvent | ICalEventData) => {
  cal.createEvent(event);
});

await writeIcsFile(cal.toString(), icsFilename);
