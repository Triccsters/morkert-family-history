import { getPerson, displayYears } from "../lib/data";
import { confidenceLabels } from "../site.config";

// A pedigree chart drawn straight from people.json at build time, so it can
// never drift from the data the way a hand-drawn diagram does.
// The root sits top left; each column to the right is one generation back.

const COL = 222; // column pitch
const W = 200; // node width
const H = 44; // node height
const ROW = 52; // row pitch
const TOP = 34; // room for the generation headings
const PAD = 8;

const genName = (g) => {
  if (g === 0) return "";
  if (g === 1) return "Parents";
  if (g === 2) return "Grandparents";
  if (g === 3) return "Great-grandparents";
  const n = g - 2;
  const suf = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
  return `${n}${suf} great-grandparents`;
};

const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

export function layoutPedigree(rootId) {
  const nodes = [];
  const links = [];
  const seen = new Set();
  const repeats = new Set();

  // Each call returns a subtree: its nodes (y relative to the subtree's root)
  // and, per generation, the highest and lowest y it occupies. A second
  // parent's subtree is slid up against the first one generation by
  // generation, so a short maternal line tucks in under a long paternal one
  // instead of starting below the bottom of it.
  function build(id, gen) {
    const p = getPerson(id);
    if (!p) return null;
    const leaf = (repeat) => {
      const n = { p, gen, y: 0, repeat };
      nodes.push(n);
      return { root: n, members: [n], top: { [gen]: 0 }, bot: { [gen]: 0 } };
    };
    if (seen.has(id)) {
      // Pedigree collapse: the same ancestor reached by a second route.
      repeats.add(id);
      return leaf(true);
    }
    seen.add(id);
    const parents = (p.parents || []).filter((q) => getPerson(q));
    if (!parents.length) return leaf(false);

    const n = { p, gen, y: 0, repeat: false };
    nodes.push(n);
    const acc = { root: n, members: [n], top: {}, bot: {} };
    let first = true;
    for (const q of parents) {
      const sub = build(q, gen + 1);
      if (!sub) continue;
      let dy = 0;
      if (!first) {
        for (const L of Object.keys(sub.top)) {
          if (acc.bot[L] !== undefined) dy = Math.max(dy, acc.bot[L] + ROW - sub.top[L]);
        }
      }
      sub.members.forEach((m) => (m.y += dy));
      for (const L of Object.keys(sub.top)) {
        const t = sub.top[L] + dy;
        const bt = sub.bot[L] + dy;
        acc.top[L] = acc.top[L] === undefined ? t : Math.min(acc.top[L], t);
        acc.bot[L] = acc.bot[L] === undefined ? bt : Math.max(acc.bot[L], bt);
      }
      acc.members.push(...sub.members);
      links.push([n, sub.root]);
      first = false;
    }
    // Top-aligned: level with the first parent, so the paternal line runs
    // straight along the top row.
    n.y = links.filter(([c]) => c === n)[0][1].y;
    acc.top[gen] = n.y;
    acc.bot[gen] = n.y;
    return acc;
  }

  build(rootId, 0);
  const minY = Math.min(...nodes.map((n) => n.y));
  nodes.forEach((n) => (n.y -= minY));
  const maxGen = Math.max(...nodes.map((n) => n.gen));
  const maxY = Math.max(...nodes.map((n) => n.y));
  return {
    nodes,
    links,
    repeats: [...repeats].map(getPerson),
    width: (maxGen + 1) * COL + PAD * 2,
    height: maxY + H + TOP + PAD,
    maxGen,
  };
}

export default function Pedigree({ rootId }) {
  const { nodes, links, width, height, maxGen } = layoutPedigree(rootId);
  const x = (g) => PAD + g * COL;
  const y = (v) => TOP + v;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Pedigree chart of T.J. Ricci's maternal ancestry, generated from the site's data"
      style={{ fontFamily: "inherit" }}
    >
      {Array.from({ length: maxGen + 1 }, (_, g) => (
        <text key={g} x={x(g) + 4} y={18} fill="#aab4c0" fontSize="11" letterSpacing="0.4">
          {genName(g).toUpperCase()}
        </text>
      ))}

      {links.map(([a, b], i) => {
        const x1 = x(a.gen) + W;
        const y1 = y(a.y) + H / 2;
        const x2 = x(b.gen);
        const y2 = y(b.y) + H / 2;
        const mid = x1 + (x2 - x1) / 2;
        return (
          <path
            key={i}
            d={`M${x1} ${y1} H${mid} V${y2} H${x2}`}
            fill="none"
            stroke="#3d4a5a"
            strokeWidth="1.5"
          />
        );
      })}

      {nodes.map((n, i) => {
        const c = confidenceLabels[n.p.confidence]?.color || "#aab4c0";
        const years = displayYears(n.p);
        const nx = x(n.gen);
        const ny = y(n.y);
        return (
          <a key={i} href={`/people/${n.p.id}/`}>
            <title>
              {`${n.p.name}${years ? ", " + years : ""} (${
                confidenceLabels[n.p.confidence]?.label || "unrated"
              })${n.repeat ? ". Also appears elsewhere in this chart." : ""}`}
            </title>
            <rect
              x={nx}
              y={ny}
              width={W}
              height={H}
              rx="7"
              fill={n.repeat ? "#161b22" : "#1a1f27"}
              stroke={n.repeat ? c : "#2f3946"}
              strokeDasharray={n.repeat ? "4 3" : undefined}
            />
            <rect x={nx} y={ny} width="5" height={H} rx="2" fill={c} />
            <text x={nx + 12} y={ny + 18} fill="#f2f5f8" fontSize="12.5" fontWeight="600">
              {clip(n.p.name, 30)}
            </text>
            <text x={nx + 12} y={ny + 34} fill="#aab4c0" fontSize="11">
              {n.repeat ? `again (${years || "see above"})` : years || " "}
            </text>
          </a>
        );
      })}
    </svg>
  );
}
