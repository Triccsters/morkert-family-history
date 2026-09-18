"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { pickablePeople, relationship, ancestorLine } from "../lib/relationship";
import { displayYears } from "../lib/data";

const KEY = "family-history-viewer";
const ViewerContext = createContext({ viewerId: null, setViewerId: () => {} });

export function ViewerProvider({ children }) {
  const [viewerId, setViewer] = useState(null);
  const [ready, setReady] = useState(false);

  // Remembered per browser. Wrapped because private windows can throw.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved) setViewer(saved);
    } catch (e) {}
    setReady(true);
  }, []);

  const setViewerId = (id) => {
    setViewer(id || null);
    try {
      if (id) window.localStorage.setItem(KEY, id);
      else window.localStorage.removeItem(KEY);
    } catch (e) {}
  };

  return (
    <ViewerContext.Provider value={{ viewerId, setViewerId, ready }}>
      {children}
    </ViewerContext.Provider>
  );
}

export function useViewer() {
  return useContext(ViewerContext);
}

// The picker itself. Sits at the top of the site.
export function ViewerPicker() {
  const { viewerId, setViewerId, ready } = useViewer();
  const options = pickablePeople();
  const me = options.find((p) => p.id === viewerId);

  if (!ready) return null;

  return (
    <div className="viewer-bar">
      <label htmlFor="viewer-select">
        {me ? "Viewing as" : "Who's visiting?"}
      </label>
      <select
        id="viewer-select"
        value={viewerId || ""}
        onChange={(e) => setViewerId(e.target.value)}
      >
        <option value="">Pick your name</option>
        {options.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
            {displayYears(p) ? ` (${displayYears(p)})` : ""}
          </option>
        ))}
      </select>
      {me && (
        <button type="button" onClick={() => setViewerId("")}>
          Clear
        </button>
      )}
    </div>
  );
}

// "Angelo Ricci is your 2nd great-grandfather."
export function RelationTo({ personId, prefix = "" }) {
  const { viewerId, ready } = useViewer();
  if (!ready || !viewerId || viewerId === personId) return null;
  const label = relationship(viewerId, personId);
  if (!label) return null;
  return (
    <div className="relation-note">
      {prefix}
      {label === "no traced relationship yet"
        ? "No traced relationship to you yet."
        : `This is ${label}.`}
    </div>
  );
}

// On the home page: your own line back through the generations.
export function YourLine() {
  const { viewerId, ready } = useViewer();
  if (!ready || !viewerId) return null;
  const line = ancestorLine(viewerId);
  if (line.length < 2) return null;
  const oldest = line[line.length - 1];

  return (
    <>
      <h2>Your line</h2>
      <p className="muted small">
        Your own ancestry as far as it has been traced, {line.length} generations
        back to {oldest.name}.
      </p>
      <ul className="line-list">
        {line.map((p, i) => (
          <li key={p.id}>
            <Link href={`/people/${p.id}`}>{p.name}</Link>{" "}
            <span className="muted small">{displayYears(p)}</span>
            {i > 0 && (
              <div className="muted small">{relationship(viewerId, p.id)}</div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
