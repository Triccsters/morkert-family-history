#!/usr/bin/env python3
"""
Generate the Evernote view of this repo's genealogy data.

The repo is the record. Evernote holds a generated view of it, plus the notes
the JSON has no shape for (deep dives, photographs, stories, the queue).
This script emits that generated view as ENML so it is reproducible, rather
than being retyped by hand every time the data changes.

Usage
    python3 tools/evernote_view.py index   > /tmp/index.enml
    python3 tools/evernote_view.py places  > /tmp/places.json

`places` emits JSON: [{id, title, tagIds, enml}], ready to feed to
create_note + edit_note through the Evernote connector.

Reads tools/evernote_map.json for the account-specific GUIDs.
Nothing in this file talks to the network.
"""

import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
DATA = os.path.join(REPO, "data")

CONF = {
    "record": "#27ae60",
    "probable": "#8e44ad",
    "tree": "#d68910",
    "family": "#2980b9",
}


def load(name):
    path = os.path.join(DATA, name + ".json")
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def cfg():
    with open(os.path.join(HERE, "evernote_map.json"), encoding="utf-8") as fh:
        return json.load(fh)


def esc(text):
    """Escape text content only. Tags are emitted raw. See the skill."""
    return (
        str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    )


# --------------------------------------------------------------------------
# shared helpers, mirroring lib/data.js so the two views cannot disagree
# --------------------------------------------------------------------------

def matches(place, text):
    low = str(text).lower()
    return any(m.lower() in low for m in place.get("matchers", []))


def year_of(s):
    m = re.search(r"\d{4}", str(s or ""))
    return int(m.group(0)) if m else None


def display_years(p):
    """Mirrors displayYears(): keeps about/before/after so an estimate never
    reads as a fact. Living people keep their birth year here because this
    view is private; the public site suppresses it."""
    def one(s):
        if not s:
            return ""
        y = year_of(s)
        if not y:
            return ""
        s = str(s)
        if re.search(r"about|abt|circa", s, re.I):
            return f"abt {y}"
        if re.search(r"before|bef", s, re.I):
            return f"bef {y}"
        if re.search(r"after|aft", s, re.I):
            return f"aft {y}"
        return str(y)

    b = one((p.get("birth") or {}).get("date"))
    d = one((p.get("death") or {}).get("date"))
    if b and d:
        return f"{b} to {d}"
    if b:
        return f"b. {b}"
    if d:
        return f"d. {d}"
    return "living" if p.get("living") else "dates unknown"


def earliest(p):
    return year_of((p.get("birth") or {}).get("date")) or year_of(
        (p.get("death") or {}).get("date")
    ) or 9999


def badge(level):
    colour = CONF.get(level, "#888888")
    return f'<span style="color:{colour};">{esc(level or "unknown")}</span>'


def callout(emoji, colour, body_html):
    return (
        f'<div style="--en-callout:true; --en-emoji:{emoji}; --en-color:{colour};'
        '--en-requiredFeatures:&quot;[\\&quot;callout\\&quot;]&quot;;">'
        f"<div>{body_html}</div></div>"
    )


def note_link(cf, note_guid, notebook_guid, label):
    return (
        f'<a href="evernote:///view/{cf["accountId"]}/{cf["shard"]}/'
        f'{note_guid}/{notebook_guid}">{esc(label)}</a>'
    )


def muted(text):
    return f'<div style="color:rgb(136, 136, 136);">{esc(text)}</div>'


# --------------------------------------------------------------------------
# the index note: everyone, grouped by surname, oldest first
# --------------------------------------------------------------------------

def surname_of(p):
    """Use the curated `line` field, never a surname parsed out of the name.

    Parsing the name gets three things wrong that `line` gets right: it reads
    suffixes as surnames ("Robert Ricci Sr." -> "Sr."), it splits spelling and
    case variants of one family into separate groups (Lacasse/LaCasse,
    Donatelle/Donatelli, Manella/Mannella), and it cannot tell that a spouse
    married into a line. All three were live bugs.
    """
    return p.get("line") or "Unknown"


