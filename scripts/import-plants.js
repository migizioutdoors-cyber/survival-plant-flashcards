const fs = require("fs");
const path = require("path");

const INPUT = path.join(__dirname, "../data/import/plants_import.csv");
const OUTPUT = path.join(__dirname, "../data/plants.json");

function clean(v) {
  return String(v ?? "").trim().replace(/^"+|"+$/g, "");
}

function toBool(v) {
  const s = clean(v).toLowerCase();
  return ["yes", "y", "true", "1", "x"].includes(s);
}

/**
 * Simple CSV parser that respects quoted values
 */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(cell);
        cell = "";
      } else if (ch === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else if (ch === "\r") {
        // ignore
      } else {
        cell += ch;
      }
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

const csvText = fs.readFileSync(INPUT, "utf8");
const table = parseCSV(csvText);

// 👇 THIS IS THE KEY FIX
const HEADER_ROW_INDEX = 3; // line 4 (0-based)
const headers = table[HEADER_ROW_INDEX].map(h =>
  clean(h).toLowerCase().replace(/[^a-z0-9]+/g, "_")
);

const dataRows = table.slice(HEADER_ROW_INDEX + 1);

const plants = dataRows
  .filter(r => r.some(c => clean(c)))
  .map(r => {
    const row = {};
    headers.forEach((h, i) => (row[h] = r[i] ?? ""));

    return {
      common_name: clean(row.common_name),
      scientific_name: clean(row.scientific_name_taxon),

      uses: [],

      friction_fire: {
        spindle: toBool(row.friction_fire_wood),
        hearth: toBool(row.friction_fire_wood),
        notes: clean(row.friction_fire_notes),
      },

      tinder: {
        usable: false,
        notes: "",
      },

      cordage: {
        usable: toBool(row.cordage_fiber),
        material: "",
      },

      wood: {
        usable: toBool(row.friction_fire_wood),
        notes: "",
      },

      edibility: {
        edible_parts: toBool(row.edible) ? ["see notes"] : [],
        preparation: "",
        cautions: clean(row.key_cautions_lookalikes),
      },

      medicinal: {
        uses: toBool(row.medicinal) ? ["see notes"] : [],
        preparation: "",
        cautions: "",
      },
    };
  })
  .filter(p => p.common_name);

fs.writeFileSync(OUTPUT, JSON.stringify(plants, null, 2));
console.log(`Imported ${plants.length} plants → data/plants.json`);
