import { useParams } from "react-router-dom";
import australiaData from "../../data/australiaMockData";
import styles from "./CountryDetail.module.css";

function CountryDetail() {
  const { countryCode } = useParams();

  if (countryCode !== "AU") {
    return <div className={styles.notFound}>Country not found.</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Australia</h1>
        <p className={styles.subtitle}>
          A snapshot of global health events from the past year
        </p>
      </div>

      <div className={styles.layout}>
        <div className={styles.leftPanel}>
          <p>Disease list goes here</p>
        </div>

        <div className={styles.rightPanel}>
          <p>Alert detail goes here</p>
        </div>
      </div>
    </div>
  );
}

export default CountryDetail;
