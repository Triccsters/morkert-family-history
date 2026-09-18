# Morkert Family History

A static site for T.J. Ricci's mother's side: the Morkert line from Ohio through
Indiana, Alabama and North Dakota, and the Houle line from Quebec through
Centerville and Forest Lake, Minnesota.

Same code as `ricci-family-history`. All the content lives in `data/`:

- `people.json` — one entry per person. Living people store a birth **year**
  only, never a full date.
- `sources.json` — every record, with a direct link to the record itself rather
  than to a search.
- `places.json` — the places, with the spellings each one is indexed under.
- `events.json` — the turning points, in order.
- `corrections.json` — claims from earlier research that the records disprove.

`site.config.js` holds the title, tagline and the `livingDetail` switch.

## Running it

```
npm install
npm run dev      # http://localhost:3000
npm run build    # static export into out/
```

Deploys on Vercel from `main`.
