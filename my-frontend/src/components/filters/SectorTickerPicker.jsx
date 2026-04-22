import { useEffect, useMemo, useState } from "react";
import styles from "./SectorTickerPicker.module.css";

export default function SectorTickerPicker({
  modeConfig,
  selectedTickers = [],
  onAddTicker,
}) {
  const categories = modeConfig?.categories ?? {};

  const categoryNames = useMemo(() => Object.keys(categories), [categories]);

  const [activeCategory, setActiveCategory] = useState(categoryNames[0] ?? "");

  useEffect(() => {
    if (categoryNames.length > 0) {
      setActiveCategory(categoryNames[0]);
    }
  }, [categoryNames]);

  const activeItems = categories[activeCategory] ?? [];

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs}>
        {categoryNames.map((category) => (
          <button
            key={category}
            type="button"
            className={`${styles.tab} ${
              activeCategory === category ? styles.activeTab : ""
            }`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {activeItems.map((item) => {
          const alreadyAdded = selectedTickers.includes(item.ticker);

          return (
            <div key={item.ticker} className={styles.row}>
              <div className={styles.info}>
                <div className={styles.label}>{item.label}</div>
                {modeConfig?.key === "travel" && (
                  <div className={styles.code}>{item.ticker}</div>
                )}
              </div>

              <button
                type="button"
                className={styles.addBtn}
                onClick={() => onAddTicker(item.ticker)}
                disabled={alreadyAdded}
              >
                {alreadyAdded ? "Added" : "Add"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}