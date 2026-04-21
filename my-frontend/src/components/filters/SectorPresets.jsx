import styles from "./SectorPresets.module.css";

const PRESETS = {
  "Travel": ["DAL", "AAL", "UAL"],
  "Tourism": ["BKNG", "ABNB"],
  "Retail": ["AMZN", "WMT"],
  "Healthcare": ["PFE", "MRNA"],
};

export default function SectorPresets({ onSelect }) {
  return (
    <div className={styles.container}>
      <label className={styles.label}>Quick Select (Sectors)</label>

      <div className={styles.buttons}>
        {Object.entries(PRESETS).map(([sector, tickers]) => (
          <button
            key={sector}
            className={styles.button}
            onClick={() => onSelect(tickers)}
          >
            {sector}
          </button>
        ))}
      </div>
    </div>
  );
}