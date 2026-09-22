import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "../../../components/Badge";
import { RelationTo } from "../../../components/Viewer";
import {
  people,
  getPerson,
  parentsOf,
  spousesOf,
  childrenOf,
  sourcesFor,
  displayDates,
  hideDetails,
  placesForPerson,
  eventsForPerson,
} from "../../../lib/data";

export function generateStaticParams() {
  return people.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = getPerson(slug);
  return { title: p ? p.name : "Person" };
}

function PersonLinks({ list, empty }) {
  if (!list.length) return <span className="muted small">{empty}</span>;
  return (
    <>
      {list.map((p, i) => (
        <span key={p.id}>
          {i > 0 && ", "}
          <Link href={`/people/${p.id}`}>{p.name}</Link>
        </span>
      ))}
    </>
  );
}

export default async function PersonPage({ params }) {
  const { slug } = await params;
  const person = getPerson(slug);
  if (!person) notFound();

  const hidden = hideDetails(person);
  const parents = parentsOf(person);
  const spouses = spousesOf(person);
  const children = childrenOf(person.id);
  const personSources = sourcesFor(person);
  // Living people have their places suppressed along with their dates, so the
  // place links come from the same switch rather than a second rule.
  const personPlaces = hidden ? [] : placesForPerson(person);
  const personEvents = eventsForPerson(person.id);

  return (
    <>
      <h2 style={{ marginTop: 8 }}>{person.name}</h2>
      <div style={{ marginBottom: 16 }}>
        <Badge level={person.confidence} />
        <span className="muted small">{person.relation}</span>
      </div>
      <RelationTo personId={person.id} />

      <div className="card">
        <ul className="clean">
          <li>
            <strong>Dates:</strong> {displayDates(person)}
          </li>
          {!hidden && person.birth?.place && (
            <li>
              <strong>Born in:</strong> {person.birth.place}
            </li>
          )}
          {!hidden && person.death?.place && (
            <li>
              <strong>Died in:</strong> {person.death.place}
            </li>
          )}
          {!hidden && person.marriage && (
            <li>
              <strong>Married:</strong> {person.marriage.date}
              {person.marriage.place ? `, ${person.marriage.place}` : ""}
            </li>
          )}
          <li>
            <strong>Parents:</strong>{" "}
            <PersonLinks list={parents} empty="not known" />
          </li>
          <li>
            <strong>Spouse:</strong>{" "}
            <PersonLinks list={spouses} empty="none recorded" />
          </li>
          <li>
            <strong>Children on this site:</strong>{" "}
            <PersonLinks list={children} empty="none recorded" />
          </li>
        </ul>
      </div>

      {person.notes && !hidden && (
        <div className="card">
          <p style={{ marginBottom: 0 }}>{person.notes}</p>
        </div>
      )}

      {(personPlaces.length > 0 || personEvents.length > 0) && (
        <div className="card">
          {personPlaces.length > 0 && (
            <p style={{ marginTop: 0, marginBottom: personEvents.length ? undefined : 0 }}>
              <strong>Places:</strong>{" "}
              {personPlaces.map((pl, i) => (
                <span key={pl.id}>
                  {i > 0 && ", "}
                  <Link href={`/places/${pl.id}`}>{pl.name}</Link>
                </span>
              ))}
            </p>
          )}
          {personEvents.length > 0 && (
            <p style={{ marginBottom: 0 }}>
              <strong>Events:</strong>{" "}
              {personEvents.map((e, i) => (
                <span key={e.id}>
                  {i > 0 && ", "}
                  <Link href={`/events/${e.id}`}>{e.title}</Link>
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      <h3>Evidence</h3>
      {personSources.length === 0 ? (
        <p className="muted small">
          No document has been linked for this person yet.
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>What it shows</th>
            </tr>
          </thead>
          <tbody>
            {personSources.map((s) => (
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
      )}
    </>
  );
}
