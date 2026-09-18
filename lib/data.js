import people from "../data/people.json";
import sources from "../data/sources.json";
import corrections from "../data/corrections.json";
import places from "../data/places.json";
import events from "../data/events.json";
import { site } from "../site.config";

export { people, sources, corrections, places, events };

export function getPlace(id) {
  return places.find((p) => p.id === id) || null;
}

export function getEvent(id) {
  return events.find((e) => e.id === id) || null;
}

// A person belongs to a place if any of their recorded places matches one of
// the place's spellings. Places were written by hand over two centuries in
// three languages, so matching is on substrings rather than exact strings.
function placeStringsFor(person) {
  return [person.birth?.place, person.death?.place, person.marriage?.place].filter(
    Boolean
  );
}

function matches(place, text) {
  return (place.matchers || []).some((m) =>
    String(text).toLowerCase().includes(m.toLowerCase())
  );
}

// Grouped by what happened there, since "born here" and "buried here" are
// different kinds of connection and the page should not blur them.
export function peopleAtPlace(placeId) {
  const place = getPlace(placeId);
  if (!place) return { born: [], died: [], married: [] };
  return {
    born: people.filter((p) => p.birth?.place && matches(place, p.birth.place)),
    died: people.filter((p) => p.death?.place && matches(place, p.death.place)),
    married: people.filter(
      (p) => p.marriage?.place && matches(place, p.marriage.place)
    ),
  };
}

export function placeCount(placeId) {
  const g = peopleAtPlace(placeId);
  return new Set([...g.born, ...g.died, ...g.married].map((p) => p.id)).size;
}

// Every place a single person is connected to, for the links on their page.
export function placesForPerson(person) {
  const strings = placeStringsFor(person);
  return places.filter((pl) => strings.some((s) => matches(pl, s)));
}

export function eventsForPerson(personId) {
  return eventsInOrder().filter((e) => (e.people || []).includes(personId));
}

export function eventsInOrder() {
  return [...events].sort((a, b) => (a.sortYear ?? 0) - (b.sortYear ?? 0));
}

export function eventsAtPlace(placeId) {
  return eventsInOrder().filter((e) => e.placeId === placeId);
}

export function getPerson(id) {
  return people.find((p) => p.id === id) || null;
}

export function personName(id) {
  const p = getPerson(id);
  return p ? p.name : id;
}

export function getSource(id) {
  return sources.find((s) => s.id === id) || null;
}

// Children are stored on the parent, but it is easier to render the other way round.
export function childrenOf(id) {
  return people.filter((p) => (p.parents || []).includes(id));
}

export function parentsOf(person) {
  return (person.parents || []).map(getPerson).filter(Boolean);
}

export function spousesOf(person) {
  return (person.spouses || []).map(getPerson).filter(Boolean);
}

export function sourcesFor(person) {
  return (person.sources || []).map(getSource).filter(Boolean);
}

export function peopleCitingSource(sourceId) {
  return people.filter((p) => (p.sources || []).includes(sourceId));
}

// Respects the livingDetail switch in site.config.js.
export function displayDates(person) {
  if (person.living && site.livingDetail === "hidden") return "living";
  const b = person.birth?.date;
  const d = person.death?.date;
  if (b && d) return `${b} to ${d}`;
  if (b) return `born ${b}`;
  if (d) return `died ${d}`;
  return person.living ? "living" : "dates unknown";
}

export function displayYears(person) {
  if (person.living && site.livingDetail === "hidden") return "";
  // Keeps "about", "before" and "after" so an estimate never reads as a fact.
  const year = (s) => {
    if (!s) return "";
    const str = String(s);
    const y = (str.match(/\d{4}/) || [""])[0];
    if (!y) return "";
    if (/about|abt|circa/i.test(str)) return `abt ${y}`;
    if (/before|bef/i.test(str)) return `bef ${y}`;
    if (/after|aft/i.test(str)) return `aft ${y}`;
    return y;
  };
  const b = year(person.birth?.date);
  const d = year(person.death?.date);
  if (b && d) return `${b} to ${d}`;
  if (b) return `b. ${b}`;
  if (d) return `d. ${d}`;
  return "";
}

export function hideDetails(person) {
  return Boolean(person.living) && site.livingDetail === "hidden";
}

// Earliest year mentioned for a person, for sorting a line by depth.
export function earliestYear(person) {
  const s = person.birth?.date || person.death?.date || "";
  const m = String(s).match(/\d{4}/);
  return m ? parseInt(m[0], 10) : null;
}

// One entry per family line: how many people, how far back it reaches,
// and who sits at the top of it.
export function branches() {
  const lines = [...new Set(people.map((p) => p.line || "Other"))];
  return lines
    .map((line) => {
      const members = people.filter((p) => (p.line || "Other") === line);
      // The top of a branch is someone with no parents recorded here.
      // Among those, take the earliest dated one; fall back to any earliest.
      const byYear = (a, b) => (earliestYear(a) ?? 9999) - (earliestYear(b) ?? 9999);
      const roots = members.filter((p) => !(p.parents || []).length).sort(byYear);
      const dated = members.filter((p) => earliestYear(p) !== null).sort(byYear);
      const oldest = roots[0] || dated[0] || members[0];
      return {
        line,
        count: members.length,
        oldest,
        year: oldest ? earliestYear(oldest) : null,
        confidence: oldest?.confidence,
        place: oldest?.birth?.place || null,
        records: members.filter((p) => p.confidence === "record").length,
      };
    })
    .sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
}

// The two lines this site follows. Morkert is the surname; Houle reaches
// further back. Neither is more central than the other, so both are shown.
export const morkertLine = [
  "elias-morkert-1821",
  "henry-morkert-1851",
  "archibald-morkert-1888",
  "orris-morkert-1923",
  "rodney-morkert",
  "deann-morkert-1969",
  "tj-ricci",
];

export const houleLine = [
  "michel-houle",
  "john-b-houle-1840",
  "john-a-houle-1868",
  "john-joseph-houle-1891",
  "lloyd-houle-1917",
  "susan-houle-1949",
  "deann-morkert-1969",
  "tj-ricci",
];

// Kept for anything that still wants one spine.
export const directLine = morkertLine;
