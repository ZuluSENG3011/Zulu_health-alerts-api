from django.urls import path
from . import views
from .views import get_alerts, stats_regions, stats_timeseries
from .views import RegisterView, LoginView

urlpatterns = [
    path("", views.home, name="home"),
    path("alerts/", get_alerts, name="alerts"),
    path("stats/timeseries/", stats_timeseries, name="stats_timeseries"),
    path("stats/regions/", stats_regions, name="stats_regions"),
    path("stats/diseases/", views.stats_diseases, name="stats_diseases"),
    path("summary/region/", views.region_summary_view, name="region_summary"),
    path("auth/signup/", RegisterView.as_view(), name="signup"),
    path("auth/signin/", LoginView.as_view(), name="signin"),
]
