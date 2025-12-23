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

export default function FlashcardsPage() {
  const allPlants = useMemo(() => plants as Plant[], []);

  // Category selection (UI only for now)
  const [selected, setSelected] = useState<Record<Category, boolean>>({
    friction_fire: true,
    tinder: false,
    cordage: false,
    wood: false,
    edibility: false,
    medicinal: false,
  });

  // Flashcard state
  const [sessionStarted, setSessionStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const deck = allPlants;
  const current = deck[index];

  function toggleCategory(cat: Category) {
    setSelected((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  function startSession() {
    setSessionStarted(true);
    setIndex(0);
    setIsFlipped(false);
  }

  function nextCard() {
    setIsFlipped(false);
    setIndex((prev) => (prev + 1) % deck.length);
  }

  if (!current) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1>Flashcards</h1>
        <p>No plants found in the deck.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Flashcards</h1>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
          maxWidth: 720,
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 12 }}>
          Study Categories
        </h2>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
            <label
              key={cat}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                border: "1px solid #eee",
                padding: "8px 10px",
                borderRadius: 10,
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={selected[cat]}
                onChange={() => toggleCategory(cat)}
              />
              {CATEGORY_LABELS[cat]}
            </label>
          ))}
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
          <button
            onClick={startSession}
            style={{ padding: "10px 14px", cursor: "pointer" }}
          >
            Start Session
          </button>

          <p style={{ margin: 0, opacity: 0.8, alignSelf: "center" }}>
            (Filtering comes next—this step adds the selector UI.)
          </p>
        </div>
      </section>

      {sessionStarted ? (
        <>
          <p style={{ marginTop: 0, marginBottom: 16 }}>
            Card {index + 1} of {deck.length}
          </p>

          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: 12,
              padding: 20,
              maxWidth: 640,
            }}
          >
            {!isFlipped ? (
              <>
                <h2 style={{ margin: 0 }}>{current.common_name}</h2>
                <p style={{ fontStyle: "italic", marginTop: 6 }}>
                  {current.scientific_name}
                </p>
                <p style={{ marginTop: 12, opacity: 0.9 }}>
                  Tap Flip to reveal details.
                </p>
              </>
            ) : (
              <>
                <h2 style={{ margin: 0 }}>{current.common_name}</h2>
                <p style={{ marginTop: 12 }}>
                  <strong>Uses:</strong> {current.uses.join(", ")}
                </p>
                <p style={{ marginTop: 8 }}>
                  <strong>Friction Fire:</strong>{" "}
                  {current.friction_fire.spindle ? "Spindle " : ""}
                  {current.friction_fire.hearth ? "Hearth board" : ""}
                  {!current.friction_fire.spindle && !current.friction_fire.hearth
                    ? "N/A"
                    : ""}
                </p>
                {current.friction_fire.notes ? (
                  <p style={{ marginTop: 8 }}>
                    <strong>Notes:</strong> {current.friction_fire.notes}
                  </p>
                ) : null}
              </>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button
                onClick={() => setIsFlipped((v) => !v)}
                style={{ padding: "10px 14px", cursor: "pointer" }}
              >
                {isFlipped ? "Show Front" : "Flip"}
              </button>

              <button
                onClick={nextCard}
                style={{ padding: "10px 14px", cursor: "pointer" }}
              >
                Next
              </button>
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
