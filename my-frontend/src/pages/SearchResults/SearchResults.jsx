import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navigation from "../../components/Navigation";
import FilterPanel from "../../components/FilterPanel";
import ResultDisplay from "../../components/ResultDisplay";
import australiaData from "../../data/australiaMockData";
import allMockData from "../../data/allMockData";
import styles from "./SearchResults.module.css";

const filterTypes = ["id", "disease", "species", "region", "location"];

const fakeFetchResults = async (filters) => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  // if no filters, return all data
  if (Object.values(filters).every((arr) => arr.length === 0)) {
    return allMockData;
  }

  // fake australia
  if (
    filters.region.includes("oceania") ||
    filters.location.includes("australia") ||
    filters.disease.includes("avian influenza")
  ) {
    return australiaData;
  }

  return { alerts: [] };
};

const SearchResults = () => {
  const [searchParams] = useSearchParams();

  const [resultData, setResultData] = useState({ alerts: [] });
  const [loading, setLoading] = useState(true);

  // filters from URL search params
  const filters = useMemo(
    () => ({
      id: searchParams.getAll("id"),
      disease: searchParams.getAll("disease"),
      species: searchParams.getAll("species"),
      region: searchParams.getAll("region"),
      location: searchParams.getAll("location"),
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
        const data = await fakeFetchResults(filters);
        setResultData(data);
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

        <main className={styles.container}>
          {loading ? (
            <div className={styles.notFound}>Loading results...</div>
          ) : resultData?.alerts?.length > 0 ? (
            <ResultDisplay title={pageTitle} data={resultData} />
          ) : (
            <div className={styles.notFound}>No results found.</div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchResults;
