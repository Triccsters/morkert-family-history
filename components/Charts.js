// Small charts drawn from the site's own data at build time. Plain SVG, no
// library and no browser code: the numbers are fixed when the site is built.
import { getPerson, earliestYear } from "../lib/data";

const yearOf = (s) => {
  const m = String(s || "").match(/\d{4}/);
  return m ? parseInt(m[0], 10) : null;
};

// One bar per family line with at least `min` people: the green part is how
// many are documented in an original record, the grey part is everyone else.
export function ProvenBars({ lines, min = 3 }) {
  const rows = lines.filter((b) => b.count >= min).sort((a, b) => b.count - a.count);
  if (!rows.length) return null;
  const W = 640, ROW = 24, L = 110, R = 70;
  const max = Math.max(...rows.map((r) => r.count));
  const x = (n) => (n / max) * (W - L - R);
  const H = rows.length * ROW + 6;
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="How many people on each branch are documented in an original record">
        {rows.map((r, i) => (
          <g key={r.line} transform={`translate(0,${i * ROW + 3})`}>
            <text x={L - 8} y={ROW / 2 + 1} className="chart-label" textAnchor="end">{r.line}</text>
            <rect x={L} y={3} width={x(r.count)} height={ROW - 8} rx={3} className="bar-rest" />
            <rect x={L} y={3} width={x(r.records)} height={ROW - 8} rx={3} className="bar-record" />
            <text x={L + x(r.count) + 6} y={ROW / 2 + 1} className="chart-value">
              {r.records} of {r.count}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// Birth to death for each person in each group, on one time axis.
// No death date: a dot at birth and the words "death not found yet".
export function Lifespans({ groups }) {
  const now = new Date().getFullYear();
  const rows = [];
  for (const g of groups) {
    rows.push({ title: g.title });
    for (const id of g.ids) {
      const p = getPerson(id);
      if (!p) continue;
      const b = yearOf(p.birth?.date) ?? earliestYear(p);
      if (b === null) continue;
      const d = yearOf(p.death?.date) ?? (p.living ? now : null);
      rows.push({ p, b, d, living: !!p.living });
    }
  }
  const people = rows.filter((r) => r.p);
  if (!people.length) return null;
  const lo = Math.floor(Math.min(...people.map((r) => r.b)) / 50) * 50;
  const hi = Math.ceil(now / 50) * 50;
  const W = 640, ROW = 22, L = 170, R = 12, T = 4, AX = 22;
  const x = (y) => L + ((y - lo) / (hi - lo)) * (W - L - R);
  const H = rows.length * ROW + T + AX;
  const ticks = [];
  for (let t = lo; t <= hi; t += 50) ticks.push(t);
  const short = (s) => (s.length > 24 ? s.slice(0, 23) + "…" : s);
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Lifespans of the direct line, birth to death">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={T} y2={H - AX} className="chart-grid" />
            <text x={x(t)} y={H - 6} className="chart-tick" textAnchor="middle">{t}</text>
          </g>
        ))}
        {rows.map((r, i) =>
          r.title ? (
            <text key={"t" + i} x={4} y={T + i * ROW + ROW / 2 + 4} className="chart-group">{r.title}</text>
          ) : (
            <g key={r.p.id} transform={`translate(0,${T + i * ROW})`}>
              <a href={`/people/${r.p.id}/`}>
                <text x={L - 8} y={ROW / 2 + 4} className="chart-label" textAnchor="end">
                  <title>{r.p.name}</title>{short(r.p.name)}
                </text>
              </a>
              {r.d !== null ? (
                <rect x={x(r.b)} y={5} width={Math.max(3, x(r.d) - x(r.b))} height={ROW - 10} rx={3}
                  className={r.living ? "bar-living" : "bar-record"}>
                  <title>{`${r.p.name}: ${r.b}–${r.living ? "living" : r.d}`}</title>
                </rect>
              ) : (
                <>
                  <circle cx={x(r.b)} cy={ROW / 2} r={4} className="bar-record"><title>{`${r.p.name}: born ${r.b}`}</title></circle>
                  <text x={x(r.b) + 8} y={ROW / 2 + 4} className="chart-tick">death not found yet</text>
                </>
              )}
            </g>
          )
        )}
      </svg>
    </div>
  );
}