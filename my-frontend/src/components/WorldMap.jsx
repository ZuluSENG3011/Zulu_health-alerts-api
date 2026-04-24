import { useEffect, useRef, useState } from "react";
import { getRiskLevelSummary } from "../api/alerts";
import WorldMap from "react-svg-worldmap";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import styles from "./WorldMap.module.css";
import MapAIDetailCard from "./MapAIDetailCard";

// Convert contry names to ISO alpha-2 codes using i18n-iso-countries.
countries.registerLocale(enLocale);

// Map certain country names to their more common search names
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

// Map risk levels to numeric values for the world map
const mapRiskLevelToValue = (riskLevel) => {
  const normalized = String(riskLevel || "").toLowerCase();

  if (normalized === "low") return 1;
  if (normalized === "medium") return 2;
  if (normalized === "high") return 3;
  return 0;
};

// Map numeric risk values back to labels for tooltips
const mapValueToRiskLabel = (value) => {
  if (Number(value) === 1) return "Low";
  if (Number(value) === 2) return "Medium";
  if (Number(value) === 3) return "High";
  return "Unknown";
};

/**
 * WorldMapComponent to display risk level of diseases by country on an interactive world map.
 * Fetches risk level data from the backend and maps it to the world map using ISO country codes.
 */
function WorldMapComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [countryNames, setCountryNames] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const mapRef = useRef(null);

  // Not allowed the keyboard focus for SVG elements in tab
  useEffect(() => {
    if (!mapRef.current) return;
    const all = mapRef.current.querySelectorAll("*");
    all.forEach((el) => el.setAttribute("tabindex", "-1"));
  }, [data]);

  // Call backend API to fetch risk level
  // Convert into the format required by the world map component
  useEffect(() => {
    async function fetchRiskLevels() {
      try {
        setLoading(true);
        setError("");

        const riskData = await getRiskLevelSummary();
        const countriesObject = riskData?.countries || {};

        const mapData = Object.entries(countriesObject)
          .map(([countryName, info]) => {
            const normalizedCountryName = mapCountryToSearchName(countryName);
            const alpha2 = countries.getAlpha2Code(normalizedCountryName, "en");

            if (!alpha2) return null;

            return {
              country: alpha2.toLowerCase(),
              value: mapRiskLevelToValue(info?.risk_level),
              countryName: normalizedCountryName,
              riskLevel: info?.risk_level || "Unknown",
              aiSummary: info?.reason || "",
            };
          })
          .filter(Boolean);

        setData(mapData);
        setCountryNames(mapData.map((item) => item.countryName));
      } catch (err) {
        setError(err.message || "Failed to fetch risk levels");
      } finally {
        setLoading(false);
      }
    }

    fetchRiskLevels();
  }, []);

  const filteredCountries =
    searchQuery.length >= 2
      ? countryNames
          .filter((n) => n.toLowerCase().includes(searchQuery.toLowerCase()))
          .slice(0, 8)
      : [];

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
  };

  // Handle country selection from dropdown
  const handleCountrySelect = (name) => {
    const selected = data.find(
      (item) => item.countryName?.toLowerCase() === name.toLowerCase(),
    );

    setSelectedCountry(selected || null);
    setSearchQuery(name);
    setShowDropdown(false);
  };

  // Handle click on the world map
  const handleClick = (country) => {
    const countryName = country.countryName;
    if (!countryName) return;

    const searchName = mapCountryToSearchName(countryName);

    const selected = data.find(
      (item) => item.countryName?.toLowerCase() === searchName.toLowerCase(),
    );

    setSelectedCountry(selected || null);
  };

  // when map is loading
  if (loading) {
    return <div className={styles.worldmapWrapper}>Loading map...</div>;
  }

  // when there is an error fetching data
  if (error) {
    return <div className={styles.worldmapWrapper}>Error: {error}</div>;
  }

  return (
    <div className={styles.worldmapWrapper}>
      <div className={styles.mapHeader}>
        <h2 className={styles.title}>Disease Risk by Country</h2>

        <div className={styles.countrySearch}>
          <input
            type="text"
            placeholder="Search country..."
            value={searchQuery}
            onChange={handleSearchChange}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            className={styles.countrySearchInput}
            aria-label="Search for a country"
          />

          {showDropdown && filteredCountries.length > 0 && (
            <div className={styles.countryDropdown}>
              {filteredCountries.map((name) => (
                <button
                  key={name}
                  className={styles.countryDropdownItem}
                  onMouseDown={() => handleCountrySelect(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <MapAIDetailCard
        detail={selectedCountry}
        onClose={() => setSelectedCountry(null)}
      />

      <div ref={mapRef} aria-hidden="true">
        <WorldMap
          data={data}
          color="#c0392b"
          backgroundColor="#ffffff"
          defaultFill="#c8d6e5"
          size={1070}
          onClickFunction={handleClick}
          tooltipTextFunction={({ countryName, countryValue }) =>
            `${countryName}: ${mapValueToRiskLabel(countryValue)}`
          }
        />
      </div>

      <div className={styles.legend}>
        <span className={styles.legendLabel}>Risk level:</span>

        <span className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ background: "#c8d6e5" }}
          />
          No data
        </span>

        <span className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ background: "#e8a0a0" }}
          />
          Low
        </span>

        <span className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ background: "#cd6155" }}
          />
          Medium
        </span>

        <span className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ background: "#c0392b" }}
          />
          High
        </span>
      </div>
    </div>
  );
}

export default WorldMapComponent;
