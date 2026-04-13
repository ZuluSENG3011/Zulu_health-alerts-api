from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .serializers import SignupSerializer


auth_header_param = openapi.Parameter(
    "Authorization",
    openapi.IN_HEADER,
    description="Token authentication header. Format: Token <your_token>",
    type=openapi.TYPE_STRING,
)

signup_body_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["username", "email", "password"],
    properties={
        "username": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Unique username for the new account.",
        ),
        "email": openapi.Schema(
            type=openapi.TYPE_STRING,
            format="email",
            description="Email address for the new account.",
        ),
        "password": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Password for the new account.",
        ),
    },
)

login_body_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["username", "password"],
    properties={
        "username": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Existing username.",
        ),
        "password": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Password for the account.",
        ),
    },
)


@swagger_auto_schema(
    method="post",
    operation_description="Create a new user account and return an authentication token.",
    tags=["auth"],
    request_body=signup_body_schema,
    responses={
        201: "User created successfully.",
        400: "Invalid signup data.",
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
def signup_view(request):
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


@swagger_auto_schema(
    method="post",
    operation_description="Authenticate a user and return an authentication token.",
    tags=["auth"],
    request_body=login_body_schema,
    responses={
        200: "Login successful.",
        401: "Invalid username or password.",
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
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


@swagger_auto_schema(
    method="get",
    operation_description="Return the currently authenticated user's profile.",
    tags=["auth"],
    manual_parameters=[auth_header_param],
    responses={
        200: "Current user returned successfully.",
        401: "Authentication credentials were not provided or are invalid.",
    },
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


@swagger_auto_schema(
    method="post",
    operation_description="Log out the currently authenticated user by deleting their token.",
    tags=["auth"],
    manual_parameters=[auth_header_param],
    responses={
        200: "Logout successful.",
        401: "Authentication credentials were not provided or are invalid.",
    },
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    request.user.auth_token.delete()
    return Response({"message": "Logged out successfully."})
