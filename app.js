const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const subjectStats = new Map();
let timetable = {};
let displayedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

const pdfInput = document.getElementById("pdfInput");
const loadSample = document.getElementById("loadSample");
const uploadStatus = document.getElementById("uploadStatus");
const subjectSelect = document.getElementById("subjectSelect");
const addPresent = document.getElementById("addPresent");
const addAbsent = document.getElementById("addAbsent");
const clearSubject = document.getElementById("clearSubject");
const summaryGrid = document.getElementById("summaryGrid");
const calendarGrid = document.getElementById("calendarGrid");
const monthLabel = document.getElementById("monthLabel");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");

const sampleTimetable = {
  Monday: ["Math", "Physics", "English"],
  Tuesday: ["Chemistry", "Math"],
  Wednesday: ["Biology", "English"],
  Thursday: ["Physics", "Chemistry"],
  Friday: ["Math", "Computer Science"]
};

function normalizeTimetable(parsed) {
  const normalized = {};
  for (const day of weekdayNames) {
    normalized[day] = Array.isArray(parsed[day]) ? [...new Set(parsed[day].map((s) => s.trim()).filter(Boolean))] : [];
  }
  return normalized;
}

function upsertSubjectsFromTimetable() {
  Object.values(timetable).flat().forEach((subject) => {
    if (!subjectStats.has(subject)) {
      subjectStats.set(subject, { present: 0, absent: 0 });
    }
  });
}

function attendancePercent({ present, absent }) {
  const total = present + absent;
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

function classForPercent(pct) {
  if (pct >= 75) return "safe";
  if (pct >= 60) return "warning";
  return "danger";
}

function renderSummary() {
  summaryGrid.innerHTML = "";
  const sorted = [...subjectStats.entries()].sort(([a], [b]) => a.localeCompare(b));

  for (const [subject, stats] of sorted) {
    const pct = attendancePercent(stats);
    const card = document.createElement("article");
    card.className = "subject-card";
    card.innerHTML = `
      <h3>${subject}</h3>
      <p class="percent ${classForPercent(pct)}">${pct}%</p>
      <p>Present: ${stats.present} | Absent: ${stats.absent}</p>
    `;
    summaryGrid.append(card);
  }

  subjectSelect.innerHTML = sorted.map(([subject]) => `<option value="${subject}">${subject}</option>`).join("");
}

function renderCalendar() {
  calendarGrid.innerHTML = "";
  weekdayShort.forEach((day) => {
    const head = document.createElement("div");
    head.className = "day-head";
    head.textContent = day;
    calendarGrid.append(head);
  });

  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();
  monthLabel.textContent = displayedMonth.toLocaleString(undefined, { month: "long", year: "numeric" });

  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDayIndex; i += 1) {
    const blank = document.createElement("div");
    blank.className = "cell";
    blank.style.visibility = "hidden";
    calendarGrid.append(blank);
  }

  for (let date = 1; date <= lastDate; date += 1) {
    const cellDate = new Date(year, month, date);
    const dayName = weekdayNames[cellDate.getDay()];
    const subjects = timetable[dayName] || [];

    const cell = document.createElement("div");
    cell.className = "cell";
    cell.innerHTML = `<div class="date">${date}</div><ul>${subjects.map((s) => `<li>${s}</li>`).join("")}</ul>`;
    calendarGrid.append(cell);
  }
}

function setTimetable(newTimetable, sourceLabel) {
  timetable = normalizeTimetable(newTimetable);
  upsertSubjectsFromTimetable();
  renderSummary();
  renderCalendar();
  uploadStatus.textContent = `Timetable loaded from ${sourceLabel}.`;
}

function parseTextTimetable(text) {
  const parsed = {};
  text.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*:\s*(.+)$/i);
    if (!match) return;
    const day = match[1][0].toUpperCase() + match[1].slice(1).toLowerCase();
    parsed[day] = match[2].split(",").map((s) => s.trim()).filter(Boolean);
  });
  return parsed;
}

async function readPdfText(file) {
  const pdfjsLib = globalThis.pdfjsLib;
  if (!pdfjsLib) {
    throw new Error("PDF parser failed to load. Please refresh and try again.");
  }
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;

  let fullText = "";
  for (let p = 1; p <= pdf.numPages; p += 1) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    fullText += `${pageText}\n`;
  }
  return fullText;
}

pdfInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    uploadStatus.textContent = "Reading PDF...";
    const text = await readPdfText(file);
    const parsed = parseTextTimetable(text);
    if (Object.keys(parsed).length === 0) {
      throw new Error("No valid timetable lines found. Use format: Monday: Math, Physics");
    }
    setTimetable(parsed, file.name);
  } catch (error) {
    uploadStatus.textContent = error.message;
  }
});

loadSample.addEventListener("click", () => setTimetable(sampleTimetable, "sample data"));

addPresent.addEventListener("click", () => {
  const subject = subjectSelect.value;
  if (!subject || !subjectStats.has(subject)) return;
  subjectStats.get(subject).present += 1;
  renderSummary();
  subjectSelect.value = subject;
});

addAbsent.addEventListener("click", () => {
  const subject = subjectSelect.value;
  if (!subject || !subjectStats.has(subject)) return;
  subjectStats.get(subject).absent += 1;
  renderSummary();
  subjectSelect.value = subject;
});

clearSubject.addEventListener("click", () => {
  const subject = subjectSelect.value;
  if (!subject || !subjectStats.has(subject)) return;
  subjectStats.set(subject, { present: 0, absent: 0 });
  renderSummary();
  subjectSelect.value = subject;
});

prevMonth.addEventListener("click", () => {
  displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1);
  renderCalendar();
});

nextMonth.addEventListener("click", () => {
  displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1);
  renderCalendar();
});

setTimetable(sampleTimetable, "sample data");
