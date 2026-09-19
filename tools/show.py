"""Print a person's record and the full text of every source they cite.

    python tools/show.py <person-id> [<person-id> ...]
    python tools/show.py --source <source-id> [...]
    python tools/show.py --find <substring>     search names and source text

Read-only. Use it before claiming something is missing.
"""
import json, io, os, sys

sys.stdout.reconfigure(encoding='utf-8')
DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')


def load(n):
    with io.open(os.path.join(DATA, n), encoding='utf-8') as f:
        return json.load(f)


def main(argv):
    people = load('people.json')
    sources = load('sources.json')
    P = {x['id']: x for x in people}
    S = {x['id']: x for x in sources}

    if not argv:
        print(__doc__)
        return 0

    if argv[0] == '--find':
        needle = ' '.join(argv[1:]).lower()
        for x in people:
            if needle in json.dumps(x, ensure_ascii=False).lower():
                print('PERSON  %-32s %s' % (x['id'], x['name']))
        for x in sources:
            if needle in json.dumps(x, ensure_ascii=False).lower():
                print('SOURCE  %-32s %s' % (x['id'], x.get('title', '')))
        return 0

    if argv[0] == '--source':
        for sid in argv[1:]:
            print(json.dumps(S.get(sid, {'MISSING': sid}),
                             ensure_ascii=False, indent=2))
        return 0

    for pid in argv:
        p = P.get(pid)
        if not p:
            print('NO SUCH PERSON: %s' % pid)
            continue
        print('=' * 70)
        print(json.dumps(p, ensure_ascii=False, indent=2))
        for sid in p.get('sources', []):
            s = S.get(sid)
            if not s:
                print('  !! cites missing source %s' % sid)
                continue
            print('  -- %s [%s] %s' % (sid, s.get('strength'), s.get('url')))
            print('     %s' % s.get('proves', ''))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
