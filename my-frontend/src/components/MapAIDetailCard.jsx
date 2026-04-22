import { useNavigate } from "react-router-dom";
import styles from "./MapAIDetailCard.module.css";

function MapAIDetailCard({ detail, onClose }) {
  const navigate = useNavigate();

  if (!detail) return null;

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
        <button className={styles.closeBtn} onClick={onClose}>
          ×
        </button>
      </div>

      <div className={styles.section}>
        <span className={styles.label}>Risk level</span>
        <span
          className={`${styles.badge} ${styles[detail.riskLevel?.toLowerCase()] || ""}`}
        >
          {detail.riskLevel || "Unknown"}
        </span>
      </div>

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

      <div className={styles.sectionBlock}>
        <span className={styles.label}>Summary</span>
        <p className={styles.summary}>
          {detail.aiSummary || "No AI summary available for this country yet."}
        </p>
      </div>

      <button className={styles.navigateBtn} onClick={handleNavigate}>
        View country alerts
      </button>
    </div>
  );
}

export default MapAIDetailCard;
