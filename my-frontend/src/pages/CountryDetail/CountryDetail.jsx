import { useParams } from "react-router-dom";
import australiaData from "../../data/australiaMockData";
import CountryDetailPage from "./CountryDetailPage";
import styles from "./CountryDetail.module.css";

const CountryDetail = () => {
  const { countryCode } = useParams();

  if (countryCode === "AU") {
    return <CountryDetailPage title="Australia" data={australiaData} />;
  }

  return <div className={styles.notFound}>Country not yet available.</div>;
};

export default CountryDetail;
