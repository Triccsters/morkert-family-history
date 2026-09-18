// Site-wide settings. Change these, not the components.

export const site = {
  title: "Morkert Family History",
  tagline: "From Quebec and Ohio to Centerville, Leeds and Forest Lake, Minnesota",
  owner: "T.J. Ricci",
  // How much to show for anyone marked "living": true.
  //   "year"   birth year only, no day or month  (current setting)
  //   "hidden" name and place in the tree only, no dates
  //   "full"   everything stored for them
  // The data file itself only stores birth years for living people, so "full"
  // and "year" look the same until someone adds a full date by hand.
  livingDetail: "year",
  updated: "September 2026",
};

export const confidenceLabels = {
  record: {
    label: "Original record",
    blurb: "Read in a civil register, census, obituary or other primary document.",
    color: "#2ecc71",
  },
  probable: {
    label: "Probable match",
    blurb: "A record that fits on name, age and place, but nothing yet ties it to our line for certain.",
    color: "#c39bd3",
  },
  tree: {
    label: "User-built tree",
    blurb: "Taken from a tree someone else compiled. Not yet checked against a document.",
    color: "#f39c12",
  },
  family: {
    label: "Family knowledge",
    blurb: "Known within the family, no document consulted.",
    color: "#5dade2",
  },
};
