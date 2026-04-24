import json
from datetime import date
from pathlib import Path
import os

import random

from . import date_tools
from . import region_summary
from . import risk_level_api

# import date_tools
# import region_summary
# import risk_level_api

BASE_DIR = Path(__file__).resolve().parent
DISEASE_INFO_JSON = BASE_DIR / "disease_info.json"
RISK_LEVEL_JSON = BASE_DIR / "risk_level.json"

BASE_DIR2 = Path(__file__).resolve().parents[2]

DEFAULT_REFRESH_DATE = 14


def load_json(path: Path, default):
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    return default


def save_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def extract_all_countries(database: list[dict]) -> dict:
    """
    Extract country names from alert location chains.

    This function:
    - reads the first element of each location chain as the country
    - removes broad regions and non-country locations
    - normalises selected country aliases
    - stores the most recent alert date per country

    Args:
        database (list[dict]): List of serialised alert records.

    Returns:
        dict: Mapping of country name to metadata:
            {
                "Country": {
                    "last_alert_at": "YYYY-MM-DD"
                }
            }
    """
    countries: dict[str, dict] = {}
    # Exclude non-country entries and alternative names
    # that should be normalized to another country name.
    NOT_INCLUDE = {
        "Africa",
        "Americas",
        "Antarctica",
        "Asia",
        "Caribbean",
        "Central America",
        "Eastern Africa",
        "Europe",
        "European Union",
        "Latin America",
        "Middle East",
        "North Africa",
        "North America",
        "South America",
        "Southeast Asia",
        "Various",
        "West Africa",
        "Worldwide",
        "null",
        "American Samoa",
        "Bermuda",
        "Bermuda [UK]",
        "Cayman Islands",
        "Cayman Islands [UK]",
        "Cook Islands",
        "Falkland Islands",
        "Faroe Islands",
        "French Guiana",
        "French Polynesia",
        "Gibraltar",
        "Gibraltar [UK]",
        "Greenland [Denmark]",
        "Guam",
        "Guam [USA]",
        "Hong Kong",
        "Jersey",
        "Mayotte",
        "New Caledonia",
        "R\néunion",
        "Région d'outre-mer de Réunion, France",
        "Réunion",
        "Saint Martin [France/Netherlands]",
        "South Georgia and the South Sandwich Islands",
        "Svalbard and Jan Mayen",
        "Taiwan",
    }
    COUNTRY_ALIASES = {
        "Democratic Republic of the Congo": "DR Congo",
        "Congo, Democratic Republic of the Congo": "DR Congo",
        "Bahamas": "The Bahamas",
        "Cote d'Ivoire": "Ivory Coast",
        "Timor-Leste": "Timor Leste",
        "Türkiye": "Turkey",
        "Turkiye": "Turkey",
        "Czechia": "Czech Republic",
        "Palestinian Territory": "Palestine",
        "Macedonia": "North Macedonia",
        "Republic of Macedonia (FYROM)": "North Macedonia",
        "St. Lucia": "Saint Lucia",
        "The Gambia": "Gambia",
    }
    for alert in database:
        location = alert.get("fields", {}).get("locations", [])
        last_alert = alert.get("fields", {}).get("date", "")
        if not isinstance(last_alert, str):
            last_alert = ""

        for location_chain in location:
            if (
                not location_chain
                or not isinstance(location_chain[0], str)
                or not location_chain[0].strip()
            ):
                continue

            country = location_chain[0].strip()

            if country in COUNTRY_ALIASES:
                country = COUNTRY_ALIASES[country]
            if country not in NOT_INCLUDE:
                existing = countries.get(country, None)

                should_update = (
                    existing is None
                    or not existing["last_alert_at"]
                    or existing["last_alert_at"] < last_alert
                )

                if should_update:
                    countries[country] = {"last_alert_at": last_alert}

    return countries


