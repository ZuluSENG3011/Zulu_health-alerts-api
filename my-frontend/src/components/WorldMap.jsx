import { useEffect, useState } from "react";
import { getRiskLevelSummary } from "../api/alerts";
import { useNavigate } from "react-router-dom";
import WorldMap from "react-svg-worldmap";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import styles from "./WorldMap.module.css";

countries.registerLocale(enLocale);

const mapCountryToSearchName = (name) => {
  const aliasMap = {
    "People's Republic of China": "China",
    "United States of America": "United States",
    "Russian Federation": "Russia",
    "Republic of Korea": "South Korea",
    "Democratic People's Republic of Korea": "North Korea",
  };

  return aliasMap[name] || name;
};

const mapRiskLevelToValue = (riskLevel) => {
  const normalized = String(riskLevel || "").toLowerCase();

  if (normalized === "low") return 1;
  if (normalized === "medium") return 2;
  if (normalized === "high") return 3;

  return 0;
};

const mapValueToRiskLabel = (value) => {
  if (Number(value) === 1) return "Low";
  if (Number(value) === 2) return "Medium";
  if (Number(value) === 3) return "High";
  return "Unknown";
};

function WorldMapComponent() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    async function fetchRiskLevels() {
      try {
        setLoading(true);
        setError("");

        const riskData = await getRiskLevelSummary();

        // your API output is like: { countries: { "United States": {...}, ... } }
        const countriesObject = riskData?.countries || {};

        const mapData = Object.entries(countriesObject)
          .map(([countryName, info]) => {
            const normalizedCountryName = mapCountryToSearchName(countryName);
            const alpha2 = countries.getAlpha2Code(normalizedCountryName, "en");

            if (!alpha2) return null;

            return {
              country: alpha2.toLowerCase(),
              value: mapRiskLevelToValue(info?.risk_level),
            };
          })
          .filter(Boolean);

        setData(mapData);
      } catch (err) {
        setError(err.message || "Failed to fetch risk levels");
      } finally {
        setLoading(false);
      }
    }

    fetchRiskLevels();
  }, []);

  const handleClick = (country) => {
    const countryName = country.countryName;
    if (!countryName) return;

    const searchName = mapCountryToSearchName(countryName);
    navigate(`/search?location=${encodeURIComponent(searchName)}`);
  };

  if (loading) {
    return <div className={styles.worldmapWrapper}>Loading map...</div>;
  }

  if (error) {
    return <div className={styles.worldmapWrapper}>Error: {error}</div>;
  }

  return (
    <div className={styles.worldmapWrapper}>
      <div className={styles.mapHeader}>
        <h2 className={styles.title}>Disease Risk by Country</h2>
        <span className={styles.mapHint}>Click any country to explore its alerts</span>
      </div>
      <WorldMap
        data={data}
        color="#c0392b"
        backgroundColor="#dce8f5"
        defaultFill="#c8d6e5"
        size={1070}
        onClickFunction={handleClick}
        tooltipTextFunction={({ countryName, countryValue }) =>
          `${countryName}: ${mapValueToRiskLabel(countryValue)}`
        }
      />
      <div className={styles.legend}>
        <span className={styles.legendLabel}>Risk level:</span>
        <span className={styles.legendItem}>
          <span className={styles.legendSwatch} style={{ background: "#c8d6e5" }} /> No data
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendSwatch} style={{ background: "#e8a0a0" }} /> Low
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendSwatch} style={{ background: "#cd6155" }} /> Medium
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendSwatch} style={{ background: "#c0392b" }} /> High
        </span>
      </div>
    </div>
  );
}

export default WorldMapComponent;
