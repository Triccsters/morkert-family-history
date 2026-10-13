// The family's moves on a map, drawn once at build time from data/places.json
// (coordinates from OpenStreetMap) and data/routes.json. Country and state
// outlines are Natural Earth via world-atlas and us-atlas (public domain).
// No map tiles and no browser code: the page ships a plain SVG.
import { geoMercator, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import { presimplify, simplify, quantile } from "topojson-simplify";
import world from "world-atlas/countries-110m.json";
import usRaw from "us-atlas/states-10m.json";
import { places } from "../lib/data";
import routeData from "../data/routes.json";

const COLORS = ["#6aa9ff", "#f39c12", "#2ecc71", "#e74c3c", "#c39bd3"];
const land = feature(world, world.objects.countries);
const borders = mesh(world, world.objects.countries, (a, b) => a !== b);
// state lines are thinned hard: they are context, and the full file is megabytes
const usP = presimplify(usRaw);
const us = simplify(usP, quantile(usP, 0.97));
const states = mesh(us, us.objects.states, (a, b) => a !== b);

function Panel({ ids, routes, numberOf, W, H, title }) {
  const pts = ids.map((id) => places.find((p) => p.id === id)).filter((p) => p?.coords);
  if (!pts.length) return null;
  const multi = { type: "MultiPoint", coordinates: pts.map((p) => [p.coords[1], p.coords[0]]) };
  // clipExtent cuts every outline at the panel edge, so nothing off-screen is shipped
  const proj = geoMercator().fitExtent([[40, 40], [W - 40, H - 40]], multi).clipExtent([[0, 0], [W, H]]);
  const path = geoPath(proj).digits(1);
  // only the countries that fall inside this panel, so the page stays small
  const inView = (f) => { const [[x0, y0], [x1, y1]] = path.bounds(f); return x1 > 0 && y1 > 0 && x0 < W && y0 < H; };
  const landHere = { type: "FeatureCollection", features: land.features.filter(inView) };
  const xy = (p) => proj([p.coords[1], p.coords[0]]);
  return (
    <figure className="map-panel">
      {title && <figcaption>{title}</figcaption>}
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title || "Map of the family's moves"}>
        <defs>
          {COLORS.map((c, i) => (
            <marker key={i} id={`arrow${i}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill={c} />
            </marker>
          ))}
          <clipPath id={`clip${W}${H}`}><rect width={W} height={H} /></clipPath>
        </defs>
        <g clipPath={`url(#clip${W}${H})`}>
          <rect width={W} height={H} className="map-sea" />
          <path d={path(landHere)} className="map-land" />
          <path d={path(borders)} className="map-border" />
          {pts.some((p) => p.coords[1] < -60 && p.coords[0] < 50) && <path d={path(states)} className="map-state" />}
          {routes.map((r, ri) =>
            r.stops.slice(1).map((to, i) => {
              const a = places.find((p) => p.id === r.stops[i]);
              const b = places.find((p) => p.id === to);
              if (!a?.coords || !b?.coords || !ids.includes(a.id) || !ids.includes(b.id)) return null;
              const [x1, y1] = xy(a), [x2, y2] = xy(b);
              const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
              const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
              const bend = Math.min(80, len * 0.2);
              const cx = mx - (dy / len) * bend, cy = my + (dx / len) * bend;
              return (
                <path key={ri + "-" + i} d={`M${x1},${y1} Q${cx},${cy} ${x2},${y2}`}
                  stroke={COLORS[ri % COLORS.length]} className="map-route" markerEnd={`url(#arrow${ri % COLORS.length})`} />
              );
            })
          )}
          {pts.map((p) => {
            const [x, y] = xy(p);
            return (
              <a key={p.id} href={`/places/${p.id}/`}>
                <circle cx={x} cy={y} r={p.coordsArea ? 7 : 5} className={p.coordsArea ? "map-area" : "map-dot"}>
                  <title>{p.name}{p.coordsArea ? " (drawn at its centre)" : ""}</title>
                </circle>
                <text x={x + 8} y={y - 6} className="map-num">{numberOf[p.id]}</text>
              </a>
            );
          })}
        </g>
      </svg>
    </figure>
  );
}

export default function MigrationMap({ insets = [] }) {
  const routes = routeData.routes;
  const mapped = places.filter((p) => p.coords);
  const numberOf = Object.fromEntries(mapped.map((p, i) => [p.id, i + 1]));
  const mainIds = mapped.map((p) => p.id);
  return (
    <div className="map">
      <Panel ids={mainIds} routes={routes} numberOf={numberOf} W={720} H={420} />
      {insets.map((ins) => {
        const ids = mapped.filter(ins.test).map((p) => p.id);
        return ids.length > 1 ? (
          <Panel key={ins.title} ids={ids} routes={routes} numberOf={numberOf} W={720} H={340} title={ins.title} />
        ) : null;
      })}
      <ul className="map-key">
        {routes.map((r, i) => (
          <li key={r.name}>
            <i style={{ background: COLORS[i % COLORS.length] }} /> <b>{r.name}</b>{" "}
            <span className="muted">{r.when}</span>
          </li>
        ))}
      </ul>
      <ol className="map-places">
        {mapped.map((p) => (
          <li key={p.id} value={numberOf[p.id]}>
            <a href={`/places/${p.id}/`}>{p.name}</a> <span className="muted small">{p.span}</span>
          </li>
        ))}
      </ol>
      <p className="muted small">
        Coordinates from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors.
        Outlines from Natural Earth. A county, state or province is drawn as a larger ring at its centre.
      </p>
    </div>
  );
}