import { people } from "../../lib/data";
import PersonCard from "../../components/PersonCard";

export const metadata = { title: "People" };

export default function PeopleIndex() {
  const lines = [...new Set(people.map((p) => p.line || "Other"))];

  return (
    <>
      <h2>Everyone on record</h2>
      <p className="muted small">
        Grouped by family line. Each page lists what is known, who the parents
        and children were, and the records behind it.
      </p>
      {lines.map((line) => (
        <section key={line}>
          <h3>{line}</h3>
          <div className="grid">
            {people
              .filter((p) => (p.line || "Other") === line)
              .map((p) => (
                <PersonCard key={p.id} person={p} />
              ))}
          </div>
        </section>
      ))}
    </>
  );
}
