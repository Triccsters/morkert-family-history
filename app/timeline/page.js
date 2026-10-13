import Link from "next/link";
import Badge from "../../components/Badge";
import { timelineRows } from "../../lib/timeline";
import { Lifespans } from "../../components/Charts";
import { morkertLine, houleLine } from "../../lib/data";

export const metadata = { title: "Timeline" };

function Names({ subjects }) {
  return subjects.map((p, i) => (
    <span key={p.id}>
      {i ? (i === subjects.length - 1 ? " and " : ", ") : ""}
      <Link href={`/people/${p.id}/`}>{p.name}</Link>
    </span>
  ));
}

export default function TimelinePage() {
  const { rows, decades, centuries, undated } = timelineRows();
  // The jump bar points at the first decade actually present in each century,
  // so 1670 answers to "1600s" and no link lands on a missing anchor.
  const anchor = new Map();
  for (const d of decades) {
    const c = Math.floor(d.decade / 100) * 100;
    if (!anchor.has(c)) anchor.set(c, d.decade);
  }

  return (
    <>
      <h2>Timeline</h2>
      <p className="muted small">
        Every dated birth, marriage, death and event on this site, oldest first
        — {rows.length} of them, drawn from the data at every build. Dates read
        as the record writes them, so &quot;about 1757&quot; sorts on its year
        and still reads as an estimate. Living people are shown with a year
        only.
      </p>

      <h3>The direct line, birth to death</h3>
      <Lifespans groups={[{ title: "Morkert line", ids: morkertLine }, { title: "Houle line", ids: houleLine }]} />

      <nav className="jumpbar">
        {centuries.map((c) => (
          <a key={c} href={`#c${c}`}>
            {c}s
          </a>
        ))}
        <a href="#undated">Undated</a>
      </nav>

      {decades.map(({ decade, rows: drows }) => (
        <section key={decade}>
          <h3
            id={
              anchor.get(Math.floor(decade / 100) * 100) === decade
                ? `c${Math.floor(decade / 100) * 100}`
                : `d${decade}`
            }
            className="decade"
          >
            {decade}s
          </h3>
          <table className="timeline">
            <tbody>
              {drows.map((r, i) => (
                <tr key={r.kind + i}>
                  <td className="tl-when">
                    {r.dateText}
                    {r.date.approximate && (
                      <div className="muted small">approximate</div>
                    )}
                  </td>
                  <td>
                    {r.kind === "event" ? (
                      <>
                        <Link href={`/events/${r.eventId}/`}>{r.title}</Link>
                        {r.subjects.length > 0 && (
                          <div className="muted small">
                            <Names subjects={r.subjects} />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {r.label} <Names subjects={r.subjects} />
                      </>
                    )}
                    {r.place && (
                      <div className="muted small">
                        {r.placeId ? (
                          <Link href={`/places/${r.placeId}/`}>{r.place}</Link>
                        ) : (
                          r.place
                        )}
                      </div>
                    )}
                  </td>
                  <td className="tl-grade">
                    <Badge level={r.confidence} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <h3 id="undated">No date yet ({undated.length})</h3>
      <p className="muted small">
        On the site, but with nothing dated to place them here. Each one is a
        record still to find.
      </p>
      <p className="small">
        {undated.map((p, i) => (
          <span key={p.id}>
            {i ? " · " : ""}
            <Link href={`/people/${p.id}/`}>{p.name}</Link>
          </span>
        ))}
      </p>
    </>
  );
}
