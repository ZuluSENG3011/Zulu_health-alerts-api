import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ResultDisplay.module.css";

const ResultDisplay = ({ title, data }) => {
  const [selectedAlert, setSelectedAlert] = useState(data.alerts[0] ?? null);
  const navigate = useNavigate();

  const alerts = data.alerts;

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>Search Results ({alerts.length})</p>
      </div>

      <div className={styles.layout}>
        <div className={styles.leftPanel}>
          <h3 className={styles.panelTitle}>Latest Posts on ProMED</h3>

          {alerts.map((alert) => {
            const isSelected = selectedAlert?.id === alert.id;

            return (
              <div
                key={alert.id}
                className={`${styles.alertRow} ${
                  isSelected ? styles.alertRowSelected : ""
                }`}
                onClick={() => setSelectedAlert(alert)}
              >
                <span className={styles.rowDate}>{alert.date}</span>
                <span className={styles.rowTitle}>{alert.title}</span>
              </div>
            );
          })}
        </div>

        <div className={styles.rightPanel}>
          {selectedAlert === null ? (
            <div className={styles.emptyState}>
              <p>Select an alert to view details</p>
            </div>
          ) : (
            <div className={styles.detailView}>
              <p className={styles.alertIdLabel}>
                Alert ID: {selectedAlert.id}
              </p>

              <h2 className={styles.detailTitle}>{selectedAlert.title}</h2>

              <div className={styles.detailSection}>
                <h4 className={styles.sectionHeading}>Alert Details</h4>

                <p className={styles.detailField}>
                  <span className={styles.fieldLabel}>Issue Date:</span>{" "}
                  {selectedAlert.date}
                </p>

                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Disease:</span>
                  <div className={styles.tagRow}>
                    {selectedAlert.disease.map((d, i) => (
                      <span
                        key={i}
                        className={`${styles.diseaseTag} ${styles.clickable}`}
                        onClick={() =>
                          navigate(`/disease/${encodeURIComponent(d)}`)
                        }
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Species:</span>
                  <div className={styles.tagRow}>
                    {selectedAlert.species.map((s, i) => (
                      <span key={i} className={styles.speciesTag}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Regions:</span>
                  <div className={styles.tagRow}>
                    {selectedAlert.region.map((r, i) => (
                      <span key={i} className={styles.regionTag}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Locations:</span>
                  <div className={styles.tagRow}>
                    {selectedAlert.location.map((loc, i) => (
                      <span key={i} className={styles.locationTag}>
                        {loc.join(", ")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ResultDisplay;
