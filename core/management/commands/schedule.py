import os
import subprocess
import sys
from collections import Counter

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand

from core.models import Alert
from core.ai_service.disease_severity import generate_disease_severity_entry
from core.ai_service.risk_level_country import (
    RISK_LEVEL_JSON,
    initialize_risk_level_json,
    update_entry_risk_level,
)


class Command(BaseCommand):
    help = "run full update"

    def add_arguments(self, parser):
        parser.add_argument(
            "--mode",
            choices=["incremental", "backfill"],
            default="incremental",
        )
        parser.add_argument("--max-pages", type=int, default=None)

    def handle(self, *args, **options):
        mode = options["mode"]
        max_pages = options["max_pages"]

        scraper_root = settings.BASE_DIR / "scraper"
        alerts_json = scraper_root / "scraper" / "alerts.json"

        cmd = [
            sys.executable,
            "-m",
            "scrapy",
            "crawl",
            "example",
            "-a",
            f"mode={mode}",
            "-O",
            "scraper/alerts.json",
        ]

        if max_pages is not None:
            cmd.extend(["-a", f"max_pages={max_pages}"])

        print("run scrapy")
        subprocess.run(cmd, cwd=scraper_root, check=True)

        print("import alerts")
        call_command("import_alerts", file=str(alerts_json))

        alerts = Alert.objects.all().order_by("-date")

        database = []
        disease_counter = Counter()

        for alert in alerts:
            database.append(
                {
                    "fields": {
                        "external_id": alert.external_id,
                        "date": alert.date.isoformat(),
                        "title": alert.title,
                        "regions": alert.regions,
                        "diseases": alert.diseases,
                        "species": alert.species,
                        "locations": alert.locations,
                    }
                }
            )

            for disease in alert.diseases or []:
                if isinstance(disease, str) and disease.strip():
                    disease_counter[disease.strip()] += 1

        api_key = os.getenv("GEMINI_API_KEY")
        if api_key is None:
            print("GEMINI_API_KEY not set")
            return

        print("update disease info")
        ai_input = {
            "from": None,
            "to": None,
            "by_disease": [
                {"disease": disease, "count": count}
                for disease, count in disease_counter.most_common(200)
            ],
        }
        generate_disease_severity_entry(response_raw=ai_input, api_key=api_key)

        print("update risk level")
        if not RISK_LEVEL_JSON.exists():
            initialize_risk_level_json(database)

        update_entry_risk_level(database)

        print("full update finished")
