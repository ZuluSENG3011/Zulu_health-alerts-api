import { useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./FilterPanel.module.css";
import filterIcon from "../assets/filter.png";

// Default open or closed state for each filter section.
const defaultSections = {
  dateRange: true,
  network: false,
  diseases: false,
  species: false,
  location: false,
  region: false,
};

/**
 * FilterPanel displays filters for the search result page.
 *
 * It reads current filter values from the URL query parameters
 * and updates the URL when users change a filter.
 */
function FilterPanel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toDateRef = useRef(null);

  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [sections, setSections] = useState(defaultSections);

  // Read current filter values from URL query parameters.
  const filters = useMemo(
    () => ({
      from: searchParams.get("from") || "",
      to: searchParams.get("to") || "",
      disease: searchParams.get("disease") || "",
      species: searchParams.get("species") || "",
      continent: searchParams.get("region") || "",
      location: searchParams.get("location") || "",
    }),
    [searchParams],
  );

  // Open or close a filter section.
  const toggleSection = (sectionName) => {
    setSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  // Update URL query parameters when a filter value changes.
  const handleChange = (e) => {
    const { name, value } = e.target;
    const trimmedValue = value.trim();

    const params = new URLSearchParams(searchParams);

    let paramName = name;

    if (name === "continent") {
      paramName = "region";
    }

    if (trimmedValue) {
      if (name === "from" || name === "to") {
        params.set(paramName, trimmedValue);
      } else {
        params.set(paramName, trimmedValue.toLowerCase());
      }
    } else {
      params.delete(paramName);
    }

    // If start date is after end date, remove the invalid end date.
    if (name === "from") {
      const currentTo = params.get("to");
      if (currentTo && trimmedValue && currentTo < trimmedValue) {
        params.delete("to");
      }
    }

    // Prevent the end date from being earlier than the start date.
    if (name === "to") {
      const currentFrom = params.get("from");
      if (currentFrom && trimmedValue && trimmedValue < currentFrom) {
        params.set("to", currentFrom);
      }
    }

    navigate(`/search?${params.toString()}`);

    // After selecting start date, automatically focus the end date input.
    if (name === "from") {
      setTimeout(() => {
        toDateRef.current?.focus();
        toDateRef.current?.showPicker?.();
      }, 0);
    }
  };

  if (isPanelCollapsed) {
    return (
      <aside
        className={styles.collapsedPanel}
        onClick={() => setIsPanelCollapsed(false)}
      >
        <div className={styles.collapsedInner}>
          <img src={filterIcon} className={styles.headerIcon} alt="Filter" />
        </div>
      </aside>
    );
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <img src={filterIcon} className={styles.headerIcon} alt="Filter" />
          <span>Filters</span>
        </div>

        {/* Collapse the filter panel. */}
        <button
          type="button"
          className={styles.panelToggleButton}
          onClick={() => setIsPanelCollapsed(true)}
          aria-label="Collapse filter panel"
        >
          ‹
        </button>
      </div>

      {/* Date range filter section. */}
      <div className={styles.section}>
        <button
          type="button"
          className={styles.sectionHeader}
          onClick={() => toggleSection("dateRange")}
        >
          <span>Date Range</span>
          <span className={styles.arrow}>{sections.dateRange ? "⌃" : "⌄"}</span>
        </button>

        {sections.dateRange && (
          <div className={styles.sectionBody}>
            <div className={styles.dateRow}>
              <div className={styles.dateField}>
                <label className={styles.dateLabel}>Start date</label>
                <input
                  type="date"
                  name="from"
                  value={filters.from}
                  onChange={handleChange}
                  className={styles.dateInput}
                  aria-label="Start date"
                />
              </div>
              <div className={styles.dateField}>
                <label className={styles.dateLabel}>End date</label>
                <input
                  ref={toDateRef}
                  type="date"
                  name="to"
                  value={filters.to}
                  onChange={handleChange}
                  min={filters.from || undefined}
                  className={styles.dateInput}
                  aria-label="End date"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Disease filter section. */}
      <div className={styles.section}>
        <button
          type="button"
          className={styles.sectionHeader}
          onClick={() => toggleSection("diseases")}
        >
          <span>Diseases</span>
          <span className={styles.arrow}>{sections.diseases ? "⌃" : "⌄"}</span>
        </button>

        {sections.diseases && (
          <div className={styles.sectionBody}>
            <input
              type="text"
              name="disease"
              value={filters.disease}
              onChange={handleChange}
              placeholder="e.g. Cholera"
              className={styles.textInput}
              aria-label="Filter by disease"
            />
          </div>
        )}
      </div>

      {/* Species filter section. */}
      <div className={styles.section}>
        <button
          type="button"
          className={styles.sectionHeader}
          onClick={() => toggleSection("species")}
        >
          <span>Species</span>
          <span className={styles.arrow}>{sections.species ? "⌃" : "⌄"}</span>
        </button>

        {sections.species && (
          <div className={styles.sectionBody}>
            <input
              type="text"
              name="species"
              value={filters.species}
              onChange={handleChange}
              placeholder="e.g. Human"
              className={styles.textInput}
              aria-label="Filter by species"
            />
          </div>
        )}
      </div>

      {/* Location and continent filter section. */}
      <div className={styles.section}>
        <button
          type="button"
          className={styles.sectionHeader}
          onClick={() => toggleSection("location")}
        >
          <span>Location</span>
          <span className={styles.arrow}>{sections.location ? "⌃" : "⌄"}</span>
        </button>

        {sections.location && (
          <div className={styles.sectionBody}>
            <label className={styles.subLabel}>Continent</label>
            <input
              type="text"
              name="continent"
              value={filters.continent}
              onChange={handleChange}
              placeholder="e.g. Africa"
              className={styles.textInput}
              aria-label="Filter by continent"
            />
            <label className={styles.subLabel} style={{ marginTop: "12px" }}>
              Location
            </label>
            <input
              type="text"
              name="location"
              value={filters.location}
              onChange={handleChange}
              placeholder="e.g. Kenya"
              className={styles.textInput}
              aria-label="Filter by location"
            />
          </div>
        )}
      </div>

      {/* Reset buttons for default and full reset behaviour. */}
      <div className={styles.resetRow}>
        <button
          type="button"
          className={styles.resetButton}
          onClick={() => {
            const today = new Date();
            const from = new Date(today);
            from.setMonth(today.getMonth() - 6);
            navigate(`/search?from=${from.toISOString().split("T")[0]}`);
          }}
        >
          Reset Filters
        </button>
        <span className={styles.resetHint}>defaults to last 6 months</span>
        <button
          type="button"
          className={styles.fullResetButton}
          onClick={() => navigate("/search")}
        >
          full reset — loads all time data
        </button>
      </div>
    </aside>
  );
}

export default FilterPanel;
