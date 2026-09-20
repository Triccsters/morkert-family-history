"""Check the Morkert/Houle site against the privacy rule.

The rule, from the project instructions: a living person gets a birth year,
never a full date, and no place details. READ-ONLY -- this never edits data/.
Exits 1 if anything is flagged, so it can gate a build.

Who it covers: anyone marked living, AND anyone with no death date who could
plausibly still be alive. An unset living flag is not evidence that someone
died, so unknown status is treated as protected.

THREE LEAK SURFACES, NOT ONE. This is the lesson that cost this repo a live
leak on 19 September 2026: Susan Houle's full birth date was removed from her
birth field and from the sources that cite her, and it STILL rendered on the
public page -- out of her own `notes` field. So this script checks:

  1. the built page, if there is one (catches anything that renders, from
     any field, including notes and a source's proves text);
  2. the raw data for every protected person -- their own fields, their
     `notes`, and the `proves` text of every source they cite -- so it works
     before a build and says WHICH field is at fault.

Benign hits (a census enumeration date, a deceased relative's date arriving
through a shared source) go in BENIGN with a reason, so the flag list stays
short enough to actually read.
"""
import json, io, sys, re, os

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATA = os.path.join(ROOT, 'data')
OUT = os.path.join(ROOT, 'out', 'people')

MONTH = (r'(?:January|February|March|April|May|June|July|August|September'
         r'|October|November|December)')
FULLDATE = re.compile(r'\b\d{1,2}\s+' + MONTH + r'\s+\d{4}\b'
                      r'|\b' + MONTH + r'\s+\d{1,2},?\s+\d{4}\b')

THIS_YEAR = 2026
OLDEST = THIS_YEAR - 110

# date -> why it is not a privacy problem for a LIVING person's page
BENIGN = {
    '23 October 2011': "Orris Morkert's death date, deceased, arriving through the "
                       "obituary that names his living relatives",
    '25 October 2011': "the date Orris Morkert's obituary was published",
}


def main():
    with io.open(os.path.join(DATA, 'people.json'), encoding='utf-8') as f:
        ppl = json.load(f)
    with io.open(os.path.join(DATA, 'sources.json'), encoding='utf-8') as f:
        src = {s['id']: s for s in json.load(f)}

    year = re.compile(r'\b(1[6-9]\d\d|20\d\d)\b')

    def birth_year(p):
        m = year.search(((p.get('birth') or {}).get('date') or ''))
        return int(m.group(1)) if m else None

    def protected(p):
        if p.get('living'):
            return 'living'
        if (p.get('death') or {}).get('date'):
            return None
        by = birth_year(p)
        if by is None:
            return 'undated'
        return 'maybe living' if by >= OLDEST else None

    subjects = [(p, protected(p)) for p in ppl]
    undated = [p for p, w in subjects if w == 'undated']
    subjects = [(p, w) for p, w in subjects if w and w != 'undated']
    print('people covered: %d of %d (born %d or later, or marked living)'
          % (len(subjects), len(ppl), OLDEST))
    if undated:
        print('not checked, no birth year and no death date: %s'
              % ', '.join(p['id'] for p in undated))

    # A stale out/ is the one thing that makes this script cry wolf. On
    # 19 September 2026 it reported Susan Houle's full birth date as a live
    # leak when the data had been clean for an hour and only the local build
    # was old. Say so loudly rather than letting someone re-fix a fixed bug.
    stale = False
    try:
        newest_data = max(os.path.getmtime(os.path.join(DATA, f))
                          for f in ('people.json', 'sources.json'))
        built = os.path.join(ROOT, 'out', 'index.html')
        if os.path.exists(built) and os.path.getmtime(built) < newest_data:
            stale = True
            print('\n  !! out/ IS OLDER THAN data/ -- every PAGE hit below may be\n'
                  '     a ghost of data you have already fixed. Rebuild, or trust\n'
                  '     the DATA and SOURCE lines and ignore the PAGE ones.\n')
    except OSError:
        pass

    flagged = missing = 0

    for p, why in subjects:
        pid = p['id']

        # --- surface 1: the person's own structured fields ---
        for ev in ('birth', 'marriage', 'death'):
            blk = p.get(ev) or {}
            d = blk.get('date') or ''
            if FULLDATE.search(d):
                flagged += 1
                print('  DATA %-9s %-26s (%s) %s' % (ev + '.date', pid, why, d))
            if ev == 'birth' and blk.get('place'):
                flagged += 1
                print('  DATA %-9s %-26s (%s) %s'
                      % ('birth.place', pid, why, blk['place']))

        # --- surface 2: the person's own notes ---
        for d in sorted(set(m.group(0) for m in FULLDATE.finditer(p.get('notes') or ''))):
            if d not in BENIGN:
                flagged += 1
                print('  DATA %-9s %-26s (%s) %s' % ('notes', pid, why, d))

        # --- surface 3: the proves text of every source they cite ---
        for sid in p.get('sources') or []:
            proves = (src.get(sid) or {}).get('proves') or ''
            for d in sorted(set(m.group(0) for m in FULLDATE.finditer(proves))):
                if d not in BENIGN:
                    flagged += 1
                    print('  SOURCE %-24s cited by %-22s (%s) %s'
                          % (sid, pid, why, d))

        # --- and the built page, which catches anything the above misses ---
        fp = os.path.join(OUT, pid, 'index.html')
        if not os.path.exists(fp):
            print('  no built page for %s (run the build to check rendering)' % pid)
            missing += 1
            continue
        with io.open(fp, encoding='utf-8') as f:
            txt = re.sub('<[^>]+>', ' ', f.read())
        hits = sorted({m.group(0) for m in FULLDATE.finditer(txt)})
        real = [h for h in hits if h not in BENIGN]
        if real:
            flagged += 1
            print('  PAGE      %-26s (%s) %s' % (pid, why, real))

    print('flagged: %d   pages not built: %d%s'
          % (flagged, missing, '   (out/ is STALE)' if stale else ''))
    return 1 if flagged else 0


if __name__ == '__main__':
    sys.exit(main())
