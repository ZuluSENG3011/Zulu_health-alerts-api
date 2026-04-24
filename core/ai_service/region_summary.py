import json
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from pathlib import Path
import os

# import region_summary_api

from . import region_summary_api

BASE_DIR = Path(__file__).resolve().parent
DISEASE_INFO_JSON = BASE_DIR / "disease_info.json"

BASE_DIR2 = Path(__file__).resolve().parents[2]


def filter_start_date(window: str, today: date | None = None) -> date:
    """
    Convert a named time window into a concrete start date.

    Args:
        window (str): Time window label. Supported values:
            - "7day"
            - "1month"
            - "3month"
            - "6month"
        today (date | None): Reference end date. Defaults to today's date.

    Returns:
        date: Calculated start date.
    """
    if today is None:
        today = date.today()

    start_date = today
    if window == "7day":
        start_date = today - timedelta(7)
    elif window == "1month":
        start_date = today - relativedelta(months=1)
    elif window == "3month":
        start_date = today - relativedelta(months=3)
    elif window == "6month":
        start_date = today - relativedelta(months=6)

    return start_date


def filter_date(start_date: date | None, end_date: date | None, database: list) -> list:
    """
    Filter alerts by date range.

    Assumes the database is sorted by date in descending order.

    Args:
        start_date (date | None): Earliest date to include.
        end_date (date | None): Latest date to include.
        database (list): List of serialised alert dictionaries.

    Returns:
        list: Alerts within the requested date range.
    """
    beginning = str(start_date)
    ending = str(end_date)
    result = []

    for alert in database:
        alert_date = alert["fields"]["date"]

        if end_date and ending < alert_date:
            continue
        if start_date and alert_date < beginning:
            break
        result.append(alert)

    return result


def sort_database(database: list):
    return sorted(database, key=lambda a: a["fields"]["date"], reverse=True)


def find_by_every_location(database: list, location_str: str | None) -> list:
    chains = []

    if not location_str:
        return []

    for alert in database:
        location = alert["fields"]["locations"]

        for L in location:
            for index, part in enumerate(L):
                if part.lower() == location_str.lower():
                    chains.append(L[: index + 1])
                    break

    unique = set()
    result = []

    for a in chains:
        chain = ">".join(a)
        if chain not in unique:
            unique.add(chain)
            result.append(a)

    return result


def find_by_exact_location(database: list, location_chain: list) -> list:
    results = []
    for alert in database:
        location = alert["fields"]["locations"]
        # print(location)
        for L in location:
            if L == location_chain:
                results.append(alert)
                break

    return results


def find_by_upper_location(database: list, location_chain: list) -> list:
    chains = []
    results = []

    for i in range(len(location_chain), 0, -1):
        chains.append(location_chain[:i])

    for alert in database:
        location = alert["fields"]["locations"]
        for L in location:
            if L in chains:
                results.append(alert)
                break

    return results


def find_related_location(
    database: list, location_chain: list, exact_match: list | None = None
) -> list:
    """
    Find alerts related to a location but not exact matches.

    An alert is considered related if:
    - it is for a child location of the requested location, or
    - the requested location keyword appears in the title and the alert is
      within the same country.

    Args:
        database (list): List of serialised alerts.
        location_chain (list): Requested location hierarchy.
        exact_match (list | None): Exact matches to exclude from results.

    Returns:
        list: Related alerts without duplicates.
    """
    keyword = location_chain[-1].lower()
    country = location_chain[0].lower()

    unique = set()
    if exact_match:
        for alert in exact_match:
            unique.add(alert["fields"]["external_id"])

    results = []

    for alert in database:
        external_id = alert["fields"]["external_id"]
        if external_id in unique:
            continue

        location = alert["fields"]["locations"]
        matched = False

        for L in location:
            if (
                len(L) > len(location_chain)
                and L[: len(location_chain)] == location_chain
            ):
                matched = True
                break

        if not matched:
            title = alert["fields"]["title"].lower()
            if keyword in title:
                for L in location:
                    if len(L) > 0 and L[0].lower() == country:
                        matched = True
                        break

        if matched:
            results.append(alert)
            unique.add(external_id)

    return results


# database is required, one of location_chain and location_str is
# required, location_str should be the most precise region only e.g.
# Sydney


