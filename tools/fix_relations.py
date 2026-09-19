"""Recompute direct-ancestor relation labels from the parent chain.

Convention: parent, grandparent, great-grandparent, then 2nd great-, 3rd great-, ...
so generation 3 is "great-grandfather" and generation N>=4 is "(N-2)th great-grandfather".
Only direct-ancestor labels are touched. Collateral labels (aunt, uncle, cousin,
"by marriage") are reported but never rewritten.

Usage: python fix_relations.py <repo-data-dir> [--write]
"""
import json, io, sys, re

def ordinal(n):
    if 11 <= (n % 100) <= 13: return f"{n}th"
    return f"{n}{ {1:'st',2:'nd',3:'rd'}.get(n % 10, 'th') }"

def label(g, male):
    p = "father" if male else "mother"
    if g == 1: return p
    if g == 2: return "grand" + p
    if g == 3: return "great-grand" + p
    return f"{ordinal(g-2)} great-grand{p}"

def main(datadir, write):
    fp = datadir.rstrip('/\\') + "/people.json"
    ppl = json.load(open(fp, encoding='utf-8'))
    P = {p['id']: p for p in ppl}
    root = next((p['id'] for p in ppl if (p.get('relation') or '').strip().lower() in ('me','self')), None)
    if not root:
        print("no root found in", fp); return
    gen = {root: 0}
    frontier = [root]
    while frontier:
        pid = frontier.pop()
        for par in P.get(pid, {}).get('parents', []):
            if par in P and gen.get(par, 99) > gen[pid] + 1:
                gen[par] = gen[pid] + 1
                frontier.append(par)
    changed, ok, collateral = [], 0, []
    for pid, g in sorted(gen.items(), key=lambda kv: kv[1]):
        if g == 0: continue
        p = P[pid]; rec = (p.get('relation') or '').strip()
        if not re.search(r'(father|mother)$', rec):
            collateral.append((pid, rec, g)); continue
        exp = label(g, rec.endswith('father'))
        if rec == exp: ok += 1
        else:
            changed.append((pid, p['name'], rec, exp))
            p['relation'] = exp
    print(f"{fp}\n  root={root}  correct={ok}  to change={len(changed)}")
    for c in changed: print("   FIX", f"{c[1][:38]:38} {c[2]:24} -> {c[3]}")
    if collateral:
        print("  direct ancestors with a non-ancestor label (left alone):")
        for c in collateral: print("   ?", c[0], "|", c[1], "| gen", c[2])
    if write and changed:
        with io.open(fp, 'w', encoding='utf-8', newline='\n') as f:
            json.dump(ppl, f, ensure_ascii=False, indent=2); f.write('\n')
        print("  WRITTEN")
    elif changed:
        print("  (dry run, nothing written)")

if __name__ == "__main__":
    main(sys.argv[1], "--write" in sys.argv)
