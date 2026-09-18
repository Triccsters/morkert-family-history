import Link from "next/link";
import Badge from "../../components/Badge";
import { eventsInOrder, getPlace } from "../../lib/data";

export const metadata = { title: "Events" };

export default function EventsPage() {
  const events = eventsInOrder();
  return (
    <>
      <h2>The turning points</h2>
      <p className="muted small">
        {events.length} moments that decided where this family lived and who it
        became, in order, from an Abruzzo marriage register in 1829 to the
        Minnesota wedding that joined the two sides in 1962.
      </p>

      <ol className="timeline">
        {events.map((e) => {
          const place = e.placeId ? getPlace(e.placeId) : null;
          return (
            <li key={e.id}>
              <div className="muted small">{e.date}</div>
              <h3 style={{ margin: "2px 0 6px" }}>
                <Link href={`/events/${e.id}`}>{e.title}</Link>
              </h3>
              <div style={{ marginBottom: 6 }}>
                <Badge level={e.confidence} />
                {place ? (
                  <Link className="small" href={`/places/${place.id}`}>
                    {e.place}
                  </Link>
                ) : (
                  <span className="muted small">{e.place}</span>
                )}
              </div>
              <p className="small" style={{ marginBottom: 0 }}>
                {e.summary}
              </p>
            </li>
          );
        })}
      </ol>
    </>
  );
}
