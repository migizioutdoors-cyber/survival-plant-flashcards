import plants from "../data/plants.json";

export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 32, marginBottom: 16 }}>
        Survival Plant Flashcards
      </h1>

      <p style={{ marginTop: 0, marginBottom: 16 }}>
    <a href="/flashcards">Go to Flashcards</a>
  </p>

      {plants.map((plant, index) => (
        <div
          key={index}
          style={{
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0 }}>{plant.common_name}</h2>
          <p style={{ fontStyle: "italic", marginTop: 4 }}>
            {plant.scientific_name}
          </p>

          <p>
            <strong>Uses:</strong> {plant.uses.join(", ")}
          </p>

          <p>
            <strong>Friction Fire:</strong>{" "}
            {plant.friction_fire.hearth ? "Hearth board" : ""}
            {plant.friction_fire.spindle ? " Spindle" : ""}
          </p>
        </div>
      ))}
    </main>
  );
}
