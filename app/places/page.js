import Link from "next/link";
import { places, placeCount, eventsAtPlace } from "../../lib/data";

export const metadata = { title: "Places" };

export default function PlacesPage() {
  return (
    <>
      <h2>The places this family came from</h2>
      <p className="muted small">
        {places.length} places across two continents. Each one lists everybody on the site
        who was born, married or died there, and what is known about the place
        itself.
      </p>

      <div className="grid">
        {places.map((pl) => {
          const count = placeCount(pl.id);
          const evs = eventsAtPlace(pl.id).length;
          return (
            <div className="card" key={pl.id}>
              <h3 style={{ marginTop: 0, marginBottom: 4 }}>
                <Link href={`/places/${pl.id}`}>{pl.name}</Link>
              </h3>
              <div className="muted small">{pl.region}</div>
              <p className="small" style={{ marginTop: 10, marginBottom: 8 }}>
                {pl.summary}
              </p>
              <div className="muted small">
                {pl.span}
                {count ? ` · ${count} ${count === 1 ? "person" : "people"}` : ""}
                {evs ? ` · ${evs} ${evs === 1 ? "event" : "events"}` : ""}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
