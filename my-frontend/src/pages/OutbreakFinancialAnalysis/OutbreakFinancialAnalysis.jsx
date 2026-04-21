import { useMemo, useState } from "react";
import {
  getTimeseriesStats,
  normaliseAlertTimeseries,
} from "../../api/alerts";
import {
  fetchFinancialData,
  normaliseFinancialEvents,
} from "../../api/financial";
import DiseaseFilter from "../../components/filters/DiseaseFilter";
import SpeciesFilter from "../../components/filters/SpeciesFilter";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ComposedChart,
  Line,
  Legend,
} from "recharts";
import styles from "./OutbreakFinancialAnalysis.module.css";

function parseMultiValueInput(input) {
  if (Array.isArray(input)) {
    return input.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof input !== "string") {
    return [];
  }

  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function findLatestCloseOnOrBefore(stockLookup, targetDate, maxLookbackDays = 31) {
  const date = new Date(`${targetDate}T00:00:00`);

  for (let i = 0; i <= maxLookbackDays; i++) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;

    if (stockLookup.has(key)) {
      return stockLookup.get(key);
    }

    date.setDate(date.getDate() - 1);
  }

  return null;
}

function addTickerToRows(rows, stockRows, ticker) {
  const stockLookup = new Map(
    stockRows.map((row) => [row.date, row.close])
  );

  return rows.map((row) => ({
    ...row,
    [ticker]: findLatestCloseOnOrBefore(stockLookup, row.period, 31),
  }));
}

function calculateLagCorrelation(rows, ticker, lag = 0) {
    const pairs = [];

    for (let i = 0; i < rows.length; i++) {
      const j = i + lag;

      if (j >= rows.length) break;

      const x = rows[i].cases;
      const y = rows[j][ticker];

      if (x != null && y != null) {
        pairs.push({ x, y });
      }
    }

    if (pairs.length < 2) return null;

    const n = pairs.length;

    const meanX = pairs.reduce((a, p) => a + p.x, 0) / n;
    const meanY = pairs.reduce((a, p) => a + p.y, 0) / n;

    let num = 0, dx = 0, dy = 0;

    for (const p of pairs) {
      const vx = p.x - meanX;
      const vy = p.y - meanY;

      num += vx * vy;
      dx += vx * vx;
      dy += vy * vy;
    }

    const denom = Math.sqrt(dx * dy);
    if (denom === 0) return null;

    return num / denom;
  }

function getCorrelationLabel(value) {
  if (value == null) return "Insufficient data";

  const abs = Math.abs(value);

  if (abs > 0.7) return "Strong";
  if (abs > 0.4) return "Moderate";
  if (abs > 0.2) return "Weak";

  return "Very weak";
}

function getMaxLag(interval) {
  if (interval === "month") return 3;
  if (interval === "week") return 8;
  return 14; // day
}

