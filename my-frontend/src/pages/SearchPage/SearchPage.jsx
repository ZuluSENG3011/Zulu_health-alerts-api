import FilterPanel from "../../components/FilterPanel";
import Navigation from "../../components/Navigation";

function SearchPage() {
  return (
    <main>
      <Navigation />
      <div style={{ display: "flex" }}>
        <FilterPanel />

        <main style={{ flex: 1, padding: "20px" }}>Search result area</main>
      </div>
    </main>
  );
}

export default SearchPage;
