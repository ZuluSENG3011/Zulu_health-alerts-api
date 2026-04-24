from datetime import date
import os
from pathlib import Path

from . import region_summary
from . import region_summary_api

# import region_summary
# import region_summary_api

BASE_DIR = Path(__file__).resolve().parent
DISEASE_INFO_JSON = BASE_DIR / "disease_info.json"

BASE_DIR2 = Path(__file__).resolve().parents[2]


def find_by_region(database: list[dict], region: str) -> list:
    results = []
    for alert in database:
        regions = alert.get("fields", {}).get("regions", [])
        if any(
            isinstance(r, str) and r.strip().lower() == region.strip().lower()
            for r in regions
        ):
            results.append(alert)

    return results


def generate_region_summary_entry(
    region: str,
    database: list,
    end_date: date | None = None,
    window: str | None = None,
    start_date: date | None = None,
):
    """
    Generate an AI-powered summary for a broad geographic region.

    This function:
    1. validates input
    2. applies a date/window filter
    3. finds alerts matching the requested region
    4. loads disease metadata for those alerts
    5. calls Gemini to generate a structured risk summary

    Args:
        region (str): Region to summarise, e.g. "Asia" or "Europe".
        database (list): Full serialised alert database.
        end_date (date | None): Latest date to include.
        window (str | None): Named time window, e.g. "7day", "1month", "3month".
        start_date (date | None): Earliest date to include.

    Returns:
        dict: AI-generated summary and region list, or an error response.

    Raises:
        ValueError: If database or region is missing.
    """
    if not database:
        raise ValueError("database is required")

    if not region:
        raise ValueError("valid region is required")

    if end_date is None:
        end_date = date.today()

    if start_date is None and window is None:
        start_date = end_date
    if window is not None:
        start_date = region_summary.filter_start_date(window, end_date)

    database = region_summary.filter_date(start_date, end_date, database)

    exact_match = find_by_region(database, region)

    # print(exact_match)

    diseases = region_summary.search_disease_info_from_JSON(exact_match)

    API_KEY = os.getenv("GEMINI_API_KEY")
    if API_KEY is None:
        return {"error": "API KEY is Missing"}

    AI = region_summary_api.GeminiSummary(API_KEY, model_id="gemini-3-flash-preview")
    if not exact_match:
        return {"error": "relevant region not found in dataset"}

    region_list = [region]
    response = AI.region_summary(exact_match, region_list, diseases)
    return {"summary": response, "region": region_list}


# if __name__ == "__main__":

#     file = BASE_DIR2 / "scraper" / "scraper" / "alerts.json"
#     with open(file, "r", encoding="utf-8") as f:
#         database = json.load(f)

#     generate_region_summary_entry(
#         window="3month", region="Asia", database=database
#     )
