import subprocess
import json
import os
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def hello_world(request):
    return Response({"message": "Hello World!", "status": "success"})


@api_view(["GET"])
def simple_scrapy_test(request):
    scraper_path = os.path.join(os.getcwd(), "scraper")

    try:
        output = subprocess.check_output(
            ["scrapy", "crawl", "example", "--nolog", "-o", "-:json"],
            cwd=scraper_path,
            stderr=subprocess.STDOUT,
        )

        data = json.loads(output)
        return Response(data)

    except subprocess.CalledProcessError as e:
        return Response(
            {"error": "Scrapy failed", "detail": e.output.decode()}, status=500
        )
