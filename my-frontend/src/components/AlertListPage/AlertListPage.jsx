import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../Navigation";
import styles from "./AlertListPage.module.css";

const AlertListPage = ({ title, data }) => {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const navigate = useNavigate();

  const alerts = data.alerts;

  return (
    <div className={styles.page}>
      <Navigation />
      <main className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>
            A snapshot of global health events from the past year ({alerts.length} alerts)
          </p>
        </div>

        <div className={styles.layout}>
          {/* left panel */}
          <div className={styles.leftPanel}>
            <h3 className={styles.panelTitle}>Latest Posts on ProMED</h3>
            {alerts.map((alert) => {
              const isSelected = selectedAlert?.id === alert.id;

              return (
                <div
                  key={alert.id}
                  className={`${styles.alertRow} ${isSelected ? styles.alertRowSelected : ""}`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <span className={styles.rowDate}>{alert.date}</span>
                  <span className={styles.rowTitle}>{alert.title}</span>
                </div>
              );
            })}
          </div>

          {/* right panel */}
          <div className={styles.rightPanel}>
            {selectedAlert === null ? (
              <div className={styles.emptyState}>
                <p>Select an alert to view details</p>
              </div>
            ) : (
              <div className={styles.detailView}>
                <p className={styles.alertIdLabel}>Alert ID: {selectedAlert.id}</p>
                <h2 className={styles.detailTitle}>{selectedAlert.title}</h2>

                <div className={styles.detailSection}>
                  <h4 className={styles.sectionHeading}>Alert Details</h4>

                  <p className={styles.detailField}>
                    <span className={styles.fieldLabel}>Issue Date:</span> {selectedAlert.date}
                  </p>

                  {/* disease tags - click to view disease page */}
                  <div className={styles.detailField}>
                    <div className={styles.tagRow}>
                      {selectedAlert.disease.map((d, i) => (
                        <span
                          key={i}
                          className={`${styles.diseaseTag} ${styles.clickable}`}
                          onClick={() => navigate(`/disease/${encodeURIComponent(d)}`)}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* species */}
                  <div className={styles.detailField}>
                    <span className={styles.fieldLabel}>Species:</span>
                    <div className={styles.tagRow}>
                      {selectedAlert.species.map((s, i) => (
                        <span key={i} className={styles.speciesTag}>{s}</span>
                      ))}
                    </div>
                  </div>

                  {/* regions */}
                  <div className={styles.detailField}>
                    <span className={styles.fieldLabel}>Regions:</span>
                    <div className={styles.tagRow}>
                      {selectedAlert.region.map((r, i) => (
                        <span key={i} className={styles.regionTag}>{r}</span>
                      ))}
                    </div>
                  </div>

                  {/* locations */}
                  <div className={styles.detailField}>
                    <span className={styles.fieldLabel}>Locations:</span>
                    <div className={styles.tagRow}>
                      {selectedAlert.location.map((loc, i) => (
                        <span key={i} className={styles.locationTag}>{loc.join(", ")}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AlertListPage;
