import os
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

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
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)

        # Send welcome email via Brevo
        if user.email:
            configuration = sib_api_v3_sdk.Configuration()
            configuration.api_key['api-key'] = os.environ.get(
                'BREVO_API_KEY'
            )

            api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
                sib_api_v3_sdk.ApiClient(configuration)
            )

            img_base = (
                "https://raw.githubusercontent.com/"
                "ZuluSENG3011/Zulu_health-alerts-api/email_sender/"
            )

            html_content = (
                """
                <div style="background:#0c0f14; padding:40px 16px;
                font-family:'DM Sans',Arial,sans-serif;">
                <div style="max-width:640px; margin:0 auto;
                background:#111520; border:1px solid #1f2a3c;
                border-radius:16px; overflow:hidden;">

                    <div style="background:linear-gradient(135deg,#0d1b2e,#0a2340);
                    padding:40px; border-bottom:1px solid #1a2d47;">
                    <div style="display:inline-block;
                    background:rgba(0,180,255,0.1);
                    border:1px solid rgba(0,180,255,0.25);
                    border-radius:100px; padding:4px 12px; font-size:11px;
                    color:#4dc9f6; letter-spacing:0.08em;
                    text-transform:uppercase; margin-bottom:20px;">
                        &#9679; Zulu Health Alerts
                    </div>
                """
                f"<h1 style='font-size:28px; color:#e8f4ff; margin:0 0 12px;'>"
                f"Welcome, <span style='color:#00c8ff;'>{user.username}</span>!"
                f"</h1>"
                """
                    <p style="font-size:14px; line-height:1.7;
                    color:#7a9bb8; margin:0;">
                        Thanks for signing up! Here's what you can do next
                        with our Health Alert API, which reads disease
                        outbreaks from across the world.
                    </p>
                    </div>

                    <div style="padding:32px 40px 40px;">

                    <div style="margin-bottom:36px;">
                        <div style="display:flex; align-items:center;
                        gap:10px; margin-bottom:10px;">
                        <div style="width:28px; height:28px;
                        background:rgba(0,180,255,0.1);
                        border:1px solid rgba(0,180,255,0.2);
                        border-radius:8px; text-align:center;
                        line-height:28px; font-size:14px;">&#128200;</div>
                        <h2 style="font-size:16px; color:#c8dff0;
                        margin:0;">Analytics</h2>
                        </div>
                        <p style="font-size:13.5px; line-height:1.75;
                        color:#637d96; margin:0 0 16px;">
                        You can try out our market analytics page! Where we
                        compare global disease outbreaks to current market
                        indicators.
                        </p>
                """
                f"<img src='{img_base}zulu_1.png' alt='Analytics'"
                " width='560' style='width:100%; border-radius:10px;"
                " border:1px solid #1a2d47; display:block;'>"
                """
                    </div>

                    <hr style="border:none; border-top:1px solid #1a2a3d;
                    margin:0 0 36px;">

                    <div style="margin-bottom:36px;">
                        <div style="display:flex; align-items:center;
                        gap:10px; margin-bottom:10px;">
                        <div style="width:28px; height:28px;
                        background:rgba(0,180,255,0.1);
                        border:1px solid rgba(0,180,255,0.2);
                        border-radius:8px; text-align:center;
                        line-height:28px; font-size:14px;">&#127757;</div>
                        <h2 style="font-size:16px; color:#c8dff0;
                        margin:0;">World Map</h2>
                        </div>
                        <p style="font-size:13.5px; line-height:1.75;
                        color:#637d96; margin:0 0 16px;">
                        Our interactive world map shows global disease
                        severity by country on a visualised world map.
                        </p>
                """
                f"<img src='{img_base}zulu_2.png' alt='World Map'"
                " width='560' style='width:100%; border-radius:10px;"
                " border:1px solid #1a2d47; display:block;'>"
                """
                    </div>

                    <hr style="border:none; border-top:1px solid #1a2a3d;
                    margin:0 0 36px;">

                    <div style="margin-bottom:36px;">
                        <div style="display:flex; align-items:center;
                        gap:10px; margin-bottom:10px;">
                        <div style="width:28px; height:28px;
                        background:rgba(0,180,255,0.1);
                        border:1px solid rgba(0,180,255,0.2);
                        border-radius:8px; text-align:center;
                        line-height:28px; font-size:14px;">&#129302;</div>
                        <h2 style="font-size:16px; color:#c8dff0;
                        margin:0;">Chat Box</h2>
                        </div>
                        <p style="font-size:13.5px; line-height:1.75;
                        color:#637d96; margin:0 0 16px;">
                        Our AI chat box will answer all your questions.
                        </p>
                """
                f"<img src='{img_base}zulu_3.png' alt='Chat Box'"
                " width='560' style='width:100%; border-radius:10px;"
                " border:1px solid #1a2d47; display:block;'>"
                """
                    </div>

                    <hr style="border:none; border-top:1px solid #1a2a3d;
                    margin:0 0 36px;">

                    <p style="font-size:13px; color:#506070; margin:0;">
                        And many more features to explore on our team's
                        global Health API.
                        <strong style="color:#4dc9f6;">
                        Happy exploring!
                        </strong>
                    </p>

                    </div>

                    <div style="background:#0d1220;
                    border-top:1px solid #1a2a3d; padding:20px 40px;">
                    <span style="font-size:13px; font-weight:700;
                    color:#2e4d6a;">ZULU HEALTH ALERTS</span>
                    <span style="font-size:11px; color:#253a52;
                    float:right;">You're receiving this because you
                    just signed up.</span>
                    </div>

                </div>
                </div>
                """
            )

            email = sib_api_v3_sdk.SendSmtpEmail(
                to=[{"email": user.email, "name": user.username}],
                sender={
                    "email": "zuluhealthapi@gmail.com",
                    "name": "Zulu Health Alerts",
                },
                subject="Welcome to Zulu Health Alerts API!",
                html_content=html_content,
            )

            try:
                api_instance.send_transac_email(email)
            except ApiException as e:
                print(f"Brevo email error: {e}")

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
    