from django.urls import path
from . import views

urlpatterns = [
    path("hello/", views.hello_world),
    path("search-def/", views.simple_scrapy_test, name="search_def"),
]
