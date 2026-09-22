import Link from "next/link";
import { notFound } from "next/navigation";
import {
  places,
  getPlace,
  peopleAtPlace,
  eventsAtPlace,
  sourcesFor,
  displayYears,
} from "../../../lib/data";

export function generateStaticParams() {
  return places.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const pl = getPlace(slug);
  return { title: pl ? pl.name : "Place" };
}

function PeopleList({ title, list }) {
  if (!list.length) return null;
  return (
    <>
      <h3>{title}</h3>
      <ul className="line-list">
        {list.map((p) => (
          <li key={p.id}>
            <Link href={`/people/${p.id}`}>{p.name}</Link>{" "}
            <span className="muted small">{displayYears(p)}</span>
            {p.relation && <div className="muted small">{p.relation}</div>}
          </li>
        ))}
      </ul>
    </>
  );
}

export default async function PlacePage({ params }) {
  const { slug } = await params;
  const place = getPlace(slug);
  if (!place) notFound();

  const { born, died, married } = peopleAtPlace(place.id);
  const evs = eventsAtPlace(place.id);
  const placeSources = sourcesFor(place);

  return (
    <>
      <h2 style={{ marginTop: 8, marginBottom: 4 }}>{place.name}</h2>
      <div className="muted small" style={{ marginBottom: 16 }}>
        {place.region} · {place.span}
      </div>

      <div className="card">
        {place.paragraphs.map((text, i) => (
          <p key={i} style={{ marginBottom: i === place.paragraphs.length - 1 ? 0 : undefined }}>
            {text}
          </p>
        ))}
      </div>

      {evs.length > 0 && (
        <>
          <h3>What happened here</h3>
          <ul className="line-list">
            {evs.map((e) => (
              <li key={e.id}>
                <Link href={`/events/${e.id}`}>{e.title}</Link>{" "}
                <span className="muted small">{e.date}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <PeopleList title="Born here" list={born} />
      <PeopleList title="Married here" list={married} />
      <PeopleList title="Died here" list={died} />

      {born.length + died.length + married.length === 0 && (
        <p className="muted small">
          No person on the site has a birth, marriage or death recorded in this
          place yet.
        </p>
      )}

      {placeSources.length > 0 && (
        <>
          <h3>Evidence</h3>
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>What it shows</th>
              </tr>
            </thead>
            <tbody>
              {placeSources.map((s) => (
                <tr key={s.id}>
                  <td>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noreferrer noopener">{s.title}</a>
                    ) : (
                      // No permalink (family knowledge, DNA, a private document).
                      // Render the title plainly rather than a link that goes nowhere.
                      <span>{s.title}</span>
                    )}
                    <div className="muted small">{s.repository}</div>
                  </td>
                  <td>{s.proves}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <p className="small" style={{ marginTop: 24 }}>
        <Link href="/places">All places</Link>
      </p>
    </>
  );
}
