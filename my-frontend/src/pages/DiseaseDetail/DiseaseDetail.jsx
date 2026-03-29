import { useParams } from "react-router-dom";
import measlesData from "../../data/measlesMockData";
import AlertListPage from "../../components/AlertListPage/AlertListPage";
import styles from "../../components/AlertListPage/AlertListPage.module.css";

const DiseaseDetail = () => {
  const { diseaseName } = useParams();

  if (diseaseName === "Measles") {
    return <AlertListPage title="Measles" data={measlesData} />;
  }

  return <div className={styles.notFound}>Disease data not yet available.</div>;
};

export default DiseaseDetail;