function findBestLag(rows, ticker, maxLag = 8) {
  let bestLag = null;
  let bestCorr = null;

  for (let lag = 0; lag <= maxLag; lag++) {
    const corr = calculateLagCorrelation(rows, ticker, lag);

    if (corr == null) continue;

    if (bestCorr == null || Math.abs(corr) > Math.abs(bestCorr)) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  return {
    bestLag,
    bestCorr,
  };
}

function getLatestCasesTrend(rows) {
  const validRows = rows.filter((row) => row.cases != null);

  if (validRows.length < 2) {
    return null;
  }

  const last = validRows[validRows.length - 1];
  const prev = validRows[validRows.length - 2];

  if (last.cases > prev.cases) return "increasing";
  if (last.cases < prev.cases) return "decreasing";
  return "flat";
}

function getPredictionDirection(trend, correlation) {
  if (trend == null || correlation == null) return null;
  if (trend === "flat") return "stable";

  const isPositive = correlation > 0;

  if (trend === "increasing") {
    return isPositive ? "increase" : "decrease";
  }

  if (trend === "decreasing") {
    return isPositive ? "decrease" : "increase";
  }

  return null;
}

function getConfidenceLabel(corr) {
  if (corr == null) return "Insufficient data";

  const abs = Math.abs(corr);

  if (abs >= 0.7) return "High";
  if (abs >= 0.4) return "Moderate";
  if (abs >= 0.2) return "Low";
  return "Very low";
}

export default function OutbreakFinancialAnalysis() {
  const [lag, setLag] = useState(0);

  const [filters, setFilters] = useState({
    from: "2020-01-01",
    to: "2026-01-01",
    interval: "month",
    disease: [],
    species: [],
    region: "",
    location: "",
  });

  const maxLag = getMaxLag(filters.interval);

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

      const formattedFilters = {
        ...filters,
        disease: parseMultiValueInput(filters.disease),
        species: parseMultiValueInput(filters.species),
        region: parseMultiValueInput(filters.region),
        location: parseMultiValueInput(filters.location),
      };

      console.log("filters", filters);
console.log("formattedFilters", formattedFilters);

      const raw = await getTimeseriesStats(formattedFilters);
      const rows = normaliseAlertTimeseries(raw);

      setBaseRows(rows);
      setComparisonRows(rows);
      setSelectedTickers([]);
      setTickerInput("");
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
      setError("Load outbreak data first.");
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

      setComparisonRows((prevRows) =>
        addTickerToRows(prevRows, stockRows, ticker)
      );
      setSelectedTickers((prev) => [...prev, ticker]);
      setTickerInput("");
    } catch (err) {
      setError(err.message || "Failed to add ticker");
    } finally {
      setLoadingTicker(false);
    }
  };

  const handleRemoveTicker = (tickerToRemove) => {
    setSelectedTickers((prev) =>
      prev.filter((t) => t !== tickerToRemove)
    );

    setComparisonRows((prevRows) =>
      prevRows.map((row) => {
        const newRow = { ...row };
        delete newRow[tickerToRemove];
        return newRow;
      })
    );
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
          <DiseaseFilter
            value={filters.disease}
            onChange={(newDiseases) =>
              setFilters((f) => ({ ...f, disease: newDiseases }))
            }
          />
        </label>

        <label>
          <SpeciesFilter
            value={filters.species}
            onChange={(newSpecies) =>
              setFilters((f) => ({ ...f, species: newSpecies }))
            }
          />
        </label>

        <label>
          Region
          <input
            type="text"
            name="region"
            value={filters.region}
            onChange={handleFilterChange}
            placeholder="comma-separated"
          />
        </label>

        <label>
          Location
          <input
            type="text"
            name="location"
            value={filters.location}
            onChange={handleFilterChange}
            placeholder="comma-separated"
          />
        </label>

        <label>
          Lag
          <select value={lag} onChange={(e) => setLag(Number(e.target.value))}>
            {Array.from({ length: maxLag + 1 }).map((_, i) => (
              <option key={i} value={i}>
                {i === 0
                  ? "0 (same interval)"
                  : `${i} ${filters.interval}${i > 1 ? "s" : ""}`}
              </option>
            ))}
          </select>
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
                    interval={Math.max(0, Math.floor(baseRows.length / 10))}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    allowDecimals={false}
                    label={{
                      value: "Number of cases",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip
                    labelFormatter={(label) =>
                      `Date: ${formatPeriodLabel(label)}`
                    }
                    formatter={(value) => [`${value} cases`, "Cases"]}
                  />
                  <Bar
                    dataKey="cases"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
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
            {selectedTickers.length ? (
              selectedTickers.map((ticker) => (
                <span key={ticker} className={styles.tickerChip}>
                  {ticker}
                  <button
                    onClick={() => handleRemoveTicker(ticker)}
                    className={styles.removeBtn}
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              "None yet"
            )}
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

        {selectedTickers.map((ticker) => {
          const corr = calculateLagCorrelation(comparisonRows, ticker, lag);
          const { bestLag, bestCorr } = findBestLag(comparisonRows, ticker, maxLag);
          const currentTrend = getLatestCasesTrend(comparisonRows);
          const predictedDirection = getPredictionDirection(currentTrend, bestCorr);
          const confidence = getConfidenceLabel(bestCorr);

          return (
            <section key={ticker} className={styles.panel}>
              <h2>{ticker} vs outbreak cases</h2>

              <p className={styles.correlation}>
                Correlation (lag = {lag}):{" "}
                {corr != null ? corr.toFixed(2) : "N/A"} (
                {getCorrelationLabel(corr)})
              </p>

              <div className={styles.predictionBox}>
                <h3>Prediction Insights</h3>

                <p>
                  <strong>Best lag:</strong>{" "}
                  {bestLag != null
                    ? `${bestLag} ${bestLag === 1 ? "interval" : "intervals"}`
                    : "N/A"}
                </p>

                <p>
                  <strong>Correlation:</strong>{" "}
                  {bestCorr != null ? bestCorr.toFixed(2) : "N/A"}
                </p>

                <p>
                  <strong>Current trend:</strong>{" "}
                  {currentTrend ?? "N/A"} cases
                </p>

                <p>
                  <strong>Confidence:</strong> {confidence}
                </p>

                <p>
                  <strong>Prediction:</strong>{" "}
                  {predictedDirection && bestLag != null
                    ? `${ticker} stock is likely to ${predictedDirection} in ~${bestLag} ${
                        bestLag === 1 ? "interval" : "intervals"
                      }`
                    : "Not enough data to generate a prediction"}
                </p>
              </div>

              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={360}>
                  <ComposedChart data={comparisonRows}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                      dataKey="period"
                      tickFormatter={formatPeriodLabel}
                      interval={Math.max(
                        0,
                        Math.floor(comparisonRows.length / 10)
                      )}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                    />

                    <YAxis
                      yAxisId="left"
                      allowDecimals={false}
                      label={{
                        value: "Cases",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />

                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={["auto", "auto"]}
                      label={{
                        value: `${ticker} Close`,
                        angle: 90,
                        position: "insideRight",
                      }}
                    />

                    <Tooltip
                      labelFormatter={(label) =>
                        `Date: ${formatPeriodLabel(label)}`
                      }
                      formatter={(value, name) => {
                        if (name === "Cases") {
                          return [`${value}`, name];
                        }

                        return [
                          value != null && typeof value === "number"
                            ? value.toFixed(2)
                            : "-",
                          name,
                        ];
                      }}
                    />

                    <Legend />

                    <Bar
                      yAxisId="left"
                      dataKey="cases"
                      name="Cases"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />

                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey={ticker}
                      name={`${ticker} Close`}
                      stroke="#16a34a"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}