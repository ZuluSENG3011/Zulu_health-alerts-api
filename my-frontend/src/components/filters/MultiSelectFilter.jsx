import { useState } from "react";
import styles from "./MultiSelectFilter.module.css";

export default function MultiSelectFilter({ label, options, value, onChange }) {
  const [search, setSearch] = useState("");

  const toggle = (item) => {
    const exists = value.includes(item);

    if (exists) {
      onChange(value.filter((v) => v !== item));
    } else {
      onChange([...value, item]);
    }
  };

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <input
        placeholder={`Search ${label.toLowerCase()}...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={styles.search}
      />

      <div className={styles.list}>
        {filtered.map((item) => (
          <label key={item} className={styles.option}>
            <input
              type="checkbox"
              checked={value.includes(item)}
              onChange={() => toggle(item)}
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}