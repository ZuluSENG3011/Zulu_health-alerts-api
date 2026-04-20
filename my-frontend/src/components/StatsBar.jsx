import { useEffect, useState } from "react";
import { getAlerts } from "../api/alerts";
import styles from "./StatsBar.module.css";

function StatsBar() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getAlerts();
        const alerts = data.alerts || [];

        const countries = new Set();
        const diseases = new Set();

        alerts.forEach((alert) => {
          (alert.location || []).forEach(([country]) => {
            if (country) countries.add(country);
          });
          (alert.disease || []).forEach((d) => {
            if (d) diseases.add(d);
          });
        });

        setStats({
          alerts: alerts.length,
          countries: countries.size,
          diseases: diseases.size,
        });
      } catch {
        // silently fail — stats bar is non-critical
      }
    }

    fetchStats();
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className={styles.statsBar}>
      <div className={styles.statCard}>
        <span className={styles.accent} style={{ background: "#e53e3e" }} />
        <div>
          <span className={styles.number}>{stats ? stats.alerts : "—"}</span>
          <span className={styles.label}>Active Alerts</span>
          <span className={styles.sub}>from ProMED</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.statCard}>
        <span className={styles.accent} style={{ background: "#255ad4" }} />
        <div>
          <span className={styles.number}>{stats ? stats.countries : "—"}</span>
          <span className={styles.label}>Countries Affected</span>
          <span className={styles.sub}>across all regions</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.statCard}>
        <span className={styles.accent} style={{ background: "#255ad4" }} />
        <div>
          <span className={styles.number}>{stats ? stats.diseases : "—"}</span>
          <span className={styles.label}>Diseases Tracked</span>
          <span className={styles.sub}>updated daily</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.statCard}>
        <span className={styles.accent} style={{ background: "#38a169" }} />
        <div>
          <span className={styles.number}>Today</span>
          <span className={styles.label}>Last Updated</span>
          <span className={styles.sub}>{today}</span>
        </div>
      </div>
    </div>
  );
}

export default StatsBar;
