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

function shuffleArray<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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

  const [shuffleOn, setShuffleOn] = useState(true);

  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  const [categoryIndex, setCategoryIndex] = useState(0);

  // Deck is a list of plants; we move through it by index.
  const [deckIndex, setDeckIndex] = useState(0);

  // Missed pile (plants the user marked as missed).
  const [missed, setMissed] = useState<Plant[]>([]);

  const [isFlipped, setIsFlipped] = useState(false);

  const selectedOrder = useMemo(() => {
    return (Object.entries(selected) as [Category, boolean][])
      .filter(([, v]) => v)
      .map(([k]) => k);
  }, [selected]);

  const deckForCategory = useMemo(() => {
    if (selectedOrder.length === 0) return [];
    const cat = selectedOrder[categoryIndex];
    if (!cat) return [];
    const d = allPlants.filter((p) => matchesCategory(p, cat));
    return shuffleOn ? shuffleArray(d) : d;
  }, [allPlants, selectedOrder, categoryIndex, shuffleOn]);

  const totalCardsAllSelected = useMemo(() => {
    return selectedOrder.reduce((sum, cat) => {
      return sum + allPlants.filter((p) => matchesCategory(p, cat)).length;
    }, 0);
  }, [allPlants, selectedOrder]);

  const activeCategory = selectedOrder[categoryIndex];
  const deck = deckForCategory;
  const current = deck[deckIndex];

  function resetSession() {
    setSessionStarted(false);
    setSessionComplete(false);
    setCategoryIndex(0);
    setDeckIndex(0);
    setMissed([]);
    setIsFlipped(false);
  }

  function toggleCategory(cat: Category) {
    setSelected((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  function startSession() {
    if (selectedOrder.length === 0 || totalCardsAllSelected === 0) return;

    setSessionStarted(true);
    setSessionComplete(false);
    setCategoryIndex(0);
    setDeckIndex(0);
    setMissed([]);
    setIsFlipped(false);
  }

  function nextCategoryOrFinish() {
    const nextCat = categoryIndex + 1;

    // Move to next category if there is one (skip empties by looping)
    for (let i = nextCat; i < selectedOrder.length; i++) {
      const cat = selectedOrder[i];
      const d = allPlants.filter((p) => matchesCategory(p, cat));
      if (d.length > 0) {
        setCategoryIndex(i);
        setDeckIndex(0);
        setIsFlipped(false);
        return;
      }
    }

    // No categories left — if missed exists, run missed round; otherwise complete.
    if (missed.length > 0) {
      // Start missed round as a "virtual category"
      setCategoryIndex(selectedOrder.length); // sentinel index
      setDeckIndex(0);
      setIsFlipped(false);
      return;
    }

    setSessionStarted(false);
    setSessionComplete(true);
    setIsFlipped(false);
  }

  const inMissedRound = sessionStarted && categoryIndex === selectedOrder.length;
  const missedDeck = shuffleOn ? shuffleArray(missed) : missed;
  const activeDeck = inMissedRound ? missedDeck : deck;
  const activeCurrent = activeDeck[deckIndex];

  function markMissed() {
    if (!activeCurrent) return;

    setMissed((prev) => {
      // Avoid duplicates
      if (prev.some((p) => p.common_name === activeCurrent.common_name)) return prev;
      return [...prev, activeCurrent];
    });

    nextCard();
  }

  function nextCard() {
    setIsFlipped(false);

    if (!activeDeck || activeDeck.length === 0) {
      nextCategoryOrFinish();
      return;
    }

    if (deckIndex + 1 < activeDeck.length) {
      setDeckIndex((i) => i + 1);
      return;
    }

    // End of this deck
    if (inMissedRound) {
      // Finished missed round — complete session
      setSessionStarted(false);
      setSessionComplete(true);
      setIsFlipped(false);
      return;
    }

    nextCategoryOrFinish();
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
          <strong>Total Cards Available:</strong> {totalCardsAllSelected}
        </p>

        <p>
          <strong>Missed Cards:</strong> {missed.length}
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
          maxWidth: 760,
          marginBottom: 16,
        }}
      >
        <h2>Study Settings</h2>

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

        <div style={{ display: "flex", gap: 16, marginTop: 12, alignItems: "center" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={shuffleOn}
              onChange={() => setShuffleOn((v) => !v)}
              disabled={sessionStarted}
            />
            Shuffle cards
          </label>

          {!sessionStarted ? (
            <>
              <button onClick={startSession} disabled={totalCardsAllSelected === 0}>
                Start Session
              </button>
              <span style={{ opacity: 0.8 }}>
                Total cards available: <strong>{totalCardsAllSelected}</strong>
              </span>
            </>
          ) : (
            <>
              <button onClick={resetSession}>Reset / Change Categories</button>
              <span style={{ opacity: 0.8 }}>
                Missed so far: <strong>{missed.length}</strong>
              </span>
            </>
          )}
        </div>
      </section>

      {sessionStarted ? (
        <>
          <p>
            <strong>Mode:</strong>{" "}
            {inMissedRound ? "Missed Review" : CATEGORY_LABELS[activeCategory]}
          </p>

          <p style={{ opacity: 0.8 }}>
            Card {deckIndex + 1} of {activeDeck.length}
          </p>

          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: 12,
              padding: 20,
              maxWidth: 640,
            }}
          >
            {!activeCurrent ? (
              <p style={{ margin: 0 }}>No card loaded.</p>
            ) : !isFlipped ? (
              <>
                <h2 style={{ marginTop: 0 }}>{activeCurrent.common_name}</h2>
                <p style={{ fontStyle: "italic" }}>{activeCurrent.scientific_name}</p>
              </>
            ) : (
              <>
                <p>
                  <strong>Uses:</strong>{" "}
                  {activeCurrent.uses && activeCurrent.uses.length > 0
                    ? activeCurrent.uses.join(", ")
                    : "—"}
                </p>

                <p>
                  <strong>Edible Parts:</strong>{" "}
                  {activeCurrent.edibility?.edible_parts?.length
                    ? activeCurrent.edibility.edible_parts.join(", ")
                    : "—"}
                </p>

                <p>
                  <strong>Medicinal Uses:</strong>{" "}
                  {activeCurrent.medicinal?.uses?.length
                    ? activeCurrent.medicinal.uses.join(", ")
                    : "—"}
                </p>

                <p>
                  <strong>Cautions:</strong>{" "}
                  {activeCurrent.edibility?.cautions
                    ? activeCurrent.edibility.cautions
                    : "—"}
                </p>
              </>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button onClick={() => setIsFlipped((f) => !f)} disabled={!activeCurrent}>
                {isFlipped ? "Show Front" : "Flip"}
              </button>

              <button onClick={markMissed} disabled={!activeCurrent}>
                Missed
              </button>

              <button onClick={nextCard}>Next</button>
            </div>

            {!inMissedRound && missed.length > 0 && (
              <p style={{ marginTop: 12, opacity: 0.8 }}>
                Missed cards will be reviewed after all selected categories finish.
              </p>
            )}
          </div>
        </>
      ) : (
        <p style={{ opacity: 0.8 }}>
          Select categories and settings, then click <strong>Start Session</strong>.
        </p>
      )}
    </main>
  );
}
