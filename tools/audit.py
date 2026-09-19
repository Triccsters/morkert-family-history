"""Audit a data folder against the project's own rules. Read-only.

    python tools/audit.py <data-dir>

Checks, in order of how badly they break the rules:

1. confidence says 'record' but no cited source has strength 'record'
2. a person cites no source at all
3. a dated claim whose cited sources never mention that year
4. a source nobody cites
5. a person cites a source id that does not exist
"""
import json, io, os, re, sys

sys.stdout.reconfigure(encoding='utf-8')
YEAR = re.compile(r'\b(1[6-9]\d\d|20\d\d)\b')


def main(argv):
    d = argv[0] if argv else 'data'
    with io.open(os.path.join(d, 'people.json'), encoding='utf-8') as f:
        people = json.load(f)
    with io.open(os.path.join(d, 'sources.json'), encoding='utf-8') as f:
        sources = json.load(f)
    S = {s['id']: s for s in sources}

    print('%s  %d people  %d sources' % (d, len(people), len(sources)))
    cited = set()
    for p in people:
        cited.update(p.get('sources', []))
    # businesses.json and events.json cite sources too; a source used only
    # there is not an orphan.
    for extra in ('businesses.json', 'events.json'):
        fp = os.path.join(d, extra)
        if not os.path.exists(fp):
            continue
        with io.open(fp, encoding='utf-8') as f:
            blob = f.read()
        for s in sources:
            if '"%s"' % s['id'] in blob:
                cited.add(s['id'])

    print('\n1. confidence "record" with no record-strength source')
    n = 0
    for p in people:
        if p.get('confidence') != 'record':
            continue
        sids = p.get('sources', [])
        if sids and not any(S.get(i, {}).get('strength') == 'record' for i in sids):
            print('   %-34s cites %s' % (
                p['id'], [S.get(i, {}).get('strength') for i in sids]))
            n += 1
    print('   %d' % n)

    print('\n2. no sources at all')
    bare = [p for p in people if not p.get('sources')]
    for p in bare:
        print('   %-34s %s (%s)' % (p['id'], p['name'], p.get('confidence')))
    print('   %d' % len(bare))

    print('\n3. dated claim not backed by any cited source text')
    print('   (only where confidence is record or probable -- a tree- or')
    print('    family-confidence date is allowed to rest on the tree)')
    n = 0
    for p in people:
        if p.get('confidence') not in ('record', 'probable'):
            continue
        sids = p.get('sources', [])
        # title as well as proves: a marriage source often carries its date
        # only in the title, and reading proves alone reports it as unsourced.
        blob = ' '.join(((S.get(i, {}).get('proves') or '') + ' ' +
                         (S.get(i, {}).get('title') or '')) for i in sids)
        years_in_sources = set(YEAR.findall(blob))
        for ev in ('birth', 'death', 'marriage'):
            b = p.get(ev)
            if not isinstance(b, dict):
                continue
            m = YEAR.search(b.get('date') or '')
            if not m:
                continue
            if m.group(1) not in years_in_sources:
                print('   %-34s %-9s %-24s' % (p['id'], ev, b.get('date')))
                n += 1
    print('   %d' % n)

    print('\n4. sources nobody cites')
    orphan = [s['id'] for s in sources if s['id'] not in cited]
    for i in orphan:
        print('   %s' % i)
    print('   %d' % len(orphan))

    print('\n4b. sources without a direct record permalink')
    print('    (project rule: a direct record permalink, not a search URL)')
    bad = []
    for s in sources:
        u = (s.get('url') or '').strip()
        if not u:
            bad.append((s['id'], 'NO URL'))
        elif '/search/' in u or '?q.' in u or '&q.' in u:
            bad.append((s['id'], 'search URL'))
    for i, why in bad:
        print('   %-42s %s' % (i, why))
    print('   %d of %d' % (len(bad), len(sources)))

    print('\n5. dangling source references')
    n = 0
    for p in people:
        for i in p.get('sources', []):
            if i not in S:
                print('   %-34s -> %s' % (p['id'], i))
                n += 1
    print('   %d' % n)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
