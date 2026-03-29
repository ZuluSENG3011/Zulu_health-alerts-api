import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import CountryDetail from "./pages/CountryDetail/CountryDetail";
import DiseaseDetail from "./pages/DiseaseDetail/DiseaseDetail";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/country/:countryCode" element={<CountryDetail />} />
        <Route path="/disease/:diseaseName" element={<DiseaseDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
