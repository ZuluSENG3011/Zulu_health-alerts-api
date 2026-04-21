import { useState } from "react";
import styles from "./SectorTickerPicker.module.css";

const SECTORS = {
  Travel: ["DAL", "AAL", "UAL"],
  Tourism: ["BKNG", "ABNB"],
  Retail: ["AMZN", "WMT"],
  Healthcare: ["PFE", "MRNA"],
};

export default function SectorTickerPicker({ selectedTickers, onAddTicker }) {
  const [activeSector, setActiveSector] = useState("Travel");

  const tickers = SECTORS[activeSector] || [];

  return (
    <div className={styles.container}>

      <div className={styles.sectorButtons}>
        {Object.keys(SECTORS).map((sector) => (
          <button
            key={sector}
            type="button"
            className={`${styles.sectorButton} ${
              activeSector === sector ? styles.active : ""
            }`}
            onClick={() => setActiveSector(sector)}
          >
            {sector}
          </button>
        ))}
      </div>

      <div className={styles.tickerList}>
        {tickers.map((ticker) => {
          const alreadySelected = selectedTickers.includes(ticker);

          return (
            <div key={ticker} className={styles.tickerCard}>
              <span className={styles.ticker}>{ticker}</span>
              <button
                type="button"
                onClick={() => onAddTicker(ticker)}
                disabled={alreadySelected}
                className={styles.addButton}
              >
                {alreadySelected ? "Added" : "Add"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}