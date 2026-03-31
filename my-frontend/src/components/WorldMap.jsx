import { useNavigate } from "react-router-dom";
import WorldMap from "react-svg-worldmap";
import { countryData } from "../data/mockData.js";
import styles from "./WorldMap.module.css";

function WorldMapComponent() {
  const navigate = useNavigate();

  const data = Object.keys(countryData).map((code) => ({
    country: code.toLowerCase(),
    value: countryData[code].diseases.length,
  }));

  const handleClick = (country) => {
    const code = country.countryCode?.toUpperCase();
    if (code && countryData[code]) {
      navigate(`/country/${code}`);
    }
  };

  return (
    <div className={styles.worldmapWrapper}>
      <WorldMap data={data} size={1070} onClickFunction={handleClick} />
    </div>
  );
}

export default WorldMapComponent;
