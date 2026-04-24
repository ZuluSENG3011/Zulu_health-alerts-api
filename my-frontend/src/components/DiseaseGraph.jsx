import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Label,
} from "recharts";
import { getTimeseriesStats } from "../api/alerts";
import styles from "./DiseaseGraph.module.css";

/**
 * DiseaseGraph displays outbreak trends over time.
 */
function DiseaseGraph() {
  // Format Date object into YYYY-MM-DD for date inputs and API requests.
  const formatDate = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);

  const [from, setFrom] = useState(formatDate(weekAgo));
  const [to, setTo] = useState(formatDate(today));
  const [disease, setDisease] = useState("");
  const [species, setSpecies] = useState("");
  const [region, setRegion] = useState("");
  const [location, setLocation] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeInterval, setActiveInterval] = useState(null);

  // Fill missing days/weeks/months with 0 so the chart timeline is continuous.
  const fillMissingPeriods = (results, from, to, interval) => {
    const map = {};
    results.forEach((r) => (map[r.period.slice(0, 10)] = r.count));

    const periods = [];
    const cursor = new Date(from);
    const end = new Date(to);

    if (interval === "month") cursor.setDate(1);
    if (interval === "week") {
      const day = cursor.getDay();
      cursor.setDate(cursor.getDate() + (day === 0 ? -6 : 1 - day));
    }

    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
      periods.push({ period: key, count: map[key] || 0 });

      if (interval === "day") cursor.setDate(cursor.getDate() + 1);
      else if (interval === "week") cursor.setDate(cursor.getDate() + 7);
      else cursor.setMonth(cursor.getMonth() + 1);
    }

    return periods;
  };

  // Choose day, week, or month interval based on the selected date range.
  const getInterval = () => {
    if (!from || !to) return "month";
    const days = (new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24);
    if (days <= 14) return "day";
    if (days <= 90) return "week";
    return "month";
  };

  // Fetch filtered timeseries data when the user submits the form.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const interval = getInterval();
      setActiveInterval(interval);
      const result = await getTimeseriesStats({
        from,
        to,
        disease,
        species,
        region,
        location,
        interval,
      });
      setData(fillMissingPeriods(result.results || [], from, to, interval));
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Load the default chart data for the last 7 days when the page opens.
  useEffect(() => {
    const loadDefaultWeek = async () => {
      setLoading(true);
      setError(null);

      try {
        const interval = "day";
        setActiveInterval(interval);
        const result = await getTimeseriesStats({
          from: formatDate(weekAgo),
          to: formatDate(today),
          disease,
          species,
          region,
          location,
          interval,
        });
        setData(
          fillMissingPeriods(
            result.results || [],
            formatDate(weekAgo),
            formatDate(today),
            interval,
          ),
        );
      } catch (err) {
        console.error(err);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    loadDefaultWeek();
  }, []);

  return (
    <div
      className={styles.container}
      role="region"
      aria-label="Disease Outbreak Trends bar chart"
      tabIndex="0"
    >
      <h2 className={styles.title}>Disease Outbreak Trends</h2>

      {/* Filter form for selecting date range and alert attributes. */}
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputs}>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={styles.input}
            aria-label="Start date"
          />
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
            className={styles.input}
            aria-label="End date"
          />
          <input
            type="text"
            placeholder="Disease (e.g. cholera)"
            value={disease}
            onChange={(e) => setDisease(e.target.value)}
            className={styles.input}
            aria-label="Filter by disease"
          />
          <input
            type="text"
            placeholder="Species (e.g. human)"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className={styles.input}
            aria-label="Filter by species"
          />
          <input
            type="text"
            placeholder="Region (e.g. africa)"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className={styles.input}
            aria-label="Filter by region"
          />
          <input
            type="text"
            placeholder="Location (e.g. kenya)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={styles.input}
            aria-label="Filter by location"
          />
          <button type="submit" className={styles.button}>
            Search
          </button>
        </div>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {/* Render the bar chart when timeseries data is available. */}
      {data.length > 0 && (
        <div aria-hidden="true" tabIndex="-1">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} margin={{ top: 20, bottom: 20, right: 30 }}>
              <XAxis dataKey="period" tick={{ fontSize: 12 }}>
                {activeInterval && (
                  <Label
                    value={`per ${activeInterval}`}
                    position="insideBottomRight"
                    offset={-5}
                    fontSize={11}
                    fill="#718096"
                  />
                )}
              </XAxis>
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#255ad4" maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default DiseaseGraph;
