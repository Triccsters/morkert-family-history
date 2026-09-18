import Link from "next/link";
import Badge from "./Badge";
import { displayYears } from "../lib/data";

export default function PersonCard({ person }) {
  return (
    <div className="card person-card">
      <h3>
        <Link href={`/people/${person.id}`}>{person.name}</Link>
      </h3>
      <div className="meta">
        {displayYears(person) && <span>{displayYears(person)} · </span>}
        {person.relation}
      </div>
      <div style={{ marginTop: 10 }}>
        <Badge level={person.confidence} />
      </div>
    </div>
  );
}
