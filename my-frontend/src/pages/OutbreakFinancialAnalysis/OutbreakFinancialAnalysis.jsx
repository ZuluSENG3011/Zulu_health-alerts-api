import { useMemo, useState } from "react";
import {
  getTimeseriesStats,
  normaliseAlertTimeseries,
} from "../../api/alerts";
import {
  fetchFinancialData,
  normaliseFinancialEvents,
} from "../../api/financial";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import styles from "./OutbreakFinancialAnalysis.module.css";

function addTickerToRows(rows, stockRows, ticker) {
  const stockLookup = new Map(stockRows.map((row) => [row.date, row.close]));
  let lastClose = null;

  return rows.map((row) => {
    const exactClose = stockLookup.get(row.period);

    if (exactClose != null) {
      lastClose = exactClose;
    }

    return {
      ...row,
      [ticker]: exactClose != null ? exactClose : lastClose,
    };
  });
}

export default function OutbreakFinancialAnalysis() {
  const [filters, setFilters] = useState({
    from: "2025-01-01",
    to: "2025-01-10",
    interval: "day",
    disease: "measles",
    species: "",
    region: "",
    location: "",
  });

  const [tickerInput, setTickerInput] = useState("");
  const [selectedTickers, setSelectedTickers] = useState([]);
  const [baseRows, setBaseRows] = useState([]);
  const [comparisonRows, setComparisonRows] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [loadingTicker, setLoadingTicker] = useState(false);
  const [error, setError] = useState("");

  const tableRows = useMemo(() => {
    return comparisonRows.length ? comparisonRows : baseRows;
  }, [comparisonRows, baseRows]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLoadCases = async () => {
    try {
      setLoadingCases(true);
      setError("");

      const raw = await getTimeseriesStats(filters);
      const rows = normaliseAlertTimeseries(raw);

      setBaseRows(rows);
      setComparisonRows(rows);
      setSelectedTickers([]);
    } catch (err) {
      setError(err.message || "Failed to load outbreak data");
    } finally {
      setLoadingCases(false);
    }
  };

  const handleAddTicker = async () => {
    const ticker = tickerInput.trim().toUpperCase();

    if (!ticker) return;
    if (selectedTickers.includes(ticker)) return;
    if (!baseRows.length) {
      setError("Load outbreak timeseries first.");
      return;
    }

    try {
      setLoadingTicker(true);
      setError("");

      const raw = await fetchFinancialData({
        ticker,
        from: filters.from,
        to: filters.to,
      });

      const stockRows = normaliseFinancialEvents(raw);

      setComparisonRows((prev) => addTickerToRows(prev, stockRows, ticker));
      setSelectedTickers((prev) => [...prev, ticker]);
      setTickerInput("");
    } catch (err) {
      setError(err.message || "Failed to add ticker");
    } finally {
      setLoadingTicker(false);
    }
  };

  const formatPeriodLabel = (value) => {
    if (!value) return "";

    if (filters.interval === "month") {
      return value.slice(0, 7);
    }

    return value;
  };

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <h2>Filters</h2>

        <label>
          From
          <input
            type="date"
            name="from"
            value={filters.from}
            onChange={handleFilterChange}
          />
        </label>

        <label>
          To
          <input
            type="date"
            name="to"
            value={filters.to}
            onChange={handleFilterChange}
          />
        </label>

        <label>
          Interval
          <select
            name="interval"
            value={filters.interval}
            onChange={handleFilterChange}
          >
            <option value="day">day</option>
            <option value="week">week</option>
            <option value="month">month</option>
          </select>
        </label>

        <label>
          Disease
          <input
            type="text"
            name="disease"
            value={filters.disease}
            onChange={handleFilterChange}
            placeholder="e.g. measles"
          />
        </label>

        <label>
          Species
          <input
            type="text"
            name="species"
            value={filters.species}
            onChange={handleFilterChange}
          />
        </label>

        <label>
          Region
          <input
            type="text"
            name="region"
            value={filters.region}
            onChange={handleFilterChange}
          />
        </label>

        <label>
          Location
          <input
            type="text"
            name="location"
            value={filters.location}
            onChange={handleFilterChange}
          />
        </label>

        <button onClick={handleLoadCases} disabled={loadingCases}>
          {loadingCases ? "Loading..." : "Load outbreak data"}
        </button>
      </aside>

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Outbreak vs Market Analysis</h1>

          <div className={styles.addTicker}>
            <input
              type="text"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value)}
              placeholder="Add ticker e.g. DAL"
            />
            <button onClick={handleAddTicker} disabled={loadingTicker}>
              {loadingTicker ? "Adding..." : "Add"}
            </button>
          </div>
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <section className={styles.panel}>
          <h2>Outbreak timeseries</h2>

          {baseRows.length ? (
            <div className={styles.chartWrap}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={baseRows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"
                    tickFormatter={formatPeriodLabel}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip labelFormatter={formatPeriodLabel} />
                  <Bar dataKey="cases" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p>No outbreak data loaded yet.</p>
          )}
        </section>

        <section className={styles.panel}>
          <h2>Selected tickers</h2>
          <div className={styles.tickerList}>
            {selectedTickers.length ? selectedTickers.join(", ") : "None yet"}
          </div>
        </section>

        <section className={styles.panel}>
          <h2>Comparison table</h2>

          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Cases</th>
                  {selectedTickers.map((ticker) => (
                    <th key={ticker}>{ticker} Close</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.period}>
                    <td>{row.period}</td>
                    <td>{row.cases}</td>
                    {selectedTickers.map((ticker) => (
                      <td key={ticker}>
                        {row[ticker] != null ? row[ticker].toFixed(2) : "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}