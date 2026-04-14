const BASE_URL = "https://x93rjdxbu4.ap-southeast-2.awsapprunner.com/api";

/**
 * multi-value query params
 */
function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    //
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== "") searchParams.append(key, v);
      });
    } else {
      searchParams.append(key, value);
    }
  });

  return searchParams.toString();
}

/**
 * request
 */
async function request(endpoint, params = {}) {
  const query = buildQuery(params);
  const url = query
    ? `${BASE_URL}${endpoint}?${query}`
    : `${BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }

  return res.json();
}

/* =========================
   ALERTS
========================= */
export const getAlerts = (filters = {}) => request("/alerts/", filters);

/* =========================
   STATS
========================= */
export const getDiseaseStats = (filters = {}) =>
  request("/stats/diseases/", filters);

export const getRegionStats = (filters = {}) =>
  request("/stats/regions/", filters);

export const getTimeseriesStats = (filters = {}) =>
  request("/stats/timeseries/", filters);

export function normaliseAlertTimeseries(data) {
  if (!data?.results || !Array.isArray(data.results)) {
    return [];
  }

  return data.results.map((item) => ({
    period: item.period,
    cases: item.count,
  }));
}

/* =========================
   SUMMARY
========================= */
export const getRegionSummary = ({ location, window, from, to }) => {
  if (!location) {
    throw new Error("location is required for summary API");
  }

  return request("/summary/region/", {
    location,
    window,
    from,
    to,
  });
};
