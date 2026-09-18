export const metadata = { title: "Family tree" };

const moves = [
  {
    who: "Michel Houle and his children",
    when: "about 1855",
    from: "Quebec",
    to: "Centerville, Anoka County, Minnesota",
    note: "Two sons born in Canada, John B. about 1840 and Thomas about 1851, both died in Minnesota. No crossing record found.",
  },
  {
    who: "Elias and Elizabeth Morkert",
    when: "1820s to 1840s",
    from: "Ohio",
    to: "Clay Township, Carroll County, Indiana",
    note: "Both born in Ohio, both farming in Indiana by 1880, with Indiana-born children. Her parents were born in Pennsylvania.",
  },
  {
    who: "Henry, Mary and Archibald Morkert",
    when: "by 1910",
    from: "Carroll County, Indiana",
    to: "Foley and Magnolia Springs, Baldwin County, Alabama",
    note: "One census page is the entire evidence for this leg, and no earlier account of the family had it at all.",
  },
  {
    who: "Archibald Morkert",
    when: "by 1917",
    from: "Alabama",
    to: "Leeds, Benson County, North Dakota",
    note: "Registered for the WWI draft in Benson County and farmed there until at least 1950. His father Henry died at Leeds in 1933.",
  },
  {
    who: "Orris Morkert",
    when: "after 1945",
    from: "Leeds, North Dakota",
    to: "Forest Lake, Washington County, Minnesota",
    note: "The move that put the Morkerts in the same town as the Houles. The year has not been documented.",
  },
];

export default function TreePage() {
  return (
    <>
      <h2>Both lines, on one page</h2>
      <p className="muted small">
        Green is read in an original record. Purple is a probable match that is
        not proven. Blue is living memory. The two lines converge on DeAnn.
      </p>
      <div className="tree-figure">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/tree.svg"
          alt="Family tree showing the Houle line from Michel Houle in Canada and the Morkert line from Elias Morkert in Ohio, converging on DeAnn Morkert"
        />
      </div>

      <h2>Two families, two countries</h2>
      <div className="card">
        <p>
          <strong>The Houles</strong> are French-Canadian and Catholic. Five
          surnames on that side are Quebec names: Houle, Tourville, Letourneau,
          Bernier and LaCasse. They came to Centerville, a village founded by
          French-Canadian families in the 1850s, and stayed within about fifteen
          miles of it for four generations.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>The Morkerts</strong> are German-speaking and came the other
          way across the country. Morkert is a German or Alsatian name and
          Burkhalter is Swiss German, and the trail runs back through Indiana and
          Ohio toward Pennsylvania. They moved far and often, four states in
          three generations, and never stayed anywhere as long as the Houles
          stayed in one county.
        </p>
      </div>

      <h2>The moves</h2>
      <table>
        <thead>
          <tr>
            <th>Who</th>
            <th>When</th>
            <th>From</th>
            <th>To</th>
          </tr>
        </thead>
        <tbody>
          {moves.map((m) => (
            <tr key={m.who}>
              <td>
                <strong>{m.who}</strong>
                <div className="muted small">{m.note}</div>
              </td>
              <td>{m.when}</td>
              <td>{m.from}</td>
              <td>{m.to}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted small">
        The surname is the reason most of this was hard to find. Exact-match
        search returns nothing for Morkert. The 1930 census writes the family as
        Morhert at Leeds and Marbert at York, the same county in the same year.
      </p>
    </>
  );
}
