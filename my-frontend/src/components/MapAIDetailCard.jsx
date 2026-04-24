import { useNavigate } from "react-router-dom";
import styles from "./MapAIDetailCard.module.css";

/**
 * MapAIDetailCard displays AI outbreak details for the selected country.
 * Pair with WorldMap component
 */
function MapAIDetailCard({ detail, onClose }) {
  const navigate = useNavigate();

  // Do not render the card if no country is selected.
  if (!detail) return null;

  // Navigate to the search page filtered by the selected country.
  const handleNavigate = () => {
    if (!detail?.countryName) return;
    navigate(`/search?location=${encodeURIComponent(detail.countryName)}`);
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.country}>{detail.countryName}</h3>
          <p className={styles.subTitle}>AI outbreak summary</p>
        </div>

        {/* Close the AI detail card. */}
        <button className={styles.closeBtn} onClick={onClose}>
          ×
        </button>
      </div>

      {/* Display the risk level badge for the selected country. */}
      <div className={styles.section}>
        <span className={styles.label}>Risk level</span>
        <span
          className={`${styles.badge} ${styles[detail.riskLevel?.toLowerCase()] || ""}`}
        >
          {detail.riskLevel || "Unknown"}
        </span>
      </div>

      {/* Show top diseases if disease data is available. */}
      {detail.diseases?.length > 0 && (
        <div className={styles.sectionBlock}>
          <span className={styles.label}>Top diseases</span>
          <div className={styles.tags}>
            {detail.diseases.map((disease) => (
              <span key={disease} className={styles.tag}>
                {disease}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Display the AI generated country summary. */}
      <div className={styles.sectionBlock}>
        <span className={styles.label}>Summary</span>
        <p className={styles.summary}>
          {detail.aiSummary || "No AI summary available for this country yet."}
        </p>
      </div>

      {/* Navigate to detailed country alert results. */}
      <button className={styles.navigateBtn} onClick={handleNavigate}>
        View country alerts
      </button>
    </div>
  );
}

export default MapAIDetailCard;
