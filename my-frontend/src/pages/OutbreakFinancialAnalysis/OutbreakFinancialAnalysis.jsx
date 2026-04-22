import { useState } from "react";
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

function getLatestCasesTrend(rows) {
  const validRows = rows.filter((row) => row.cases != null);

  if (validRows.length < 2) return null;

  const last = validRows[validRows.length - 1];
  const prev = validRows[validRows.length - 2];

  if (last.cases > prev.cases) return "increasing";
  if (last.cases < prev.cases) return "decreasing";
  return "flat";
}

export default function OutbreakFinancialAnalysis() {
  const modeConfig = MODE_CONFIG.travel;

  const [filters, setFilters] = useState({
    from: "2026-01-01",
    to: new Date().toISOString().slice(0, 10),
    interval: "week",
    disease: [],
    species: [],
    location: {
      continent: [],
      country: [],
    },
  });

  const [selectedTickers, setSelectedTickers] = useState([]);
  const [baseRows, setBaseRows] = useState([]);
  const [comparisonRows, setComparisonRows] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [loadingTicker, setLoadingTicker] = useState(null);
  const [error, setError] = useState("");

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
    } catch (err) {
      setError(err.message || "Failed to load outbreak data");
    } finally {
      setLoadingCases(false);
    }
  };

  const handleAddTicker = async (tickerOverride = "") => {
    const ticker = tickerOverride.trim().toUpperCase();

    if (!ticker) return;
    if (selectedTickers.includes(ticker)) return;

    if (!baseRows.length) {
      setError("Load outbreak data first.");
      return;
    }

    try {
      setLoadingTicker(ticker);
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
    } catch (err) {
      setError(err.message || "Failed to add ticker");
    } finally {
      setLoadingTicker(null);
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

          <button
            className={styles.loadButton}
            onClick={handleLoadCases}
            disabled={loadingCases}
          >
            {loadingCases ? "Loading..." : "Load outbreak data"}
          </button>
        </aside>

        <main className={styles.main}>
          <div className={styles.pageHeader}>
            <h1>{modeConfig.pageTitle}</h1>
            <p className={styles.subtitle}>{modeConfig.subtitle}</p>
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

          {error && <p className={styles.error}>{error}</p>}

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
              <p className={styles.emptyState}>
                No outbreak data loaded yet. Use the filters on the left to get started.
              </p>
            )}
          </section>

          <section className={styles.panel}>
            <h2>{modeConfig.categoryTitle}</h2>
            <p className={styles.subtitle}>
              Select a category to explore how different parts of travel respond to outbreaks.
            </p>

            <SectorTickerPicker
              modeConfig={modeConfig}
              selectedTickers={selectedTickers}
              onAddTicker={handleAddTicker}
              loadingTicker={loadingTicker}
            />
          </section>

          {selectedTickers.length > 0 && (
            <div className={styles.selectedBar}>
              <span className={styles.selectedLabel}>Showing:</span>
              {selectedTickers.map((ticker) => (
                <span key={ticker} className={styles.tickerChip}>
                  {ticker}
                  <button
                    onClick={() => handleRemoveTicker(ticker)}
                    className={styles.removeBtn}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {selectedTickers.map((ticker) => {
            const currentTrend = getLatestCasesTrend(comparisonRows);

            const insight = generateTravelInsightCard({
              ticker,
              trend: currentTrend,
              interval: filters.interval,
              category: tickerCategoryMap[ticker] || "Airlines",
            });

            return (
              <section key={ticker} className={styles.panel}>
                <h2 className={styles.tickerTitle}>{ticker} — Travel Impact</h2>

                <div className={styles.insightCard}>
                  <div className={styles.insightHeader}>
                    <h3 className={styles.title}>✈️ {insight.title}</h3>
                  </div>

                  <p className={styles.summary}>{insight.summary}</p>

                  <div className={styles.metaGrid}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>📊 Indicator</span>
                      <p className={styles.metaValue}>{insight.indicator}</p>
                    </div>

                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>📉 Outbreak trend</span>
                      <p className={styles.metaValue}>{insight.trendText}</p>
                    </div>
                  </div>

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