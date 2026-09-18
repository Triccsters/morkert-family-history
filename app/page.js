import Link from "next/link";
import {
  people,
  sources,
  getPerson,
  spousesOf,
  displayYears,
  morkertLine,
  houleLine,
  branches,
} from "../lib/data";
import { confidenceLabels } from "../site.config";
import { YourLine } from "../components/Viewer";

function LineRow({ id }) {
  const p = getPerson(id);
  if (!p) return null;
  const spouses = spousesOf(p);
  return (
    <li>
      <Link href={`/people/${p.id}`}>{p.name}</Link>{" "}
      <span className="muted small">{displayYears(p)}</span>
      {spouses.length > 0 && (
        <div className="small" style={{ marginTop: 2 }}>
          <span className="muted">married </span>
          {spouses.map((s, i) => (
            <span key={s.id}>
              {i > 0 && ", "}
              <Link href={`/people/${s.id}`}>{s.name}</Link>{" "}
              <span className="muted">{displayYears(s)}</span>
            </span>
          ))}
        </div>
      )}
      {p.relation && <div className="muted small">{p.relation}</div>}
    </li>
  );
}

export default function Home() {
  const recordCount = people.filter((p) => p.confidence === "record").length;
  const lines = branches();

  return (
    <>
      <div className="card">
        <p>
          This is the paper trail for T.J. Ricci&apos;s mother&apos;s side. Two
          families meet in it. The <strong>Houles</strong> came from{" "}
          <strong>Quebec</strong> in the 1850s and settled at{" "}
          <strong>Centerville</strong>, a French-Canadian village in Anoka
          County, then moved to <strong>Forest Lake</strong>. The{" "}
          <strong>Morkerts</strong> came out of <strong>Ohio</strong>, farmed in{" "}
          <strong>Carroll County, Indiana</strong>, turned up in{" "}
          <strong>Baldwin County, Alabama</strong> in 1910, spent forty years at{" "}
          <strong>Leeds, North Dakota</strong>, and reached Minnesota after the
          Second World War.
        </p>
        <p>
          <strong>If you are family, pick your name at the top of the page.</strong>{" "}
          Every person will then show how they are related to you. Nothing is
          sent anywhere; the choice is remembered only in your browser.
        </p>
        <p className="small">
          There is a page for each <Link href="/places">place</Link> and each of
          the <Link href="/events">turning points</Link> that moved this family
          from one of them to the next.
        </p>
        <p className="muted small" style={{ marginBottom: 0 }}>
          {people.length} people recorded, {recordCount} documented in an
          original record, {sources.length} sources linked, every one a direct
          link to the record itself.
        </p>
      </div>

      <h2>The Morkert line</h2>
      <p className="muted small">
        Seven generations, from Ohio before 1821 to now.
      </p>
      <ul className="line-list">
        {morkertLine.map((id) => (
          <LineRow key={id} id={id} />
        ))}
      </ul>

      <h2>The Houle line</h2>
      <p className="muted small">
        The deeper of the two, and the one that crosses a border.
      </p>
      <ul className="line-list">
        {houleLine.map((id) => (
          <LineRow key={id} id={id} />
        ))}
      </ul>

      <YourLine />

      <h2>How far back each branch goes</h2>
      <p className="muted small">
        Every surname in the tree, oldest first, with the earliest person found so
        far on that branch.
      </p>
      <table>
        <thead>
          <tr>
            <th>Branch</th>
            <th>Reaches back to</th>
            <th>People</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((b) => (
            <tr key={b.line}>
              <td>
                <strong>{b.line}</strong>
                <div className="muted small">
                  {b.records} of {b.count} documented in an original record
                </div>
              </td>
              <td>
                {b.oldest ? (
                  <>
                    <Link href={`/people/${b.oldest.id}`}>{b.oldest.name}</Link>
                    <div className="muted small">
                      {displayYears(b.oldest) || "no dates yet"}
                      {b.place ? ` · ${b.place}` : ""}
                    </div>
                  </>
                ) : (
                  <span className="muted">nothing yet</span>
                )}
              </td>
              <td>{b.count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>How claims are marked</h2>
      <div className="grid">
        {Object.entries(confidenceLabels).map(([key, c]) => (
          <div className="card" key={key}>
            <span className={`badge ${key}`}>{c.label}</span>
            <p className="small muted" style={{ marginTop: 10, marginBottom: 0 }}>
              {c.blurb}
            </p>
          </div>
        ))}
      </div>

      <h2>What is settled, and what is not</h2>
      <div className="card">
        <p>
          <strong>Settled:</strong> the Houle line is documented at every step
          from Susan back to Michel Houle, five generations, on birth indexes,
          censuses, marriage registers and death records. The Morkert line is
          documented from DeAnn back to Henry Newton Morkert, born in Indiana in
          1851 and buried in North Dakota in 1933.
        </p>
        <p>
          <strong>Not settled:</strong> Elias Morkert is a probable father for
          Henry rather than a proven one. Julia Morkert&apos;s and Mary
          Morkert&apos;s maiden names are unproven. Nothing above Michel Houle
          has been found, and no crossing has been found for the family that
          brought him.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>Known to be wrong:</strong> earlier research on this side of the
          family, produced with AI help, put a different man in Lloyd Houle&apos;s
          place as a father and a different man in Henry Morkert&apos;s. Both are
          listed on the <Link href="/corrections">corrections page</Link>, with
          what the records actually say, so nobody inherits them.
        </p>
      </div>
    </>
  );
}
