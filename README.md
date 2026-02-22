# Attendance Management App (MVP)

A lightweight student attendance tracker prototype.

## Features in this MVP

- Attendance percentage per subject with color coding:
  - **Green** for safe (>=75%)
  - **Amber** for warning (60-74%)
  - **Red** for low (<60%)
- Upload a timetable in **PDF** and auto-fill subjects for each day in the month view.
- Subject actions:
  - **Add Present**
  - **Add Absent**
  - **Clear** (reset selected subject counts)
- Month navigation to preview schedule mapping.

## Timetable PDF format

The parser expects lines in this structure (case-insensitive day names):

```text
Monday: Math, Physics
Tuesday: Chemistry, English
```

## Run locally

Use any static server:

```bash
python -m http.server 8000
```

Then open http://localhost:8000
