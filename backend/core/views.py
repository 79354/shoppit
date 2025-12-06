from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework import status

User = get_user_model()

@api_view(["POST"])
def signup_view(request):
    email = request.data.get("email")
    username = request.data.get("username")
    password = request.data.get("password")

    if not email or not password:
        return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({"error": "User with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create(
        email=email,
        username=username,
        password=make_password(password)
    )

    return Response(
        {"message": "User created successfully!", "user": {"email": user.email, "username": user.username}},
        status=status.HTTP_201_CREATED
    )



@api_view(["POST"])
def signin_view(request):
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "No account found with this email."}, status=status.HTTP_404_NOT_FOUND)

    user = authenticate(request, email=email, password=password)
    if user is None:
        return Response({"error": "Incorrect password."}, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user)

    return Response({
        "message": "Login successful.",
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": {
            "email": user.email,
            "username": user.username
        }
    })