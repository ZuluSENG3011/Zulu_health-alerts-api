from django.urls import path

from .views import login_view, logout_view, me_view, signup_view

urlpatterns = [
    path("signup/", signup_view, name="signup"),
    path("login/", login_view, name="login"),
    path("me/", me_view, name="me"),
    path("logout/", logout_view, name="logout"),
]
