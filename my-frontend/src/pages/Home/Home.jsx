import { useNavigate } from "react-router-dom";
import Navigation from "../../components/Navigation";
import WorldMapComponent from "../../components/WorldMap";
import DiseaseGraph from "../../components/DiseaseGraph";
import styles from "./Home.module.css";
import DiseaseSpreadChart from "../../components/DiseaseSpreadChart";

function Home() {
  const navigate = useNavigate();

  return (
    <>
      <Navigation />
      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <div className={styles.heroLeft}>
            <span className={styles.heroBadge}>
              <span className={styles.heroDot} />
              Live Health Intelligence · Updated daily
            </span>
            <h1 className={styles.heroTitle}>Global Disease Outbreak Tracker</h1>
            <p className={styles.heroSubtitle}>
              Real-time alerts from ProMED. Know the risks before you travel.
            </p>
          </div>
          <div className={styles.heroRight}>
            <button className={styles.heroBrowseBtn} onClick={() => navigate("/search")}>
              Browse All Alerts
            </button>
            <button className={styles.heroNotifyBtn} onClick={() => navigate("/signup")}>
              Get Notified
            </button>
          </div>
        </div>
      </div>
      <main className={styles.pageContainer}>
        <div className={styles.mapWrapper}>
          <WorldMapComponent />
        </div>
        <div className={styles.graphSection}>
          <DiseaseGraph />
        </div>
        <div className={styles.pieChartSection}>
          <DiseaseSpreadChart />
        </div>
      </main>
    </>
  );
}

export default Home;
