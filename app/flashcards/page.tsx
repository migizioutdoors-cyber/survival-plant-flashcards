"use client";

import { useMemo, useState } from "react";
import plants from "../../data/plants.json";

type Plant = (typeof plants)[number];

type Category =
  | "friction_fire"
  | "tinder"
  | "cordage"
  | "wood"
  | "edibility"
  | "medicinal";

const CATEGORY_LABELS: Record<Category, string> = {
  friction_fire: "Friction Fire",
  tinder: "Tinder",
  cordage: "Cordage",
  wood: "Wood",
  edibility: "Edible Plants",
  medicinal: "Medicinal",
};

function matchesCategory(p: Plant, cat: Category) {
  switch (cat) {
    case "friction_fire":
      return Boolean(p.friction_fire?.spindle || p.friction_fire?.hearth);
    case "tinder":
      return Boolean(p.tinder?.usable);
    case "cordage":
      return Boolean(p.cordage?.usable);
    case "wood":
      return Boolean(p.wood?.usable);
    case "edibility":
      return (p.edibility?.edible_parts?.length ?? 0) > 0;
    case "medicinal":
      return (p.medicinal?.uses?.length ?? 0) > 0;
    default:
      return false;
  }
}

export default function FlashcardsPage() {
  const allPlants = useMemo(() => plants as Plant[], []);

  const [selected, setSelected] = useState<Record<Category, boolean>>({
    friction_fire: true,
    tinder: false,
    cordage: false,
    wood: false,
    edibility: false,
    medicinal: false,
  });

  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  const [categoryIndex, setCategoryIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const selectedOrder = useMemo(() => {
    return (Object.entries(selected) as [Category, boolean][])
      .filter(([, v]) => v)
      .map(([k]) => k);
  }, [selected]);

  // Build per-category decks so we can (a) compute total cards and (b) skip empty categories.
  const decksByCategory = useMemo(() => {
    const map: Partial<Record<Category, Plant[]>> = {};
    for (const cat of selectedOrder) {
      map[cat] = allPlants.filter((p) => matchesCategory(p, cat));
    }
    return map;
  }, [allPlants, selectedOrder]);

  const totalCards = useMemo(() => {
    return selectedOrder.reduce((sum, cat) => {
      return sum + (decksByCategory[cat]?.length ?? 0);
    }, 0);
  }, [selectedOrder, decksByCategory]);

  const activeCategory = selectedOrder[categoryIndex];
  const deck = (activeCategory ? decksByCategory[activeCategory] : []) ?? [];
  const current = deck[cardIndex];

  function resetSession() {
    setSessionStarted(false);
    setSessionComplete(false);
    setCategoryIndex(0);
    setCardIndex(0);
    setIsFlipped(false);
  }

  function toggleCategory(cat: Category) {
    setSelected((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  function startSession() {
    // Guard: don’t start if no cards at all
    if (selectedOrder.length === 0 || totalCards === 0) return;

    setSessionComplete(false);
    setSessionStarted(true);
    setCategoryIndex(0);
    setCardIndex(0);
    setIsFlipped(false);
  }

  // Skip forward to the next non-empty category deck; if none exist, end the session.
  function advanceToNextNonEmptyCategory(fromCategoryIndex: number) {
    for (let i = fromCategoryIndex; i < selectedOrder.length; i++) {
      const cat = selectedOrder[i];
      const d = decksByCategory[cat] ?? [];
      if (d.length > 0) {
        setCategoryIndex(i);
        setCardIndex(0);
        setIsFlipped(false);
        return;
      }
    }

    // No non-empty categories left
    setSessionStarted(false);
    setSessionComplete(true);
    setIsFlipped(false);
  }

  function nextCard() {
    setIsFlipped(false);

    // If active category has no deck (or became empty), skip it.
    if (!activeCategory || deck.length === 0) {
      advanceToNextNonEmptyCategory(categoryIndex + 1);
      return;
    }

    // Move within deck
    if (cardIndex + 1 < deck.length) {
      setCardIndex((i) => i + 1);
      return;
    }

    // End of this deck → advance to next category (skipping empties)
    advanceToNextNonEmptyCategory(categoryIndex + 1);
  }

  // If nothing selected at all, show selector
  if (selectedOrder.length === 0) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1>Flashcards</h1>

        <section
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 16,
            maxWidth: 720,
            marginBottom: 16,
          }}
        >
          <h2>Study Categories</h2>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
              <label key={cat} style={{ display: "flex", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={selected[cat]}
                  onChange={() => toggleCategory(cat)}
                />
                {CATEGORY_LABELS[cat]}
              </label>
            ))}
          </div>

          <p style={{ marginTop: 12, opacity: 0.8 }}>
            Select at least one category.
          </p>
        </section>
      </main>
    );
  }

  if (sessionComplete) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1>Session Complete</h1>

        <p>
          <strong>Categories Studied:</strong>{" "}
          {selectedOrder.map((c) => CATEGORY_LABELS[c]).join(", ")}
        </p>

        <p>
          <strong>Total Cards Reviewed:</strong> {totalCards}
        </p>

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button onClick={startSession}>Restart Session</button>
          <button onClick={resetSession}>Choose New Categories</button>
          <a href="/">Return Home</a>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Flashcards</h1>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
          maxWidth: 720,
          marginBottom: 16,
        }}
      >
        <h2>Study Categories</h2>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
            <label key={cat} style={{ display: "flex", gap: 8 }}>
              <input
                type="checkbox"
                checked={selected[cat]}
                onChange={() => toggleCategory(cat)}
                disabled={sessionStarted}
              />
              {CATEGORY_LABELS[cat]}
            </label>
          ))}
        </div>

        {!sessionStarted && (
          <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
            <button
              onClick={startSession}
              disabled={totalCards === 0}
              title={
                totalCards === 0
                  ? "No plants match the selected categories yet."
                  : ""
              }
            >
              Start Session
            </button>
            <p style={{ margin: 0, opacity: 0.8 }}>
              Total cards available: <strong>{totalCards}</strong>
            </p>
          </div>
        )}

        {sessionStarted && (
          <div style={{ marginTop: 12 }}>
            <button onClick={resetSession}>Reset / Change Categories</button>
          </div>
        )}
      </section>

      {sessionStarted ? (
        <>
          <p>
            <strong>Category:</strong>{" "}
            {activeCategory ? CATEGORY_LABELS[activeCategory] : "—"}
          </p>

          {deck.length > 0 ? (
            <p>
              Card {cardIndex + 1} of {deck.length} (Category{" "}
              {categoryIndex + 1} of {selectedOrder.length})
            </p>
          ) : (
            <p style={{ opacity: 0.8 }}>
              No cards in this category. Click Next to skip.
            </p>
          )}

          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: 12,
              padding: 20,
              maxWidth: 640,
            }}
          >
            {!current ? (
              <p style={{ margin: 0 }}>No card loaded.</p>
            ) : !isFlipped ? (
              <>
                <h2 style={{ marginTop: 0 }}>{current.common_name}</h2>
                <p style={{ fontStyle: "italic" }}>{current.scientific_name}</p>
              </>
            ) : (
              <>
                <p>
                  <strong>Uses:</strong> {current.uses.join(", ")}
                </p>
                <p>
                  <strong>Friction Fire:</strong>{" "}
                  {current.friction_fire?.spindle ? "Spindle " : ""}
                  {current.friction_fire?.hearth ? "Hearth Board" : ""}
                  {!current.friction_fire?.spindle &&
                  !current.friction_fire?.hearth
                    ? "N/A"
                    : ""}
                </p>
              </>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button
                onClick={() => setIsFlipped((f) => !f)}
                disabled={!current}
              >
                {isFlipped ? "Show Front" : "Flip"}
              </button>
              <button onClick={nextCard}>Next</button>
            </div>
          </div>
        </>
      ) : (
        <p style={{ opacity: 0.8 }}>
          Select categories, then click <strong>Start Session</strong>.
        </p>
      )}
    </main>
  );
}