def initialize_risk_level_json(database: list[dict]) -> None:
    """
    Create the initial risk_level.json cache file.

    Each detected country is inserted with empty risk data and marked as pending,
    so it can be processed by the AI risk-level updater later.

    Args:
        database (list[dict]): Full alert database.
    """
    early_date = date(1000, 1, 1)
    initialize = {
        "meta": {
            "date_to_refresh": DEFAULT_REFRESH_DATE,
            "last_processed_date": early_date.isoformat(),
        },
        "regions": {},
    }

    countries = extract_all_countries(database)
    for country, info in countries.items():
        random.randint(1, DEFAULT_REFRESH_DATE)
        # next_refresh = date_tools.initialize_refresh_date(
        # date.today(), DEFAULT_REFRESH_DATE)
        initialize["regions"][country] = {
            "risk_level": None,
            "reason": None,
            "supporting_alert_ids": [],
            "last_update": None,
            "last_alert_at": info["last_alert_at"],
            "next_refresh_at": date.today().isoformat(),
            "refresh_status": "pending",
        }

    save_json(RISK_LEVEL_JSON, initialize)


def get_new_alerts(database: list[dict], start_date: date) -> list:
    new_alerts = []
    for alert in database:
        alert_date = alert.get("fields", {}).get("date")
        if not isinstance(alert_date, str):
            continue
        if alert_date <= start_date.isoformat():
            break
        new_alerts.append(alert)

    return new_alerts


def filter_entry(country: str, database: list, window: str) -> list:
    end_date = date.today()
    start_date = region_summary.filter_start_date(window, end_date)
    database = region_summary.filter_date(start_date, end_date, database)
    location_chain = [country]
    country_match = region_summary.find_by_location_prefix(database, location_chain)
    return country_match


def process_response(response_raw) -> dict:
    """
    Validate and normalise the AI risk-level response.

    Accepts either:
    - dictionary response
    - JSON string response

    Args:
        response_raw: Raw response from Gemini.

    Returns:
        dict:
            Valid response:
            {
                "risk_level": "low|medium|high",
                "reason": "...",
                "supporting_alert_ids": [...]
            }

            Or error:
            {
                "error_msg": "..."
            }
    """
    if isinstance(response_raw, dict):
        data = response_raw
    elif isinstance(response_raw, str):
        try:
            data = json.loads(response_raw)
        except json.JSONDecodeError:
            return {"error_msg": "response is not valid JSON"}
    else:
        return {"error_msg": "response is not a dict or JSON string"}

    if not isinstance(data, dict):
        return {"error_msg": "response is not a valid JSON object"}

    risk_level = data.get("risk_level")
    if risk_level not in {"low", "medium", "high"}:
        return {"error_msg": "invalid or missing risk_level"}

    reason = data.get("reason")
    if not isinstance(reason, str) or not reason.strip():
        return {"error_msg": "invalid or missing reason"}

    supporting = data.get("supporting_alert_ids")
    if not isinstance(supporting, list):
        return {"error_msg": "invalid or missing supporting_alert_ids"}

    supporting_alert_ids = []
    for alert_id in supporting:
        if isinstance(alert_id, str) and alert_id.strip():
            supporting_alert_ids.append(alert_id.strip())
    supporting_alert_ids = supporting_alert_ids[:5]

    return {
        "risk_level": risk_level,
        "reason": reason.strip(),
        "supporting_alert_ids": supporting_alert_ids,
    }


def update_response_to_json(
    risk_level_json: dict,
    response: dict,
    country: str,
    info: dict,
    refresh_status: str = "success",
):
    next_update_date = date_tools.initialize_refresh_date(
        date.today(), DEFAULT_REFRESH_DATE
    )
    risk_level_json["regions"][country]["last_alert_at"] = info.get("last_alert_at", "")
    risk_level_json["regions"][country]["risk_level"] = response["risk_level"]
    risk_level_json["regions"][country]["reason"] = response["reason"]
    risk_level_json["regions"][country]["supporting_alert_ids"] = response[
        "supporting_alert_ids"
    ]
    risk_level_json["regions"][country]["last_update"] = date.today().isoformat()
    risk_level_json["regions"][country][
        "next_refresh_at"
    ] = next_update_date.isoformat()
    risk_level_json["regions"][country]["refresh_status"] = refresh_status
    return risk_level_json


