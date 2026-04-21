import { useState } from "react";
import styles from "./DiseaseFilter.module.css";

const SPECIES_OPTIONS = [
  "Humans",
  "Birds",
  "Poultry",
  "Cattle",
  "Dogs",
  "Cats",
  "Horses",
  "Swine",
  "Bats",
  "Sheep",
  "Goats",
  "Camelids",
  "Rodents",
  "Non-human primates",
  "Wildlife",
];

export default function SpeciesFilter({ value, onChange }) {
  const [search, setSearch] = useState("");

  const toggleSpecies = (species) => {
    const exists = value.includes(species);

    if (exists) {
      onChange(value.filter((s) => s !== species));
    } else {
      onChange([...value, species]);
    }
  };

  const filtered = SPECIES_OPTIONS.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <label>Species</label>

      <input
        placeholder="Search species..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={styles.search}
      />

      <div className={styles.list}>
        {filtered.map((species) => (
          <label key={species} className={styles.option}>
            <input
              type="checkbox"
              checked={value.includes(species)}
              onChange={() => toggleSpecies(species)}
            />
            <span>{species}</span>
          </label>
        ))}
      </div>
    </div>
  );
}