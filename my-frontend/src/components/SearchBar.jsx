import { useState } from "react";
import styles from "./SearchBar.module.css";
import { useNavigate } from "react-router-dom";

// Available search categories for filtering alerts.
const options = ["id", "disease", "species", "region", "location"];

/**
 * SearchBar allows users to choose a search category,
 * enter a search value, and navigate to the search results page.
 */
function SearchBar() {
  const navigate = useNavigate();

  const [selected, setSelected] = useState(options[0]);
  const [searchValue, setSearchValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Update the selected search category and close the dropdown.
  const handleSelect = (option) => {
    setSelected(option);
    setIsOpen(false);
  };

  // Navigate to the search page with the selected category and search value.
  const handleSearch = () => {
    if (!searchValue.trim()) return;

    const value = searchValue.trim();

    navigate(`/search?${selected}=${encodeURIComponent(value)}`);
  };

  // Allow users to press Enter to start searching.
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.searchBar}>
        {/* Dropdown for selecting the search category. */}
        <div className={styles.dropdownArea}>
          <button
            type="button"
            className={styles.dropdownButton}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className={styles.dropdownText}>{selected}</span>
            <span className={styles.arrow}>▼</span>
          </button>

          {isOpen && (
            <div className={styles.dropdownMenu}>
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => handleSelect(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.divider}></div>

        {/* Text input for the search value. */}
        <input
          type="text"
          className={styles.searchInput}
          placeholder={`Search by ${selected.toLowerCase()}`}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Button for starting the search. */}
        <button
          type="button"
          className={styles.searchButton}
          onClick={handleSearch}
          aria-label="Search"
        >
          🔍
        </button>
      </div>
    </div>
  );
}

export default SearchBar;
