import { corrections, getSource } from "../../lib/data";

export const metadata = { title: "Corrections" };

export default function CorrectionsPage() {
  return (
    <>
      <h2>Claims that are wrong</h2>
      <p>
        Research on this side of the family was done with AI help in 2025 and
        2026, and a good deal of it is wrong. Those claims are still sitting in
        documents and person notes, so they are listed here with what the records
        actually say. If you found this family through one of those documents,
        start here. One of them turned out to be right by accident, and that is
        listed too.
      </p>

      {corrections.map((c, i) => (
        <div className="card" key={i}>
          <h3 style={{ marginTop: 0 }}>{c.claim}</h3>
          <p className="muted small">
            Appears in: {c.where} · <strong>{c.verdict}</strong>
          </p>
          <p style={{ marginBottom: c.sources?.length ? 10 : 0 }}>{c.correction}</p>
          {c.sources?.length > 0 && (
            <p className="small" style={{ marginBottom: 0 }}>
              Evidence:{" "}
              {c.sources.map((id, j) => {
                const s = getSource(id);
                if (!s) return null;
                return (
                  <span key={id}>
                    {j > 0 && ", "}
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noreferrer noopener">{s.title}</a>
                    ) : (
                      // No permalink (family knowledge, DNA, a private document).
                      // Render the title plainly rather than a link that goes nowhere.
                      <span>{s.title}</span>
                    )}
                  </span>
                );
              })}
            </p>
          )}
        </div>
      ))}
    </>
  );
}
