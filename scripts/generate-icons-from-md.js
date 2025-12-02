// scripts/generate-icons-from-md.js
// Použití: node scripts/generate-icons-from-md.js
//
// Předpoklady:
// - soubor "ikons (1).md" je ve složce ./docs (nebo uprav cestu níže)
// - vytvoří soubor ./app/icons.ts s kompletní mapou ikon

const fs = require("fs");
const path = require("path");

/**
 * Cesty si můžeš upravit podle projektu
 * - sourceMdPath: kde máš ten tvůj "ikons.md"
 * - targetTsPath: kam se má vygenerovat icons.ts
 */
const sourceMdPath = path.join(__dirname, "..", "ikons.md"); // nebo "../docs/ikons.md"
const targetTsPath = path.join(__dirname, "..", "app", "icons.ts");

/**
 * Pomocná funkce – rozseká řádek tabulky na jednotlivé sloupce
 */
function parseTableRow(line) {
  // příklad řádku:
  // | 🟦 | `tile` | Dlaždice | Tile | kachel, karta | card, panel |
  const parts = line.split("|").slice(1, -1).map((p) => p.trim());
  return parts;
}

/**
 * Hlavní logika: přečíst MD, projít sekce a tabulky a složit icons objekt
 */
function generateIcons() {
  const md = fs.readFileSync(sourceMdPath, "utf8");
  const lines = md.split(/\r?\n/);

  /** @type {Record<string, {
   *  emoji?: string;
   *  nameCZ?: string;
   *  nameEN?: string;
   *  category?: string;
   *  aliasesCZ?: string[];
   *  aliasesEN?: string[];
   * }>} */
  const icons = {};

  let currentCategory = "";
  let mode = null; // "buttons" | "used" | "all"

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Nadpisy sekcí typu "### BUILDINGS / PROPERTY"
    if (line.startsWith("### ")) {
      currentCategory = line.replace(/^###\s+/, "").trim();
      mode = null;
      continue;
    }

    // Buttons tabulka
    if (line.startsWith("| Klíč | Ikona | Název CZ | Název EN | Popis |")) {
      mode = "buttons";
      i += 1; // přeskočit separator řádek "|------|..."
      continue;
    }

    // Použité ikony tabulka
    if (line.startsWith("| Klíč | Ikona | Název CZ | Název EN | Kategorie |")) {
      mode = "used";
      i += 1;
      continue;
    }

    // "Všechny dostupné ikony" tabulky
    if (line.startsWith("| Ikona | Klíč | Název CZ | Název EN | Aliasy CZ | Aliasy EN |")) {
      mode = "all";
      i += 1;
      continue;
    }

    // Končí tabulka – prázdný řádek nebo něco jiného než "|"
    if (!line.startsWith("|")) {
      mode = mode; // nic, jen pokračujeme
      continue;
    }

    // Parsování konkrétního řádku tabulky podle módu
    if (mode === "buttons") {
      const cols = parseTableRow(line);
      if (cols.length < 5) continue;
      const [key, emoji, nameCZ, nameEN] = cols;

      const cleanKey = key.replace(/`/g, "");
      const iconKey = cleanKey;

      if (!icons[iconKey]) icons[iconKey] = {};
      const icon = icons[iconKey];

      icon.emoji = emoji;
      icon.nameCZ = nameCZ;
      icon.nameEN = nameEN;
      // pro tlačítka dáme speciální kategorii
      if (!icon.category) icon.category = "BUTTONS";
    }

    if (mode === "used") {
      const cols = parseTableRow(line);
      if (cols.length < 5) continue;
      const [key, emoji, nameCZ, nameEN, cat] = cols;

      const cleanKey = key.replace(/`/g, "");
      const iconKey = cleanKey;

      if (!icons[iconKey]) icons[iconKey] = {};
      const icon = icons[iconKey];

      icon.emoji = emoji;
      icon.nameCZ = nameCZ;
      icon.nameEN = nameEN;
      // tady použijeme kategorii přímo z tabulky "Kategorie"
      icon.category = cat;
    }

    if (mode === "all") {
      const cols = parseTableRow(line);
      if (cols.length < 6) continue;
      const [emoji, key, nameCZ, nameEN, aliasesCZRaw, aliasesENRaw] = cols;

      const cleanKey = key.replace(/`/g, "");
      const iconKey = cleanKey;

      if (!icons[iconKey]) icons[iconKey] = {};
      const icon = icons[iconKey];

      // Pokud už něco máme (např. z "Použité ikony"), nepřepisujeme bezdůvodně
      if (!icon.emoji) icon.emoji = emoji;
      if (!icon.nameCZ) icon.nameCZ = nameCZ;
      if (!icon.nameEN) icon.nameEN = nameEN;
      // Kategorie z nadpisu sekce (ACCESSIBILITY / UI TYPES, BUILDINGS / PROPERTY, ...)
      if (!icon.category && currentCategory) {
        icon.category = currentCategory;
      }

      const aliasesCZ = (aliasesCZRaw || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const aliasesEN = (aliasesENRaw || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (aliasesCZ.length) {
        icon.aliasesCZ = Array.from(
          new Set([...(icon.aliasesCZ || []), ...aliasesCZ])
        );
      }
      if (aliasesEN.length) {
        icon.aliasesEN = Array.from(
          new Set([...(icon.aliasesEN || []), ...aliasesEN])
        );
      }
    }
  }

  // Zkontrolujeme, že všechno má základní vlastnosti
  for (const [key, icon] of Object.entries(icons)) {
    if (!icon.emoji) icon.emoji = "❔";
    if (!icon.nameCZ) icon.nameCZ = key;
    if (!icon.nameEN) icon.nameEN = key;
    if (!icon.category) icon.category = "UNCATEGORIZED";
  }

  // Vygenerujeme TypeScript soubor
  const sortedKeys = Object.keys(icons).sort();
  const dataObjectLiteral = sortedKeys
    .map((key) => {
      const icon = icons[key];
      const lines = [];

      lines.push(`  "${key}": {`);
      lines.push(`    emoji: ${JSON.stringify(icon.emoji)},`);
      lines.push(`    nameCZ: ${JSON.stringify(icon.nameCZ)},`);
      lines.push(`    nameEN: ${JSON.stringify(icon.nameEN)},`);
      lines.push(`    category: ${JSON.stringify(icon.category)},`);

      if (icon.aliasesCZ && icon.aliasesCZ.length) {
        lines.push(`    aliasesCZ: ${JSON.stringify(icon.aliasesCZ)},`);
      }
      if (icon.aliasesEN && icon.aliasesEN.length) {
        lines.push(`    aliasesEN: ${JSON.stringify(icon.aliasesEN)},`);
      }

      // odebereme poslední čárku, pokud tam je
      let last = lines[lines.length - 1];
      if (last.endsWith(",")) {
        lines[lines.length - 1] = last.slice(0, -1);
      }

      lines.push("  }");
      return lines.join("\n");
    })
    .join(",\n");

  const ts = `// AUTO-GENERATED FROM ikons.md – DO NOT EDIT MANUALLY
// Pokud chceš něco změnit, uprav ikons.md a spusť znovu:
//   node scripts/generate-icons-from-md.js

export interface IconDefinition {
  emoji: string;
  nameCZ: string;
  nameEN: string;
  category: string;
  aliasesCZ?: string[];
  aliasesEN?: string[];
}

const data = {
${dataObjectLiteral}
} as const;

export type IconKey = keyof typeof data;
export const ICONS: Record<IconKey, IconDefinition> = data;
`;

  fs.mkdirSync(path.dirname(targetTsPath), { recursive: true });
  fs.writeFileSync(targetTsPath, ts, "utf8");
  console.log(
    `✅ icons.ts vygenerován: ${targetTsPath} (počet ikon: ${sortedKeys.length})`
  );
}

generateIcons();