def build_index(cf):
    people = load("people")
    groups = {}
    for p in people:
        groups.setdefault(surname_of(p), []).append(p)

    # Oldest line first. Sorting by group size instead would reorder the note
    # every time a person is added, making a regeneration look like a change.
    order = sorted(groups, key=lambda s: (min(earliest(p) for p in groups[s]), s))
    out = [
        callout(
            "🌳",
            "green",
            f"Every person on the {esc(cf['sideName'])} side, {len(people)} of them, "
            "grouped by surname and oldest first. Each name opens that person on "
            "the site, where the notes and every source live. This list is "
            "generated from the site data, so the site is the live copy.",
        )
    ]
    for surname in order:
        members = sorted(groups[surname], key=earliest)
        out.append(
            f"<h3>{esc(surname)} "
            f'<span style="color:rgb(136, 136, 136);">({len(members)})</span></h3><ul>'
        )
        for p in members:
            url = f"{cf['siteUrl']}/people/{p['id']}/"
            rel = p.get("relation", "")
            out.append(
                f'<li><a href="{url}">{esc(p["name"])}</a> · '
                f'{esc(display_years(p))}'
                + (f" · {esc(rel)}" if rel else "")
                + f' · {badge(p.get("confidence"))}</li>'
            )
        out.append("</ul>")
    return "".join(out)


# --------------------------------------------------------------------------
# place notes
# --------------------------------------------------------------------------

def people_at(place, people):
    def grp(key):
        return [
            p for p in people
            if (p.get(key) or {}).get("place")
            and matches(place, (p.get(key) or {})["place"])
        ]
    return grp("birth"), grp("marriage"), grp("death")


def person_line(cf, p):
    url = f"{cf['siteUrl']}/people/{p['id']}/"
    return (
        f'<li><a href="{url}">{esc(p["name"])}</a> '
        f'<span style="color:rgb(136, 136, 136);">{esc(display_years(p))}</span></li>'
    )


def build_places(cf):
    places = load("places")
    people = load("people")
    events = load("events")
    sources = {s["id"]: s for s in load("sources")}
    extra = cf.get("placeExtras", {})

    notes = []
    for pl in places:
        born, married, died = people_at(pl, people)
        evs = [e for e in events if e.get("placeId") == pl["id"]]
        body = []

        body.append(callout("📍", "blue", esc(pl.get("summary", ""))))
        body.append(muted(f'{pl.get("region", "")} · {pl.get("span", "")}'))

        for para in pl.get("paragraphs", []):
            body.append(f"<p>{esc(para)}</p>")

        if evs:
            body.append("<h3>What happened here</h3><ul>")
            for e in sorted(evs, key=lambda x: x.get("sortYear") or 0):
                url = f"{cf['siteUrl']}/events/{e['id']}/"
                body.append(
                    f'<li><a href="{url}">{esc(e["title"])}</a> '
                    f'<span style="color:rgb(136, 136, 136);">{esc(e.get("date",""))}'
                    "</span></li>"
                )
            body.append("</ul>")

        for label, group in (("Born here", born), ("Married here", married),
                            ("Died here", died)):
            if group:
                body.append(f"<h3>{label} <span style=\"color:rgb(136, 136, 136);\">"
                            f"({len(group)})</span></h3><ul>")
                for p in sorted(group, key=earliest):
                    body.append(person_line(cf, p))
                body.append("</ul>")

        if not (born or married or died):
            body.append(muted("Nobody on the site has a birth, marriage or death "
                              "recorded in this place yet."))

        src_ids = pl.get("sources", [])
        if src_ids:
            body.append("<h3>Evidence</h3><ul>")
            for sid in src_ids:
                s = sources.get(sid)
                if not s:
                    body.append(f"<li>{esc(sid)} (missing from sources.json)</li>")
                    continue
                body.append(
                    f'<li><a href="{esc(s["url"])}">{esc(s["title"])}</a> '
                    f'<span style="color:rgb(136, 136, 136);">{esc(s.get("repository",""))}'
                    f'</span><br/>{esc(s.get("proves",""))}</li>'
                )
            body.append("</ul>")

        # Anything hand-attached to this place: photographs, linked notes.
        for link in extra.get(pl["id"], []):
            body.append(
                "<p><b>See also:</b> "
                + note_link(cf, link["noteId"], link["notebookId"], link["label"])
                + "</p>"
            )

        body.append(
            f'<p><a href="{cf["siteUrl"]}/places/{pl["id"]}/">'
            f'This place on the site</a></p>'
        )
        body.append(muted("Generated from data/places.json by "
                          "tools/evernote_view.py. Edit the JSON, not this note."))

        tag_ids = [cf["genealogyTagId"], cf["sideTagId"]]
        pt = cf.get("placeTags", {}).get(pl["id"])
        if pt:
            tag_ids.append(pt)

        notes.append({
            "id": pl["id"],
            "title": f'Place: {pl["name"]}',
            "tagIds": tag_ids,
            "enml": "".join(body),
        })
    return notes


