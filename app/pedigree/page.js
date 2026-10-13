import Link from "next/link";
import Pedigree, { layoutPedigree } from "../../components/Pedigree";
import Badge from "../../components/Badge";

export const metadata = { title: "Pedigree" };

export default function PedigreePage() {
  const { repeats } = layoutPedigree("tj-ricci");
  return (
    <>
      <h2>The pedigree</h2>
      <p className="muted small">
        Every ancestor on this site, drawn from the data each time the site is
        built, so it is always current. T.J. is top left and each column to the
        right is one generation further back; the Ricci line runs along the top
        row. The coloured bar says how each person is known. Click anyone to see
        the records, and scroll sideways and down to see the whole chart.
      </p>
      <p className="small">
        {["record", "probable", "tree", "family"].map((k) => (
          <span key={k} style={{ marginRight: 10 }}>
            <Badge level={k} />
          </span>
        ))}
      </p>
      <div className="tree-figure pedigree">
        <Pedigree rootId="tj-ricci" />
      </div>
      {repeats.length > 0 && (
        <p className="muted small">
          Dashed boxes mark an ancestor reached by a second route (pedigree
          collapse):{" "}
          {repeats.map((p, i) => (
            <span key={p.id}>
              {i ? ", " : ""}
              <Link href={`/people/${p.id}/`}>{p.name}</Link>
            </span>
          ))}
          . Each rests on at least one probable link; see their pages.
        </p>
      )}
    </>
  );
}
