import { confidenceLabels } from "../site.config";

export default function Badge({ level }) {
  const c = confidenceLabels[level];
  if (!c) return null;
  return (
    <span className={`badge ${level}`} title={c.blurb}>
      {c.label}
    </span>
  );
}
