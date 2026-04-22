import { useMemo, useState } from "react";
import {
  getTimeseriesStats,
  normaliseAlertTimeseries,
} from "../../api/alerts";
import {
  fetchFinancialData,
  normaliseFinancialEvents,
} from "../../api/financial";
import FilterSection from "../../components/filters/FilterSection";
import DiseaseFilter from "../../components/filters/DiseaseFilter";
import SpeciesFilter from "../../components/filters/SpeciesFilter";
import LocationFilter from "../../components/filters/LocationFilter";
import SectorTickerPicker from "../../components/filters/SectorTickerPicker";
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
import Navigation from "../../components/Navigation";
import styles from "./OutbreakFinancialAnalysis.module.css";
import { MODE_CONFIG } from "./analysisMode";
import { generateTravelInsightCard } from "../../utils/travelInsights";

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
  const stockLookup = new Map(stockRows.map((row) => [row.date, row.close]));

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

  let num = 0;
  let dx = 0;
  let dy = 0;

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
  if (interval === "month") return 0;
  if (interval === "week") return 2;
  return 14;
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

  return { bestLag, bestCorr };
}

function getLatestCasesTrend(rows) {
  const validRows = rows.filter((row) => row.cases != null);

  if (validRows.length < 2) return null;

  const last = validRows[validRows.length - 1];
  const prev = validRows[validRows.length - 2];

  if (last.cases > prev.cases) return "increasing";
  if (last.cases < prev.cases) return "decreasing";
  return "flat";
}

function getImpactStrength(correlation) {
  const abs = Math.abs(correlation ?? 0);
  if (abs >= 0.6) return "High";
  if (abs >= 0.3) return "Moderate";
  return "Low";
}

function formatLagForTravel(lag, interval) {
  if (lag == null) return "No clear delay";
  if (lag === 0) {
    if (interval === "month") return "within the same month";
    if (interval === "week") return "within the same week";
    return "within the same day";
  }
  return `about ${lag} ${interval}${lag > 1 ? "s" : ""} later`;
}

function generateFinanceInsightCard({
  ticker,
  trend,
  correlation,
  lag,
  interval,
}) {
  if (correlation == null || lag == null) {
    return {
      title: "Market Insight",
      level: "Low",
      summary: "There is not enough data to identify a clear market relationship yet.",
      implications: ["Try a wider date range or a different ticker."],
      signal: "Insufficient data",
      timing: "Unknown",
    };
  }

  const strength = getImpactStrength(correlation);
  const timing = lag === 0
    ? `within the same ${interval}`
    : `about ${lag} ${interval}${lag > 1 ? "s" : ""} later`;

  return {
    title: "Market Insight",
    level: strength,
    summary:
      correlation > 0
        ? `This ticker tends to move in the same direction as outbreak cases ${timing}.`
        : `This ticker tends to move in the opposite direction to outbreak cases ${timing}.`,
    implications: [
      "Use this as an exploratory relationship, not a prediction.",
      "Compare with additional companies for stronger interpretation.",
    ],
    signal:
      correlation > 0
        ? `${ticker} shows a positive relationship`
        : `${ticker} shows a negative relationship`,
    timing,
  };
}