def filter_entry(
    end_date: date | None = None,
    window: str | None = None,
    start_date: date | None = None,
    location_chain: list | None = None,
    location_str: str | None = None,
    database: list | None = None,
) -> tuple[list, list | None]:

    if not database:
        raise ValueError("database is required")

    if not location_chain and not location_str:
        raise ValueError("location_chain or location_str is required")

    if end_date is None:
        end_date = date.today()

    if start_date is None and window is None:
        start_date = end_date

    if window is not None:
        start_date = filter_start_date(window, end_date)

    database = filter_date(start_date, end_date, database)

    if location_chain is None:
        chains = find_by_every_location(database, location_str)
        if not chains:
            return ["no location chain found"], None
        location_chain = chains[0]

    exact_match = find_by_exact_location(database, location_chain)
    related_match = find_related_location(database, location_chain, exact_match)

    return exact_match + related_match, location_chain


def extract_disease_name_from_result(result: list):
    disease_names = set()

    for alert in result:
        fields = alert.get("fields", {})
        diseases = fields.get("diseases", [])

        if not isinstance(diseases, list):
            continue

        for disease in diseases:
            if isinstance(disease, str) and disease.strip():
                disease_names.add(disease.strip())

    return disease_names


def search_disease_info_from_JSON(result: list):
    # disease_info_json = "disease_info.json"
    with open(DISEASE_INFO_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    disease_names = extract_disease_name_from_result(result)

    results = {}

    for disease in disease_names:
        if disease in data:
            results[disease] = data[disease]

    return results


def generate_summary_entry(
    database: list,
    end_date: date | None = None,
    window: str | None = None,
    start_date: date | None = None,
    location_chain: list | None = None,
    location_str: str | None = None,
):
    """
    Generate a complete AI summary response for a location.

    This function:
    1. filters alerts by date and location
    2. extracts disease metadata from local JSON cache
    3. calls Gemini to generate a structured regional summary
    4. returns the summary with the resolved location chain

    Args:
        database (list): Full alert database.
        end_date (date | None): Latest date to include.
        window (str | None): Named time window.
        start_date (date | None): Earliest date to include.
        location_chain (list | None): Full location hierarchy.
        location_str (str | None): Location string to resolve.

    Returns:
        dict: AI summary response and resolved location chain.
    """
    result, location_chain = filter_entry(
        end_date=end_date,
        window=window,
        start_date=start_date,
        location_chain=location_chain,
        location_str=location_str,
        database=database,
    )

    if not location_chain:
        return {"error": "relevant location chain not found in dataset"}

    diseases = search_disease_info_from_JSON(result)

    API_KEY = os.getenv("GEMINI_API_KEY")
    if API_KEY is None:
        return {"error": "API KEY is Missing"}

    AI = region_summary_api.GeminiSummary(API_KEY, model_id="gemini-3-flash-preview")
    # if not location_chain:
    #     return {"error": "Location not found"}

    response = AI.region_summary(result, location_chain, diseases)
    return {"summary": response, "location_chain": location_chain}


def find_by_location_prefix(database: list, prefix_chain: list) -> list:
    """
    Find alerts whose location starts with a given location prefix.

    Example:
        prefix_chain = ["China"]
        matches:
        - ["China", "Hong Kong"]
        - ["China", "Guangdong"]

    Args:
        database (list): List of serialised alerts.
        prefix_chain (list): Location hierarchy prefix to match.

    Returns:
        list: Matching alerts without duplicates.
    """
    results = []
    unique = set()

    for alert in database:
        external_id = alert["fields"]["external_id"]
        if external_id in unique:
            continue

        locations = alert.get("fields", {}).get("locations", [])
        for chain in locations:
            if (
                isinstance(chain, list)
                and len(chain) >= len(prefix_chain)
                and chain[: len(prefix_chain)] == prefix_chain
            ):
                results.append(alert)
                unique.add(external_id)
                break

    return results


if __name__ == "__main__":

    file = BASE_DIR2 / "scraper" / "scraper" / "alerts.json"
    with open(file, "r", encoding="utf-8") as f:
        database = json.load(f)

    generate_summary_entry(
        window="3month", location_str="New South Wales", database=database
    )
