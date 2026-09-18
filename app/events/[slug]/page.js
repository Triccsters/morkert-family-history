import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "../../../components/Badge";
import {
  events,
  getEvent,
  getPlace,
  getPerson,
  sourcesFor,
  displayYears,
} from "../../../lib/data";

export function generateStaticParams() {
  return events.map((e) => ({ slug: e.id }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const e = getEvent(slug);
  return { title: e ? e.title : "Event" };
}

export default async function EventPage({ params }) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  const place = event.placeId ? getPlace(event.placeId) : null;
  const cast = (event.people || []).map(getPerson).filter(Boolean);
  const eventSources = sourcesFor(event);

  return (
    <>
      <div className="muted small" style={{ marginTop: 8 }}>
        {event.date}
      </div>
      <h2 style={{ marginTop: 2, marginBottom: 8 }}>{event.title}</h2>
      <div style={{ marginBottom: 16 }}>
        <Badge level={event.confidence} />
        {place ? (
          <Link className="small" href={`/places/${place.id}`}>
            {event.place}
          </Link>
        ) : (
          <span className="muted small">{event.place}</span>
        )}
      </div>

      <div className="card">
        {event.paragraphs.map((text, i) => (
          <p
            key={i}
            style={{
              marginBottom: i === event.paragraphs.length - 1 ? 0 : undefined,
            }}
          >
            {text}
          </p>
        ))}
      </div>

      {cast.length > 0 && (
        <>
          <h3>Who it involved</h3>
          <ul className="line-list">
            {cast.map((p) => (
              <li key={p.id}>
                <Link href={`/people/${p.id}`}>{p.name}</Link>{" "}
                <span className="muted small">{displayYears(p)}</span>
                {p.relation && <div className="muted small">{p.relation}</div>}
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>Evidence</h3>
      {eventSources.length === 0 ? (
        <p className="muted small">No document has been linked to this yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>What it shows</th>
            </tr>
          </thead>
          <tbody>
            {eventSources.map((s) => (
              <tr key={s.id}>
                <td>
                  <a href={s.url} target="_blank" rel="noreferrer noopener">
                    {s.title}
                  </a>
                  <div className="muted small">{s.repository}</div>
                </td>
                <td>{s.proves}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="small" style={{ marginTop: 24 }}>
        <Link href="/events">The full timeline</Link>
      </p>
    </>
  );
}