export default function OutbreakFinancialAnalysis() {
  const [mode, setMode] = useState("finance");
  const modeConfig = MODE_CONFIG[mode];

  const [lag, setLag] = useState(0);

  const [filters, setFilters] = useState({
    from: "2020-01-01",
    to: "2026-01-01",
    interval: "month",
    disease: [],
    species: [],
    location: {
      continent: [],
      country: [],
    },
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

  const handleLoadCases = async () => {
    try {
      setLoadingCases(true);
      setError("");

      const formattedFilters = {
        from: filters.from,
        to: filters.to,
        interval: filters.interval,
        disease: filters.disease,
        species: filters.species,
        region: filters.location.continent,
        location: filters.location.country,
      };

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

  const handleAddTicker = async (tickerOverride = "") => {
    const sourceTicker =
      typeof tickerOverride === "string" && tickerOverride
        ? tickerOverride
        : tickerInput;

    const ticker = sourceTicker.trim().toUpperCase();

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
    setSelectedTickers((prev) => prev.filter((t) => t !== tickerToRemove));

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
    if (filters.interval === "month") return value.slice(0, 7);
    return value;
  };

  const tickerCategoryMap = {
    DAL: "Airlines",
    AAL: "Airlines",
    UAL: "Airlines",
    ABNB: "Tourism",
    BKNG: "Tourism",
    EXPE: "Tourism",
    PFE: "Health Impact",
    MRNA: "Health Impact",
  };

  return (
    <>
      <Navigation />

      <div className={styles.page}>
        <aside className={styles.sidebar}>
          <h2>Filters</h2>

          <FilterSection title="Date Range">
            <label>
              From
              <input
                type="date"
                value={filters.from}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, from: e.target.value }))
                }
              />
            </label>

            <label>
              To
              <input
                type="date"
                value={filters.to}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, to: e.target.value }))
                }
              />
            </label>
          </FilterSection>

          <FilterSection title="Interval">
            <label>
              Interval
              <select
                value={filters.interval}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, interval: e.target.value }))
                }
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </label>
          </FilterSection>

          <FilterSection title="Diseases">
            <DiseaseFilter
              value={filters.disease}
              onChange={(newDiseases) =>
                setFilters((f) => ({ ...f, disease: newDiseases }))
              }
            />
          </FilterSection>

          <FilterSection title="Species">
            <SpeciesFilter
              value={filters.species}
              onChange={(newSpecies) =>
                setFilters((f) => ({ ...f, species: newSpecies }))
              }
            />
          </FilterSection>

          <FilterSection title="Location">
            <LocationFilter
              value={filters.location}
              onChange={(newLocation) =>
                setFilters((f) => ({
                  ...f,
                  location: newLocation,
                }))
              }
            />
          </FilterSection>

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
            <div>
              <h1>{modeConfig.pageTitle}</h1>
              <p className={styles.subtitle}>{modeConfig.subtitle}</p>

              <div className={styles.modeToggle}>
                <button
                  type="button"
                  className={`${styles.modeButton} ${
                    mode === "finance" ? styles.modeButtonActive : ""
                  }`}
                  onClick={() => setMode("finance")}
                >
                  Finance mode
                </button>

                <button
                  type="button"
                  className={`${styles.modeButton} ${
                    mode === "travel" ? styles.modeButtonActive : ""
                  }`}
                  onClick={() => setMode("travel")}
                >
                  Travel advisory mode
                </button>
              </div>
            </div>

            <div className={styles.addTicker}>
              <input
                type="text"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value)}
                placeholder="Add ticker e.g. DAL"
              />
              <button onClick={() => handleAddTicker()} disabled={loadingTicker}>
                {loadingTicker ? "Adding..." : "Add"}
              </button>
            </div>
          </div>

          <section className={styles.hero}>
            <div className={styles.heroLeft}>
              <h2>{modeConfig.heroTitle}</h2>
              <p>{modeConfig.heroDescription}</p>
            </div>

            <div className={styles.heroRight}>
              <h2>How to use</h2>
              <ol>
                {modeConfig.heroSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </section>

          {error ? <p className={styles.error}>{error}</p> : null}

          <section className={styles.panel}>
            <h2>Outbreak Trend Over Time</h2>

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
                    <Bar dataKey="cases" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p>No outbreak data loaded yet.</p>
            )}
          </section>

          <section className={styles.panel}>
            <h2>{modeConfig.categoryTitle}</h2>
            <p className={styles.subtitle}>
              {mode === "travel"
                ? "Select a category to explore how different parts of travel respond to outbreaks."
                : "Select a category to explore how different industries respond to outbreaks."}
            </p>

            <SectorTickerPicker
              modeConfig={modeConfig}
              selectedTickers={selectedTickers}
              onAddTicker={handleAddTicker}
            />
          </section>

          <section className={styles.panel}>
            <h2>{modeConfig.selectedTitle}</h2>
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
            <h2>{modeConfig.comparisonTitle}</h2>

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
            const { bestLag, bestCorr } = findBestLag(
              comparisonRows,
              ticker,
              maxLag
            );
            const currentTrend = getLatestCasesTrend(comparisonRows);

            const insight =
              mode === "travel"
                ? generateTravelInsightCard({
                    ticker,
                    trend: currentTrend,
                    correlation: bestCorr,
                    lag: bestLag,
                    interval: filters.interval,
                    category: tickerCategoryMap[ticker] || "Airlines",
                  })
                : generateFinanceInsightCard({
                    ticker,
                    trend: currentTrend,
                    correlation: bestCorr,
                    lag: bestLag,
                    interval: filters.interval,
                  });

            return (
              <section key={ticker} className={styles.panel}>
                <h2>{ticker} vs outbreak cases</h2>

                <p className={styles.correlation}>
                  Current lag ({lag}): {corr?.toFixed(2) || "N/A"}
                </p>

                <p>
                  Best lag: {bestLag ?? "N/A"} ({bestCorr?.toFixed(2) || "N/A"})
                </p>

                <div
                  className={`${styles.insightCard} ${
                    styles[insight.level.toLowerCase()]
                  }`}
                >
                  {/* Header */}
                  <div className={styles.header}>
                    <h3 className={styles.title}>✈️ {insight.title}</h3>
                    <span className={styles.badge}>
                      {insight.level} impact
                    </span>
                  </div>

                  {/* Summary */}
                  <p className={styles.summary}>{insight.summary}</p>

                  {/* Key info grid */}
                  <div className={styles.metaGrid}>
                    <div>
                      <span className={styles.metaLabel}>📊 Indicator</span>
                      <p>{insight.indicator}</p>
                    </div>

                    <div>
                      <span className={styles.metaLabel}>⏱ Typical delay</span>
                      <p>{insight.timing}</p>
                    </div>

                    <div>
                      <span className={styles.metaLabel}>📉 Outbreak trend</span>
                      <p>{insight.trendText}</p>
                    </div>
                  </div>

                  {/* Traveller guidance */}
                  <div className={styles.guidance}>
                    <strong>🧳 What this means for travellers</strong>

                    <p className={styles.message}>{insight.travellerMessage}</p>

                    <ul>
                      {insight.actions?.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
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
                          if (name === "Cases") return [`${value}`, name];
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
    </>
  );
}