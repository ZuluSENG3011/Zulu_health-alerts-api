const FINANCIAL_BASE_URL =
  "https://b5hxtt8xp6.execute-api.ap-southeast-2.amazonaws.com/prod";

const FINANCIAL_API_KEY = import.meta.env.VITE_FINANCIAL_API_KEY;

export async function fetchFinancialData({ ticker, from, to }) {
  const params = new URLSearchParams({
    ticker,
    from,
    to,
  });

  const response = await fetch(
    `${FINANCIAL_BASE_URL}/retrieve/financial?${params.toString()}`,
    {
      headers: {
        accept: "application/json",
        "x-api-key": FINANCIAL_API_KEY,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch financial data");
  }

  return data;
}

export function normaliseFinancialEvents(data) {
  if (!data?.events || !Array.isArray(data.events)) {
    return [];
  }

  return data.events.map((event) => ({
    date: event.event_time_object.timestamp.slice(0, 10),
    ticker: event.event_attributes.ticker,
    close: event.event_attributes.close,
    volume: event.event_attributes.volume,
    open: event.event_attributes.open,
    high: event.event_attributes.high,
    low: event.event_attributes.low,
  }));
}