# --------------------------------------------------------------------------
# the master note: the notebook's front door
# --------------------------------------------------------------------------

MERMAID_CLASSES = [
    "classDef rec fill:#1e8449,color:#ffffff,stroke:#145a32",
    "classDef prob fill:#8e44ad,color:#ffffff,stroke:#5b2c6f",
    "classDef tree fill:#d68910,color:#ffffff,stroke:#935116",
    "classDef fam fill:#2471a3,color:#ffffff,stroke:#154360",
]
CLASS_OF = {"record": "rec", "probable": "prob", "tree": "tree", "family": "fam"}


def mermaid_lines(cf, spines):
    """One node per person on each direct line, coloured by confidence and
    clickable through to that person's page on the site.

    The click URL must be a plain https one. A mermaid `click` pointing at an
    evernote:/// link has its href silently stripped, so the node looks live
    and goes nowhere.
    """
    people = {p["id"]: p for p in load("people")}
    lines = ["graph TD"]
    nid = {}
    n = 0
    for spine in spines:
        for pid in spine:
            if pid not in nid:
                n += 1
                nid[pid] = f"N{n}"
    # Two spines that converge share their last edges, so dedupe or mermaid
    # draws the shared link once per spine.
    seen = set()
    for spine in spines:
        for a, b in zip(spine, spine[1:]):
            if (a, b) in seen:
                continue
            seen.add((a, b))
            lines.append(f"  {nid[a]} --> {nid[b]}")
    for pid, node in nid.items():
        p = people.get(pid)
        if not p:
            continue
        label = p["name"].replace('"', "")
        years = display_years(p)
        lines.append(f'  {node}["{label}<br/>{years}"]')
    buckets = {}
    for pid, node in nid.items():
        p = people.get(pid)
        if p:
            buckets.setdefault(CLASS_OF.get(p.get("confidence"), "fam"), []).append(node)
    lines.extend(MERMAID_CLASSES)
    for cls, nodes in buckets.items():
        lines.append(f"  class {','.join(nodes)} {cls}")
    for pid, node in nid.items():
        lines.append(f'  click {node} "{cf["siteUrl"]}/people/{pid}/"')
    return lines


def mermaid_block(lines):
    body = "".join(f"<div>{esc(l)}</div>" for l in lines)
    return (
        '<div style="--en-mermaidblock:true; --en-displayMode:split;'
        '--en-requiredFeatures:&quot;[\\&quot;mermaidblock\\&quot;]&quot;;">'
        f"{body}</div>"
    )


def main():
    # Windows defaults stdout to cp1252, which cannot encode the callout
    # emoji, so the script dies with UnicodeEncodeError on the machine it is
    # actually run from. The container is UTF-8 and hides this.
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

    what = sys.argv[1] if len(sys.argv) > 1 else "index"
    cf = cfg()
    if what == "index":
        sys.stdout.write(build_index(cf))
    elif what == "places":
        json.dump(build_places(cf), sys.stdout, ensure_ascii=False)
    elif what == "mermaid":
        spines = [s for s in cf["spines"]]
        sys.stdout.write("\n".join(mermaid_lines(cf, spines)) + "\n")
    elif what == "mermaid-enml":
        spines = [s for s in cf["spines"]]
        sys.stdout.write(mermaid_block(mermaid_lines(cf, spines)))
    else:
        sys.exit(f"unknown target: {what}")


if __name__ == "__main__":
    main()
