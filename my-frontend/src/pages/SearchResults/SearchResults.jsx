import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navigation from "../../components/Navigation";
import FilterPanel from "../../components/FilterPanel";
import ResultDisplay from "../../components/ResultDisplay";
import TravelInsightChatbot from "../../components/TravelInsightChatbot";
import styles from "./SearchResults.module.css";
import { getAlerts } from "../../api/alerts";

const filterTypes = [
  "id",
  "disease",
  "species",
  "region",
  "location",
  "from",
  "to",
];

/**
 * SearchResults displays the filtered alert results page.
 *
 */
const SearchResults = () => {
  const [searchParams] = useSearchParams();

  // Store fetched alert results and loading state.
  const [resultData, setResultData] = useState({ alerts: [] });
  const [loading, setLoading] = useState(true);

  // Current location is used to show the AI chatbot only for location searches.
  const currentLocation = searchParams.get("location") || "";
  const chatbotResetKey = searchParams.toString();

  // Read filters from URL search params and convert them to lowercase.
  const filters = useMemo(
    () => ({
      id: searchParams.getAll("id").map((item) => item.toLowerCase()),
      disease: searchParams.getAll("disease").map((item) => item.toLowerCase()),
      species: searchParams.getAll("species").map((item) => item.toLowerCase()),
      region: searchParams.getAll("region").map((item) => item.toLowerCase()),
      location: searchParams
        .getAll("location")
        .map((item) => item.toLowerCase()),
      from: searchParams.get("from") || "",
      to: searchParams.get("to") || "",
    }),
    [searchParams],
  );

  // Create the page title based on the active filter.
  const pageTitle = useMemo(() => {
    if (filters.region.length > 0)
      return `Region: ${filters.region.join(", ")}`;
    if (filters.disease.length > 0)
      return `Disease: ${filters.disease.join(", ")}`;
    if (filters.species.length > 0)
      return `Species: ${filters.species.join(", ")}`;
    if (filters.location.length > 0)
      return `Location: ${filters.location.join(", ")}`;
    return "All Results";
  }, [filters]);

  // Fetch alert data whenever the URL filters change.
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const today = new Date().toISOString().split("T")[0];

        // If no date is selected, search from 1990 until today.
        const apiFilters = {
          ...filters,
          from: filters.from || "1990-01-01",
          to: filters.to || today,
        };

        const data = await getAlerts(apiFilters);

        setResultData({
          alerts: data.alerts || [],
        });
      } catch (error) {
        console.error("Failed to fetch results:", error);
        setResultData({ alerts: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return (
    <div className={styles.page}>
      <Navigation />

      {/* Accessibility link for keyboard users to skip directly to results. */}
      <a href="#main-content" className="skip-link">
        Skip to alerts
      </a>

      <div className={styles.contentArea}>
        {/* Filter panel updates the URL query parameters. */}
        <FilterPanel filterTypes={filterTypes} />

        <main id="main-content" className={styles.container}>
          {loading ? (
            <div className={styles.notFound}>Loading results...</div>
          ) : resultData?.alerts?.length > 0 ? (
            <ResultDisplay title={pageTitle} data={resultData} />
          ) : (
            <div className={styles.notFound}>No results found.</div>
          )}
        </main>

        {/* Show AI chatbot only when a location filter is selected. */}
        {currentLocation && (
          <TravelInsightChatbot
            location={currentLocation}
            resetKey={chatbotResetKey}
          />
        )}
      </div>
    </div>
  );
};

export default SearchResults;
