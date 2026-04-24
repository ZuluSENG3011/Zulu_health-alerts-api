import { useNavigate } from "react-router-dom";
import Navigation from "../../components/Navigation";
import WorldMapComponent from "../../components/WorldMap";
import StatsBar from "../../components/StatsBar";
import DiseaseGraph from "../../components/DiseaseGraph";
import styles from "./Home.module.css";
import DiseaseSpreadChart from "../../components/DiseaseSpreadChart";

/**
 * Home displays the main dashboard page.
 */
function Home() {
  const navigate = useNavigate();

  return (
    <>
      <Navigation />

      {/* Hero section introducing the outbreak tracking system. */}
      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <div className={styles.heroLeft}>
            <span className={styles.heroBadge}>
              <span className={styles.heroDot} />
              Live Health Intelligence · Updated daily
            </span>
            <h1 className={styles.heroTitle}>
              Global Disease Outbreak Tracker
            </h1>
            <p className={styles.heroSubtitle}>
              Real-time alerts from ProMED. Know the risks before you travel.
            </p>
          </div>

          <div className={styles.heroRight}>
            <button
              className={styles.heroBrowseBtn}
              onClick={() => {
                const today = new Date();
                const from = new Date(today);
                from.setMonth(today.getMonth() - 6);

                // Navigate to alerts from the last 6 months by default.
                navigate(`/search?from=${from.toISOString().split("T")[0]}`);
              }}
            >
              Browse Alerts
            </button>
          </div>
        </div>
      </div>

      {/* Main dashboard content. */}
      <main id="main-content" className={styles.pageContainer}>
        {/* World map showing disease risk by country. */}
        <div className={styles.mapWrapper}>
          <WorldMapComponent />
        </div>

        {/* Summary statistics for alerts, countries, and diseases. */}
        <StatsBar />

        {/* Charts for outbreak trends and disease distribution. */}
        <div className={styles.chartsRow}>
          <div className={styles.graphSection}>
            <DiseaseGraph />
          </div>
          <div className={styles.pieChartSection}>
            <DiseaseSpreadChart />
          </div>
        </div>
      </main>
    </>
  );
}

export default Home;
