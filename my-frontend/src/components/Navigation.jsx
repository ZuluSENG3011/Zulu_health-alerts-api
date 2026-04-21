import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import styles from "./Navigation.module.css";
import SearchBar from "./SearchBar";
import { getStoredUser, logoutUser } from "../api/auth";

const Navigation = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(getStoredUser());
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    const syncUser = () => {
      setUser(getStoredUser());
    };

    window.addEventListener("auth-changed", syncUser);
    window.addEventListener("storage", syncUser);

    syncUser();

    return () => {
      window.removeEventListener("auth-changed", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setDropdownOpen(false);
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const loggedIn = !!user;

  return (
    <nav className={styles.nav}>
      <div className={styles.navContent}>
        {/* left */}
        <div className={styles.leftSection}>
          <div className={styles.logoSection} onClick={() => navigate("/")}>
            <img src={logo} alt="logo" className={styles.logo} />
            <span className={styles.logoText}>Health Alert</span>
          </div>
          <SearchBar />
        </div>

        {/* right */}
        <div className={styles.rightSection}>
          <button
            className={styles.navButton}
            onClick={() => navigate("/search")}
          >
            Search
          </button>

          <button
            className={styles.navButton}
            onClick={() => navigate("/analysis/outbreak-financial")}
          >
            Analysis
          </button>

          <button className={styles.navButton} onClick={() => navigate("/")}>
            Home
          </button>

          {user && (
            <span className={styles.username}>
              Welcome, {user.username}
            </span>
          )}

          <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={styles.menuButton}
            >
              ☰
            </button>

            {dropdownOpen && (
              <div className={styles.dropdownMenu}>
                {!loggedIn ? (
                  <>
                    <button
                      onClick={() => {
                        navigate("/login");
                        setDropdownOpen(false);
                      }}
                      className={styles.dropdownItem}
                    >
                      Log in
                    </button>

                    <button
                      onClick={() => {
                        navigate("/signup");
                        setDropdownOpen(false);
                      }}
                      className={styles.dropdownItem}
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleLogout}
                    className={styles.dropdownItem}
                  >
                    Log out
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
