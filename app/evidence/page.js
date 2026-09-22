import Link from "next/link";
import { sources, peopleCitingSource } from "../../lib/data";

export const metadata = { title: "Evidence" };

const order = ["record", "compiled", "tree"];
const groupTitles = {
  record: "Original records",
  compiled: "Compiled sources",
  tree: "User-built trees",
};
const groupBlurbs = {
  record: "Civil registers, censuses, naturalisation papers, draft cards and newspapers. These carry the most weight.",
  compiled: "Find a Grave memorials and uploaded photographs. Written by volunteers from records they held, but a step removed.",
  tree: "Trees built by other researchers. Useful leads, treated as unverified until a document backs them.",
};

export default function EvidencePage() {
  return (
    <>
      <h2>Every source, in one place</h2>
      <p className="muted small">
        {sources.length} sources. Each links to the original where the original is
        online.
      </p>

      {order.map((strength) => {
        const group = sources.filter((s) => s.strength === strength);
        if (!group.length) return null;
        return (
          <section key={strength}>
            <h3>{groupTitles[strength]}</h3>
            <p className="muted small">{groupBlurbs[strength]}</p>
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>What it shows</th>
                  <th>Used for</th>
                </tr>
              </thead>
              <tbody>
                {group.map((s) => {
                  const cited = peopleCitingSource(s.id);
                  return (
                    <tr key={s.id}>
                      <td>
                        {s.url ? (
                          <a href={s.url} target="_blank" rel="noreferrer noopener">{s.title}</a>
                        ) : (
                          // No permalink (family knowledge, DNA, a private document).
                          // Render the title plainly rather than a link that goes nowhere.
                          <span>{s.title}</span>
                        )}
                        <div className="muted small">
                          {s.repository} · {s.type} · read {s.read}
                        </div>
                      </td>
                      <td>{s.proves}</td>
                      <td className="small">
                        {cited.map((p, i) => (
                          <span key={p.id}>
                            {i > 0 && ", "}
                            <Link href={`/people/${p.id}`}>{p.name}</Link>
                          </span>
                        ))}
                        {cited.length === 0 && (
                          <span className="muted">background</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}
    </>
  );
}
