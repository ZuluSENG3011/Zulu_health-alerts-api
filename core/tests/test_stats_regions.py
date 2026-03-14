from datetime import date, timedelta

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class StatsRegionsTests(APITestCase):
    fixtures = ["alerts.json"]

    def test_stats_regions_returns_200(self):
        response = self.client.get(reverse("stats_regions"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("from", response.data)
        self.assertIn("to", response.data)
        self.assertIn("by_region", response.data)
