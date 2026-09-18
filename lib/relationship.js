import { people } from "./data";

const byId = Object.fromEntries(people.map((p) => [p.id, p]));

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// "great-great-grandfather" gets unreadable fast, so anything past
// great-grandparent is written as "2nd great-grandfather" and so on.
function greats(n, base) {
  // n = generations above parent level. 0 = parent, 1 = grandparent, 2 = great-grandparent
  if (n === 0) return base;
  if (n === 1) return `grand${base}`;
  if (n === 2) return `great-grand${base}`;
  return `${ordinal(n - 1)} great-grand${base}`;
}

function sexWords(person, male, female, neutral) {
  // The data does not record sex, so guess from the relation text where we can.
  const r = (person.relation || "").toLowerCase();
  if (/father|son|uncle|grandfather|brother/.test(r)) return male;
  if (/mother|daughter|aunt|grandmother|sister/.test(r)) return female;
  return neutral;
}

// Every ancestor of a person, with how many generations up they are.
export function ancestorMap(id, depth = 0, acc = new Map()) {
  if (acc.has(id) && acc.get(id) <= depth) return acc;
  acc.set(id, depth);
  const p = byId[id];
  if (!p) return acc;
  for (const parent of p.parents || []) ancestorMap(parent, depth + 1, acc);
  return acc;
}

function bloodRelation(viewerId, targetId) {
  if (viewerId === targetId) return "you";

  const mine = ancestorMap(viewerId);
  const theirs = ancestorMap(targetId);

  let best = null;
  for (const [ancestor, up] of mine) {
    if (theirs.has(ancestor)) {
      const down = theirs.get(ancestor);
      if (!best || up + down < best.up + best.down) best = { ancestor, up, down };
    }
  }
  if (!best) return null;

  const { up, down } = best;
  const target = byId[targetId];

  // Direct ancestor of the viewer.
  if (down === 0) {
    const base = sexWords(target, "father", "mother", "parent");
    return `your ${greats(up - 1, base)}`;
  }
  // Direct descendant of the viewer.
  if (up === 0) {
    const base = sexWords(target, "son", "daughter", "child");
    if (down === 1) return `your ${base}`;
    const word = base === "son" ? "grandson" : base === "daughter" ? "granddaughter" : "grandchild";
    if (down === 2) return `your ${word}`;
    if (down === 3) return `your great-${word}`;
    return `your ${ordinal(down - 2)} great-${word}`;
  }
  // Siblings. A half-sibling is marked in the data rather than guessed:
  // a missing mother in the file is not evidence of a half relationship.
  if (up === 1 && down === 1) {
    const viewer = byId[viewerId];
    const half = Boolean(target.halfSibling || viewer?.halfSibling);
    const base = sexWords(target, "brother", "sister", "sibling");
    return `your ${half ? "half-" : ""}${base}`;
  }
  // Aunt or uncle, and their greats.
  if (up > 1 && down === 1) {
    const base = sexWords(target, "uncle", "aunt", "aunt or uncle");
    if (up === 2) return `your ${base}`;
    if (up === 3) return `your great-${base}`;
    return `your ${ordinal(up - 2)} great-${base}`;
  }
  // Niece or nephew.
  if (up === 1 && down > 1) {
    const base = sexWords(target, "nephew", "niece", "nephew or niece");
    if (down === 2) return `your ${base}`;
    if (down === 3) return `your great-${base}`;
    return `your ${ordinal(down - 2)} great-${base}`;
  }
  // Cousins.
  const degree = Math.min(up, down) - 1;
  const removed = Math.abs(up - down);
  let label = `your ${ordinal(degree)} cousin`;
  if (removed === 1) label += " once removed";
  else if (removed === 2) label += " twice removed";
  else if (removed > 2) label += ` ${removed} times removed`;
  return label;
}

// Blood first, then marriage, so in-laws still get an answer.
export function relationship(viewerId, targetId) {
  if (!viewerId || !targetId) return null;
  const direct = bloodRelation(viewerId, targetId);
  if (direct) return direct;

  const viewer = byId[viewerId];
  const target = byId[targetId];
  if (!viewer || !target) return null;

  if ((viewer.spouses || []).includes(targetId)) return "your spouse";

  // Married to a blood relative of yours.
  for (const spouseId of target.spouses || []) {
    const r = bloodRelation(viewerId, spouseId);
    if (r && r !== "you") return `married to ${r}`;
    if (r === "you") return "your spouse";
  }
  // A blood relative of yours married into their family.
  for (const spouseId of viewer.spouses || []) {
    const r = bloodRelation(spouseId, targetId);
    if (r) return `${r.replace("your ", "your spouse's ")}`;
  }
  return "no traced relationship yet";
}

// The viewer's own line upward, one person per generation.
export function ancestorLine(viewerId) {
  const out = [];
  let current = byId[viewerId];
  const seen = new Set();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    out.push(current);
    const parentId = (current.parents || [])[0];
    current = parentId ? byId[parentId] : null;
  }
  return out;
}

// Only living people can be the visitor, since the picker asks who is
// actually reading the page. Oldest first, so the generations read in order.
export function pickablePeople() {
  const year = (p) => {
    const m = String(p.birth?.date || "").match(/\d{4}/);
    return m ? parseInt(m[0], 10) : 9999;
  };
  return people.filter((p) => p.living).sort((a, b) => year(a) - year(b));
}
