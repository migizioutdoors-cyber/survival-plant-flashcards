export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Survival Plant Flashcards</h1>
      <p style={{ fontSize: 16, marginTop: 0 }}>
        North American plants for survival, bushcraft, and friction fire.
      </p>

      <hr style={{ margin: "24px 0" }} />

      <h2 style={{ fontSize: 20, marginBottom: 8 }}>Next steps</h2>
      <ol style={{ lineHeight: 1.6 }}>
        <li>Import the plant dataset (from your spreadsheet)</li>
        <li>Build a searchable plant list</li>
        <li>Add flashcard study mode</li>
        <li>Add friction-fire pairing filters</li>
      </ol>
    </main>
  );
}
