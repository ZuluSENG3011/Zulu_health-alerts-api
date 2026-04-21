export const MODE_CONFIG = {
  finance: {
    key: "finance",
    pageTitle: "Outbreak vs Market Analysis",
    subtitle:
      "Explore how outbreaks may relate to company performance across different industries.",
    heroTitle: "Compare outbreaks with market indicators",
    heroDescription:
      "Load outbreak data, then add sector-based tickers to compare outbreak activity with stock performance over time.",
    heroSteps: [
      "Select outbreak filters on the left",
      "Load outbreak data",
      "Add a ticker or explore by industry",
      "Compare the chart, table, and correlation results",
    ],
    categoryTitle: "Explore by industry",
    selectedTitle: "Selected market indicators",
    comparisonTitle: "Market comparison",
    categories: {
      Travel: [
        { label: "DAL", ticker: "DAL" },
        { label: "AAL", ticker: "AAL" },
        { label: "UAL", ticker: "UAL" },
      ],
      Tourism: [
        { label: "ABNB", ticker: "ABNB" },
        { label: "BKNG", ticker: "BKNG" },
        { label: "EXPE", ticker: "EXPE" },
      ],
      Healthcare: [
        { label: "PFE", ticker: "PFE" },
        { label: "MRNA", ticker: "MRNA" },
      ],
    },
  },

  travel: {
    key: "travel",
    pageTitle: "Travel Impact Analysis",
    subtitle:
      "Explore how outbreaks may influence travel demand and disruptions.",
    heroTitle: "Understand travel disruption risk",
    heroDescription:
      "Explore how outbreak trends may affect flights, tourism activity, and travel confidence in a selected region.",
    heroSteps: [
      "Select outbreak filters on the left",
      "Load outbreak data",
      "Add a ticker or explore travel categories",
      "Review the travel impact insights",
    ],
    categoryTitle: "How outbreaks affect your trip",
    selectedTitle: "Selected travel indicators",
    comparisonTitle: "Travel impact comparison",
    categories: {
      Airlines: [
        { label: "Delta", ticker: "DAL" },
        { label: "American", ticker: "AAL" },
        { label: "United", ticker: "UAL" },
      ],
      Tourism: [
        { label: "Airbnb", ticker: "ABNB" },
        { label: "Booking", ticker: "BKNG" },
        { label: "Expedia", ticker: "EXPE" },
      ],
      "Health Impact": [
        { label: "Pfizer", ticker: "PFE" },
        { label: "Moderna", ticker: "MRNA" },
      ],
    },
  },
};