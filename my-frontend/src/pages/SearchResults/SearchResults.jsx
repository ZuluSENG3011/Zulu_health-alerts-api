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

const SearchResults = () => {
  const [searchParams] = useSearchParams();

  const [resultData, setResultData] = useState({ alerts: [] });
  const [loading, setLoading] = useState(true);

  // current location for AI chatbot
  const currentLocation = searchParams.get("location") || "";

  // filters from URL search params
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

  // derive page title based on filters
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const today = new Date().toISOString().split("T")[0];

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

      <div className={styles.contentArea}>
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

        {currentLocation && <TravelInsightChatbot location={currentLocation} />}
      </div>
    </div>
  );
};

export default SearchResults;
