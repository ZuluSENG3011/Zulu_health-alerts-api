from django.urls import path
from . import views
from .views import get_alerts, stats_regions, stats_timeseries

urlpatterns = [
    path("", views.home, name="home"),
    path("alerts/", get_alerts, name="alerts"),
    path("stats/timeseries/", stats_timeseries, name="stats_timeseries"),
    path("stats/regions/", stats_regions, name="stats_regions"),
    path("stats/diseases/", views.stats_diseases, name="stats_diseases"),
    path(
        "summary/location/",
        views.region_summary_by_location_view,
        name="location_summary",
    ),
    path("summary/risklevel/", views.get_country_risk_levels, name="risk_level"),
    path("summary/region/", views.region_summary_by_region_view, name="region_summary"),
]
