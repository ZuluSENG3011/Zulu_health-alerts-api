import { useState } from "react";
import { getTimeseriesStats } from "../api/alerts";
import styles from "./DiseaseGraph.module.css";

function DiseaseGraph() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [disease, setDisease] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await getTimeseriesStats({ from, to, disease });
      console.log(result.results);
      setData(result.results || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Disease Outbreak Trends</h2>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputs}>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={styles.input}
          />
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
            className={styles.input}
          />
          <input
            type="text"
            placeholder="Disease (e.g. measles)"
            value={disease}
            onChange={(e) => setDisease(e.target.value)}
            className={styles.input}
          />
          <button type="submit" className={styles.button}>
            Search
          </button>
        </div>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

export default DiseaseGraph;
