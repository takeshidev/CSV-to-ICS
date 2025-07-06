# CSV to ICS

Convert a .csv spreadsheet to .ics calendar file

## Features

- Start/end date and time
- Event duration
- All day events
- Timezones
- Description
- Reminders

## Usage

Download the [Sample.csv](https://raw.githubusercontent.com/takeshidev/CSV-to-ICS/refs/heads/main/files/csv/Sample.csv) and fill it with your events or create your own csv file that contains the same header row.

Save that file in the _files/csv_ folder

You can specify the name of the input file and the name of the output file. If you don't set an output filename, it will use the filename of the input file as default.

```bash
npm run start InputFile.csv OutputFile.ics
```

Your calendar file will be ready in the _files/ics_ folder.
Open the file to add the events to your calendar.

## Acknowledgements

- [csv-parser](https://github.com/mafintosh/csv-parser)
- [ical-generator](https://github.com/sebbo2002/ical-generator)