def update_entry_risk_level(database: list[dict]) -> dict:
    risk_level = load_json(RISK_LEVEL_JSON, None)
    if not risk_level:
        return {"error_msg": "error in reading RISK LEVEL JSON"}
    start_date = risk_level.get("meta", {}).get("last_processed_date", "")
    try:
        start_date = date.fromisoformat(start_date)
    except ValueError:
        return {"error_msg": "invalid last_processed_date"}

    new_alerts = get_new_alerts(database, start_date)

    countries_need_update = extract_all_countries(new_alerts)

    today = date.today()
    all_country_names = set(risk_level.get("regions", {}).keys())

    for country, entry in risk_level.get("regions", {}).items():
        if country in countries_need_update:
            continue

        next_refresh_at = entry.get("next_refresh_at", "")
        refresh_status = entry.get("refresh_status", "")

        try:
            next_refresh_at = date.fromisoformat(next_refresh_at)
        except ValueError:
            next_refresh_at = today

        if refresh_status == "fail" or next_refresh_at <= today:
            countries_need_update[country] = {
                "last_alert_at": entry.get("last_alert_at", ""),
                "is_new_country": False,
            }

    API_KEY = os.getenv("GEMINI_API_KEY")
    if API_KEY is None:
        print("GEMINI_API_KEY not set")
        return {"error": "API KEY is Missing"}

    AI = risk_level_api.GeminiRiskLevel(API_KEY, model_id="gemini-3-flash-preview")

    for country, info in countries_need_update.items():
        if not isinstance(country, str):
            continue

        try:
            if "is_new_country" not in info:
                info["is_new_country"] = country not in all_country_names

            if info["is_new_country"]:
                risk_level["regions"][country] = {
                    "risk_level": None,
                    "reason": None,
                    "supporting_alert_ids": [],
                    "last_update": None,
                    "last_alert_at": info.get("last_alert_at", ""),
                    "next_refresh_at": today.isoformat(),
                    "refresh_status": "pending",
                }
                save_json(RISK_LEVEL_JSON, risk_level)

            relevant_alerts = filter_entry(
                window="3month", country=country, database=database
            )

            diseases_info = region_summary.search_disease_info_from_JSON(
                relevant_alerts
            )

            try:
                response = AI.risk_level(relevant_alerts, country, diseases_info)
            except Exception:
                if country in risk_level["regions"]:
                    risk_level["regions"][country]["refresh_status"] = "fail"
                    save_json(RISK_LEVEL_JSON, risk_level)
                continue

            risk_level_country = process_response(response)
            if "error_msg" in risk_level_country:
                print(risk_level_country["error_msg"])
                if country in risk_level["regions"]:
                    risk_level["regions"][country]["refresh_status"] = "fail"
                    save_json(RISK_LEVEL_JSON, risk_level)
                continue

            risk_level = update_response_to_json(
                risk_level, risk_level_country, country, info, refresh_status="success"
            )
            save_json(RISK_LEVEL_JSON, risk_level)

        except Exception as e:
            print(f"error in updating {country}: {e}")
            if country in risk_level["regions"]:
                risk_level["regions"][country]["refresh_status"] = "fail"
                save_json(RISK_LEVEL_JSON, risk_level)
            continue

    if new_alerts:
        latest_alert_date = new_alerts[0].get("fields", {}).get("date")
        if isinstance(latest_alert_date, str):
            risk_level["meta"]["last_processed_date"] = latest_alert_date
            save_json(RISK_LEVEL_JSON, risk_level)

    return risk_level


def get_country_risk_level_info(country_names: list[str]) -> dict:
    """
    Retrieve country risk-level information from the local cache.

    Args:
        country_names (list[str]): Countries requested by the API user.
            If empty, all country risk entries are returned.

    Returns:
        dict: Matching country risk entries, or error response.
    """
    risk_level = load_json(RISK_LEVEL_JSON, None)
    if not risk_level:
        return {"error_msg": "error in reading RISK LEVEL JSON"}

    regions = risk_level.get("regions", {})
    if not isinstance(regions, dict):
        return {"error_msg": "invalid regions in risk level json"}

    if not isinstance(country_names, list):
        return {"error_msg": "country_names must be a list"}

    if not country_names:
        return regions

    country_info = {}
    for country in country_names:
        if not isinstance(country, str):
            continue

        country = country.strip()
        if not country:
            continue

        if country not in regions:
            continue

        country_info[country] = regions[country]

    return country_info


if __name__ == "__main__":

    # file = BASE_DIR2 / "scraper" / "scraper" / "alerts.json"
    # with open(file, "r", encoding="utf-8") as f:
    #     database = json.load(f)

    # countries = initialize_risk_level_json(database)

    # # print(load_json(RISK_LEVEL_JSON, None))
    # print("update start")

    # update_entry_risk_level(database)
    # print(load_json(RISK_LEVEL_JSON, None))

    print(get_country_risk_level_info(["China", "BABBBC"]))
