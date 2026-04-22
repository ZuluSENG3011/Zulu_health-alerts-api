import { useState } from "react";
import styles from "./SearchBar.module.css";
import { useNavigate } from "react-router-dom";

const options = ["id", "disease", "species", "region", "location"];

function SearchBar() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(options[0]);
  const [searchValue, setSearchValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option) => {
    setSelected(option);
    setIsOpen(false);
  };

  const handleSearch = () => {
    if (!searchValue.trim()) return;

    const value = searchValue.trim();

    navigate(`/search?${selected}=${encodeURIComponent(value)}`);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.searchBar}>
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

        <input
          type="text"
          className={styles.searchInput}
          placeholder={`Search by ${selected.toLowerCase()}`}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />

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
