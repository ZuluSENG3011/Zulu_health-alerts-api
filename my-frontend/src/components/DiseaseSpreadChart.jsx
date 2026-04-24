import { useEffect, useRef, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { getDiseaseStats } from "../api/alerts";
import styles from "./DiseaseSpreadChart.module.css";

// Pie chart colour list.
const COLORS = [
  "#255ad4",
  "#889aeb",
  "#e53e3e",
  "#f6ad55",
  "#48bb78",
  "#38b2ac",
  "#ed64a6",
  "#9f7aea",
  "#667eea",
];

const RADIAN = Math.PI / 180;

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  name,
  percent,
}) => {
  // Hide very small labels to keep the chart readable.
  if (percent <= 0.03) return null;

  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);

  // Start point of the connector line.
  const sx = cx + (outerRadius + 6) * cos;
  const sy = cy + (outerRadius + 6) * sin;

  // Middle bend point of the connector line.
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;

  // End point of the connector line and label position.
  const ex = mx + (cos >= 0 ? 1 : -1) * 24;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke="#999"
        fill="none"
        strokeWidth={1}
      />
      <circle cx={ex} cy={ey} r={2} fill="#999" />
      <text
        x={ex + (cos >= 0 ? 4 : -4)}
        y={ey}
        textAnchor={textAnchor}
        dominantBaseline="central"
        fontSize={11}
        fill="#333"
      >
        {name}
      </text>
    </g>
  );
};

/**
 * Pie chart to show the distribution of diseases
 */
function DiseaseSpreadChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

  // Disable focus on internal SVG elements to avoid keyboard focus issues.
  useEffect(() => {
    if (!chartRef.current) return;
    const all = chartRef.current.querySelectorAll("*");
    all.forEach((el) => el.setAttribute("tabindex", "-1"));
  }, [data]);

  // Fetch disease statistics from the backend API.
  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getDiseaseStats();
        setData(result.by_disease);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch disease data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Show loading or error message before rendering the chart.
  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div
      className={styles.container}
      role="region"
      aria-label="Pie chart showing disease distribution over the last 30 days"
      tabIndex="0"
    >
      <h2 className={styles.title}>Top Diseases in the Last 30 Days</h2>
      <p className={styles.note}>
        Showing diseases that account for 2%+ of alerts. Many rarer diseases are
        not shown.
      </p>

      {/* Render the pie chart using disease count data. */}
      <div
        className={styles.chartWrapper}
        ref={chartRef}
        aria-hidden="true"
        tabIndex="-1"
      >
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="disease"
              cx="50%"
              cy="50%"
              outerRadius={150}
              labelLine={false}
              label={renderCustomLabel}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [value, name]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default DiseaseSpreadChart;
