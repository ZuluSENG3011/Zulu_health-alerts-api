import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import SearchResults from "./pages/SearchResults/SearchResults";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OutbreakFinancialAnalysis from "./pages/OutbreakFinancialAnalysis/OutbreakFinancialAnalysis";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/travel-insights"
          element={<OutbreakFinancialAnalysis />}
        />
      </Routes>
    </BrowserRouter>
  );
}
