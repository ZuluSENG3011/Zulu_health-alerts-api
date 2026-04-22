from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token


class SignupTests(APITestCase):
    def setUp(self):
        self.url = reverse("signup")

    def test_signup_success(self):
        data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "strongpassword123",
        }
        response = self.client.post(self.url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["username"], "testuser")

    def test_signup_invalid_data(self):
        data = {
            "username": "",
            "email": "not-an-email",
            "password": "123",
        }
        response = self.client.post(self.url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_duplicate_username(self):
        User.objects.create_user(
            username="testuser",
            email="test@test.com",
            password="pass123",
        )

        data = {
            "username": "testuser",
            "email": "new@test.com",
            "password": "newpass123",
        }
        response = self.client.post(self.url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTests(APITestCase):
    def setUp(self):
        self.url = reverse("login")
        self.user = User.objects.create_user(
            username="testuser",
            email="test@test.com",
            password="password123",
        )

    def test_login_success(self):
        response = self.client.post(self.url, {
            "username": "testuser",
            "password": "password123",
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["username"], "testuser")

    def test_login_invalid_password(self):
        response = self.client.post(self.url, {
            "username": "testuser",
            "password": "wrongpassword",
        })

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user(self):
        response = self.client.post(self.url, {
            "username": "doesnotexist",
            "password": "password123",
        })

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class MeTests(APITestCase):
    def setUp(self):
        self.url = reverse("me")
        self.user = User.objects.create_user(
            username="testuser",
            email="test@test.com",
            password="password123",
        )
        self.token = Token.objects.create(user=self.user)

    def test_me_authenticated(self):
        auth_header = f"Token {self.token.key}"
        self.client.credentials(HTTP_AUTHORIZATION=auth_header)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "testuser")

    def test_me_unauthenticated(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class LogoutTests(APITestCase):
    def setUp(self):
        self.url = reverse("logout")
        self.user = User.objects.create_user(
            username="testuser",
            password="password123",
        )
        self.token = Token.objects.create(user=self.user)

    def test_logout_success(self):
        auth_header = f"Token {self.token.key}"
        self.client.credentials(HTTP_AUTHORIZATION=auth_header)

        response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertFalse(Token.objects.filter(user=self.user).exists())

    def test_logout_unauthenticated(self):
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
