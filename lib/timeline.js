import { people, events, places, getPerson } from "./data";

// Every dated thing on the site, as one list, built at build time.
// Rows come from people.json (birth, death, marriage) and from events.json.
// The dates in people.json are written the way the records write them, from
// "about 1757" to "4 January 1829" to a bare "1861", so everything here is
// about parsing that honestly rather than pretending it is a Date.

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

const VAGUE = /\b(about|abt|circa|before|bef|after|aft|between|probable|likely|weak|if the)\b/i;

// year, then month, then day; a missing part sorts first inside its year.
export function parseDate(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase();
  const year = (s.match(/\b(1[6-9]\d\d|20\d\d)\b/) || [])[1];
  if (!year) return null;
  let month = 0;
  let day = 0;
  for (let i = 0; i < 12; i++) {
    const m = s.indexOf(MONTHS[i]);
    if (m >= 0) {
      month = i + 1;
      const before = s.slice(Math.max(0, m - 4), m).match(/(\d{1,2})\s*$/);
      if (before) day = parseInt(before[1], 10);
      break;
    }
  }
  return {
    year: parseInt(year, 10),
    month,
    day,
    approximate: VAGUE.test(s),
    text: String(raw),
  };
}

const keyOf = (d) => d.year * 10000 + d.month * 100 + d.day;

// Who the privacy rule covers. Same test as tools/check_privacy.py: the living
// flag, plus anyone with no death date who could plausibly still be alive. An
// unset flag is not evidence that someone died, so unknown counts as protected.
const OLDEST = new Date().getFullYear() - 110;
export function isProtected(p) {
  if (!p) return false;
  if (p.living) return true;
  if (p.death?.date) return false;
  const y = parseDate(p.birth?.date)?.year;
  return y ? y >= OLDEST : false;
}

// A birth or death place is a free-text string, so it is matched to a place
// page the same way the place pages match people: on the place's own matchers.
function placeIdFor(text) {
  if (!text) return null;
  const t = String(text).toLowerCase();
  const hit = places.find((pl) =>
    (pl.matchers || []).some((m) => t.includes(String(m).toLowerCase()))
  );
  return hit ? hit.id : null;
}

// A protected person gets a year and nothing else, on every row they appear in.
function forPerson(person, date, place) {
  if (isProtected(person)) {
    return { text: String(date.year), place: null };
  }
  return { text: date.text, place: place || null };
}

function personRows() {
  const rows = [];
  const seenMarriage = new Set();

  for (const p of people) {
    const b = parseDate(p.birth?.date);
    if (b) {
      const shown = forPerson(p, b, p.birth?.place);
      rows.push({
        kind: "birth",
        date: b,
        label: "Birth of",
        subjects: [p],
        dateText: shown.text,
        place: shown.place,
        placeId: placeIdFor(shown.place),
        confidence: p.confidence,
      });
    }
    const d = parseDate(p.death?.date);
    if (d) {
      const shown = forPerson(p, d, p.death?.place);
      rows.push({
        kind: "death",
        date: d,
        label: "Death of",
        subjects: [p],
        dateText: shown.text,
        place: shown.place,
        placeId: placeIdFor(shown.place),
        confidence: p.confidence,
      });
    }
    const m = parseDate(p.marriage?.date);
    if (m) {
      // One marriage, one row: the spouses are stored on both people.
      const spouses = (p.spouses || [])
        .map(getPerson)
        .filter((s) => s && parseDate(s.marriage?.date)?.text === m.text);
      const ids = [p.id, ...spouses.map((s) => s.id)].sort();
      const key = ids.join("+") + "@" + m.text;
      if (seenMarriage.has(key)) continue;
      seenMarriage.add(key);
      const subjects = [p, ...spouses];
      const anyLiving = subjects.some(isProtected);
      const shown = forPerson(anyLiving ? { living: true } : p, m, p.marriage?.place);
      rows.push({
        kind: "marriage",
        date: m,
        label: "Marriage of",
        subjects,
        dateText: shown.text,
        place: shown.place,
        placeId: placeIdFor(shown.place),
        confidence: p.confidence,
      });
    }
  }
  return rows;
}

function eventRows() {
  return events
    .map((e) => {
      const d = parseDate(e.date) || (e.sortYear ? { year: e.sortYear, month: 0, day: 0, approximate: true, text: String(e.date || e.sortYear) } : null);
      if (!d) return null;
      const subjects = (e.people || []).map(getPerson).filter(Boolean);
      const anyLiving = subjects.some(isProtected);
      return {
        kind: "event",
        date: d,
        title: e.title,
        eventId: e.id,
        subjects,
        dateText: anyLiving ? String(d.year) : d.text,
        place: anyLiving ? null : e.place || null,
        placeId: anyLiving ? null : e.placeId || null,
        confidence: e.confidence,
      };
    })
    .filter(Boolean);
}

export function timelineRows() {
  const ev = eventRows();
  // An events.json entry wins over the row derived from people.json for the
  // same date and the same people, so the 1829 marriage appears once.
  const covered = ev.map((e) => ({
    key: keyOf(e.date),
    year: e.date.year,
    ids: new Set(e.subjects.map((s) => s.id)),
  }));
  const derived = personRows().filter((r) => {
    const k = keyOf(r.date);
    return !covered.some((c) => {
      if (!r.subjects.every((s) => c.ids.has(s.id))) return false;
      if (c.key === k) return true;
      // A marriage is one wedding, so a marriage row and an event in the same
      // year over the same people are the same thing even when the precision
      // differs -- a living spouse's marriage is stored as a bare year, while
      // the event carries the full date.
      return r.kind === "marriage" && c.year === r.date.year;
    });
  });
  const rows = [...ev, ...derived].sort((a, b) => {
    const d = keyOf(a.date) - keyOf(b.date);
    if (d) return d;
    return (a.subjects[0]?.name || "").localeCompare(b.subjects[0]?.name || "");
  });

  // Nobody disappears: anyone who produced no row is listed at the foot.
  const placed = new Set();
  rows.forEach((r) => r.subjects.forEach((s) => placed.add(s.id)));
  const undated = people.filter((p) => !placed.has(p.id));

  const decades = [];
  for (const r of rows) {
    const decade = Math.floor(r.date.year / 10) * 10;
    if (!decades.length || decades[decades.length - 1].decade !== decade) {
      decades.push({ decade, rows: [] });
    }
    decades[decades.length - 1].rows.push(r);
  }
  const centuries = [...new Set(rows.map((r) => Math.floor(r.date.year / 100) * 100))];
  return { rows, decades, centuries, undated };
}
