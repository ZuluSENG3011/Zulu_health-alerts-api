from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .serializers import SignupSerializer


@api_view(["POST"])
@permission_classes([AllowAny])
def signup_view(request):
    """
    Register a new user account.

    This endpoint:
    - validates input using SignupSerializer
    - creates a new Django User
    - generates an authentication token for the user

    Request Body:
        {
            "username": "...",
            "email": "...",
            "password": "..."
        }

    Returns:
        201: User successfully created with token
        400: Validation errors
    """
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "message": "User created successfully.",
                "token": token.key,
                "user": {
                    "username": user.username,
                    "email": user.email,
                },
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """
    Authenticate an existing user and return an auth token.

    This endpoint:
    - verifies username and password using Django authentication
    - returns an existing or new token

    Request Body:
        {
            "username": "...",
            "password": "..."
        }

    Returns:
        200: Login successful with token
        401: Invalid credentials
    """
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)
    if user is None:
        return Response(
            {"detail": "Invalid username or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {
            "message": "Login successful.",
            "token": token.key,
            "user": {
                "username": user.username,
                "email": user.email,
            },
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    user: User = request.user
    return Response(
        {
            "username": user.username,
            "email": user.email,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    request.user.auth_token.delete()
    return Response({"message": "Logged out successfully."})
