"use client";

import { useMemo, useState } from "react";
import plants from "../../data/plants.json";

type Plant = (typeof plants)[number] & {
  image_url?: string;
};

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
  const [deckIndex, setDeckIndex] = useState(0);

  const [missed, setMissed] = useState<Plant[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);

  const selectedOrder = useMemo(() => {
    return (Object.entries(selected) as [Category, boolean][])
      .filter(([, v]) => v)
      .map(([k]) => k);
  }, [selected]);

  const totalCardsAllSelected = useMemo(() => {
    return selectedOrder.reduce((sum, cat) => {
      return sum + allPlants.filter((p) => matchesCategory(p, cat)).length;
    }, 0);
  }, [allPlants, selectedOrder]);

  const deckForCategory = useMemo(() => {
    if (selectedOrder.length === 0) return [];
    const cat = selectedOrder[categoryIndex];
    if (!cat) return [];
    const d = allPlants.filter((p) => matchesCategory(p, cat));
    return shuffleOn ? shuffleArray(d) : d;
  }, [allPlants, selectedOrder, categoryIndex, shuffleOn]);

  const activeCategory = selectedOrder[categoryIndex];
  const deck = deckForCategory;

  const inMissedRound = sessionStarted && categoryIndex === selectedOrder.length;
  const missedDeck = useMemo(
    () => (shuffleOn ? shuffleArray(missed) : missed),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [missed, shuffleOn]
  );

  const activeDeck = inMissedRound ? missedDeck : deck;
  const current = activeDeck[deckIndex];

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
    for (let i = categoryIndex + 1; i < selectedOrder.length; i++) {
      const cat = selectedOrder[i];
      const d = allPlants.filter((p) => matchesCategory(p, cat));
      if (d.length > 0) {
        setCategoryIndex(i);
        setDeckIndex(0);
        setIsFlipped(false);
        return;
      }
    }

    if (missed.length > 0) {
      setCategoryIndex(selectedOrder.length);
      setDeckIndex(0);
      setIsFlipped(false);
      return;
    }

    setSessionStarted(false);
    setSessionComplete(true);
    setIsFlipped(false);
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

    if (inMissedRound) {
      setSessionStarted(false);
      setSessionComplete(true);
      setIsFlipped(false);
      return;
    }

    nextCategoryOrFinish();
  }

  function markMissed() {
    if (!current) return;

    setMissed((prev) => {
      if (prev.some((p) => p.common_name === current.common_name)) return prev;
      return [...prev, current];
    });

    nextCard();
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
          maxWidth: 820,
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

        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
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
              maxWidth: 820,
            }}
          >
            {!current ? (
              <p style={{ margin: 0 }}>No card loaded.</p>
            ) : (
              <>
                {/* FRONT: IMAGE ONLY (or placeholder) */}
                {!isFlipped ? (
                  <>
                    {current.image_url ? (
                      <img
                        src={current.image_url}
                        alt={current.common_name}
                        style={{
                          width: "100%",
                          maxHeight: 360,
                          objectFit: "cover",
                          borderRadius: 10,
                          border: "1px solid #e5e5e5",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          border: "1px dashed #bbb",
                          borderRadius: 10,
                          padding: 24,
                          textAlign: "center",
                          opacity: 0.8,
                        }}
                      >
                        <p style={{ margin: 0 }}>
                          No image yet for this card.
                        </p>
                        <p style={{ margin: "8px 0 0 0", fontSize: 12 }}>
                          Flip to reveal the plant name and details.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  /* BACK: NAME + DETAILS */
                  <>
                    <h2 style={{ marginTop: 0 }}>{current.common_name}</h2>
                    <p style={{ fontStyle: "italic", marginTop: 4 }}>
                      {current.scientific_name}
                    </p>

                    <p>
                      <strong>Uses:</strong>{" "}
                      {current.uses && current.uses.length > 0
                        ? current.uses.join(", ")
                        : "—"}
                    </p>

                    <p>
                      <strong>Edible Parts:</strong>{" "}
                      {current.edibility?.edible_parts?.length
                        ? current.edibility.edible_parts.join(", ")
                        : "—"}
                    </p>

                    <p>
                      <strong>Medicinal Uses:</strong>{" "}
                      {current.medicinal?.uses?.length
                        ? current.medicinal.uses.join(", ")
                        : "—"}
                    </p>

                    <p>
                      <strong>Cautions:</strong>{" "}
                      {current.edibility?.cautions ? current.edibility.cautions : "—"}
                    </p>

                    <p>
                      <strong>Friction Fire:</strong>{" "}
                      {current.friction_fire
                        ? [
                            current.friction_fire.spindle && "Spindle",
                            current.friction_fire.hearth && "Hearth",
                          ]
                            .filter(Boolean)
                            .join(", ") || "—"
                        : "—"}
                    </p>
                  </>
                )}

                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <button onClick={() => setIsFlipped((f) => !f)} disabled={!current}>
                    {isFlipped ? "Show Image" : "Flip"}
                  </button>

                  <button onClick={markMissed} disabled={!current}>
                    Missed
                  </button>

                  <button onClick={nextCard}>Next</button>
                </div>

                {!inMissedRound && missed.length > 0 && (
                  <p style={{ marginTop: 12, opacity: 0.8 }}>
                    Missed cards will be reviewed after all selected categories finish.
                  </p>
                )}
              </>
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
