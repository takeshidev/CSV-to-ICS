import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import csvParser from "csv-parser";
import { CsvRow } from "./events.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

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
