import uuid
import json
import requests
from decimal import Decimal
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from google import genai
from django.conf import settings
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncMonth
from django.utils.timezone import now
from django.http import JsonResponse
from datetime import timedelta
from django.utils import timezone


import os

from storeapp.models import Cart, CartItem, Order, Orderitem, Product, ShippingInfo
from storeapp.serializers import CartItemSerializer, CartSerializer, OrderSerializer, ProductSerializer, ShippingInfoSerializer

# Configure Gemini
client = genai.Client()



MAX_IMAGE_SIZE_MB = 5
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png']
ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png']

FRONTEND_URL = "http://localhost:5173"

@api_view(['POST'])
def add_product(request):
    name = request.data.get("name")
    description = request.data.get("description")
    category = request.data.get("category")
    price = request.data.get("price")
    quantity = request.data.get("quantity")
    minimumStock = request.data.get("minimumStock")
    category = request.data.get("category")
    image = request.FILES.get("image")
    featured = request.data.get("featured") in ["true", "True", "1"]


    if image and image.size > MAX_IMAGE_SIZE_MB * 1024 * 1024:
            return Response({
                "error": "Image must not be larger than 5MB."
            }, status=400)

    # ✅ Validate image type by content type (MIME)
    if image:
        content_type = image.content_type
        ext = os.path.splitext(image.name)[1].lower()
        if content_type not in ALLOWED_IMAGE_TYPES or ext not in ALLOWED_EXTENSIONS:
            return Response({
                "error": "Only .jpg, .jpeg, and .png image types are allowed."
            }, status=400)

    # ✅ Generate SKU
    prefix = category[:3].upper() if category else "GEN"
    while True:
        uid = uuid.uuid4().hex[:6].upper()
        new_sku = f"{prefix}-{uid}"
        if not Product.objects.filter(sku=new_sku).exists():
            break

        
    product = Product.objects.create(
        name=name,
        category=category,
        description=description,
        price=price,
        quantity=quantity,
        minimumStock=minimumStock,
        image=image,
        sku=new_sku,
        featured = featured
    )

    serializer = ProductSerializer(product)
    return Response(serializer.data)



@api_view(["POST"])
def generate_product_description(request):
    product_name = request.data.get("name")

    if not product_name:
        return Response({"error": "Product name is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        prompt = f"Write a sleek and engaging product description (max 100 words) for a product called '{product_name}'."


        response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
        )

        description = response.text.strip()

        return Response({
            "name": product_name,
            "description": description
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    



@api_view(['GET'])
def get_products(request):
    search = request.query_params.get("search")
    products = Product.objects.all().order_by("-created_at")

    if search:
        products = products.filter(Q(name__icontains=search) | Q(category__icontains=search))
    else:
        products = products
    
    # ✅ Setup pagination
    paginator = PageNumberPagination()
    paginator.page_size = 8  # 8 products per page
    result_page = paginator.paginate_queryset(products, request)
    
    serializer = ProductSerializer(result_page, many=True)
    
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
def get_product(request, pk):
    product = get_object_or_404(Product, id=pk)
    serializer = ProductSerializer(product)
    return Response(serializer.data)


@api_view(['GET'])
def get_product_by_slug(request, slug):
    product = get_object_or_404(Product, slug=slug)
    serializer = ProductSerializer(product)
    return Response(serializer.data)



@api_view(['PUT', 'PATCH'])
def update_product(request, pk):
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response({"error": "Product not found."}, status=404)

    name = request.data.get("name", product.name)
    description = request.data.get("description", product.description)
    category = request.data.get("category", product.category)
    price = request.data.get("price", product.price)
    quantity = request.data.get("quantity", product.quantity)
    minimumStock = request.data.get("minimumStock", product.minimumStock)
    featured = request.data.get("featured", str(product.featured)) in ["true", "True", "1"]

    image = request.FILES.get("image", None)

    # ✅ Validate new image if provided
    if image:
        if image.size > MAX_IMAGE_SIZE_MB * 1024 * 1024:
            return Response({
                "error": "Image must not be larger than 5MB."
            }, status=400)

        content_type = image.content_type
        ext = os.path.splitext(image.name)[1].lower()
        if content_type not in ALLOWED_IMAGE_TYPES or ext not in ALLOWED_EXTENSIONS:
            return Response({
                "error": "Only .jpg, .jpeg, and .png image types are allowed."
            }, status=400)

        product.image = image  # update image only if provided

    # ✅ Update product fields
    product.name = name
    product.description = description
    product.category = category
    product.price = price
    product.quantity = quantity
    product.minimumStock = minimumStock
    product.featured = featured

    product.save()

    serializer = ProductSerializer(product)
    return Response(serializer.data, status=200)


@api_view(['DELETE'])
def delete_product(request, pk):
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

    product_name = product.name  # keep the name before deleting
    product.delete()
    return Response(
        {"message": f"Product '{product_name}' has been successfully deleted."},
        status=status.HTTP_204_NO_CONTENT
    )





@api_view(["POST"])
def add_to_cart(request):
    cart_code = request.data.get("cart_code")
    product_id = request.data.get("product_id")

    cart, created = Cart.objects.get_or_create(cart_code=cart_code)
    product = Product.objects.get(id=product_id)

    cartitem, created = CartItem.objects.get_or_create(product=product, cart=cart)
    cartitem.quantity = 1 
    cartitem.save() 

    serializer = CartSerializer(cart)
    return Response(serializer.data)


@api_view(["GET"])
def check_product_in_cart(request):
    cart_code = request.query_params.get("cart_code")
    product_id = request.query_params.get("product_id")

    if not cart_code or not product_id:
        return Response(
            {"error": "cart_code and product_id are required."},
            status=400
        )

    try:
        cart = Cart.objects.get(cart_code=cart_code)
    except Cart.DoesNotExist:
        return Response({"in_cart": False})

    # Check if product exists in cart
    in_cart = CartItem.objects.filter(cart=cart, product_id=product_id).exists()

    return Response({"in_cart": in_cart})



@api_view(['PUT'])
def increase_cartitem_quantity(request):
    cartitem_id = request.data.get("item_id")
    # quantity = request.data.get("quantity")

    # quantity = int(quantity)

    cartitem = CartItem.objects.get(id=cartitem_id)
    cartitem.quantity += 1
    cartitem.save()

    serializer = CartItemSerializer(cartitem)
    return Response({"data": serializer.data, "message": "Cartitem updated successfully!"})

@api_view(['PUT'])
def decrease_cartitem_quantity(request):
    cartitem_id = request.data.get("item_id")
    # quantity = request.data.get("quantity")

    # quantity = int(quantity)

    cartitem = CartItem.objects.get(id=cartitem_id)
    cartitem.quantity -= 1
    cartitem.save()

    serializer = CartItemSerializer(cartitem)
    return Response({"data": serializer.data, "message": "Cartitem updated successfully!"})



@api_view(['DELETE'])
def delete_cartitem(request, pk):
    try:
        cartitem = CartItem.objects.get(id=pk)
    except CartItem.DoesNotExist:
        return Response({"error": "Cartitem not found."}, status=status.HTTP_404_NOT_FOUND)

    product_name = cartitem.product.name  # keep the name before deleting
    cartitem.delete()
    return Response(
        {"message": f"Cartitem '{product_name}' has been successfully deleted."},
        status=status.HTTP_204_NO_CONTENT
    )



@api_view(["GET"])
def get_featured_products(request):
    products = Product.objects.filter(featured=True)
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)


# @api_view(['GET'])
# def get_all_products(request):
#     products = Product.objects.all()
#     serializer = ProductSerializer(products, many=True)
#     return Response(serializer.data)

@api_view(['GET'])
def get_all_products(request):
    search = request.query_params.get("search")
    category = request.query_params.get("category")
    products = Product.objects.all().order_by('-id')  # optional ordering

    if search:
        products = products.filter(Q(name__icontains=search) | Q(description__icontains=search))
    
    if category == "all":
        products = products
    else:
        products = products.filter(category=category)

    paginator = PageNumberPagination()
    paginator.page_size = 8  # 8 products per page
    paginated_products = paginator.paginate_queryset(products, request)

    serializer = ProductSerializer(paginated_products, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
def get_cart(request, cart_code):
    cart = get_object_or_404(Cart, cart_code=cart_code)
    serializer = CartSerializer(cart)
    return Response(serializer.data)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_or_update_shipping_info(request):
    """
    Create or update the authenticated user's shipping address.
    """
    user = request.user
    data = request.data

    # Validate required fields (optional but good practice)
    required_fields = ["firstName", "lastName", "email", "address", "city", "state", "zipCode"]
    for field in required_fields:
        if field not in data or not data[field]:
            return Response(
                {"error": f"{field} is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

    # Check if user already has a shipping info
    shipping_info, created = ShippingInfo.objects.get_or_create(user=user)

    # Update or set fields
    shipping_info.first_name = data.get("firstName", shipping_info.first_name)
    shipping_info.last_name = data.get("lastName", shipping_info.last_name)
    shipping_info.email = data.get("email", shipping_info.email)
    shipping_info.address = data.get("address", shipping_info.address)
    shipping_info.city = data.get("city", shipping_info.city)
    shipping_info.state = data.get("state", shipping_info.state)
    shipping_info.zip_code = data.get("zipCode", shipping_info.zip_code)
    shipping_info.save()

    response_data = {
        "message": "Shipping address created successfully" if created else "Shipping address updated successfully",
        "shipping_info": {
            "first_name": shipping_info.first_name,
            "last_name": shipping_info.last_name,
            "email": shipping_info.email,
            "address": shipping_info.address,
            "city": shipping_info.city,
            "state": shipping_info.state,
            "zip_code": shipping_info.zip_code,
        },
    }

    return Response(response_data, status=status.HTTP_200_OK)



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def initialize_payment(request):
    email = request.user.email
    cart_code = request.data.get("cart_code")

    if not email:
        return Response({"error": "User email not found"}, status=status.HTTP_400_BAD_REQUEST)

    cart = get_object_or_404(Cart, cart_code=cart_code)
    cartitems = cart.cartitems.all()

    # Compute cart total
    cart_total = sum([Decimal(item.product.price) * item.quantity for item in cartitems])
    tax = cart_total * Decimal("0.08")
    shipping_fee = Decimal("9.99")
    total_amount = cart_total + tax

    if cart_total <= 50:
        total_amount = total_amount + shipping_fee


    # Create order and order items
    order, created = Order.objects.get_or_create(user=request.user, cart_code=cart.cart_code)
    order.total_amount = total_amount
    order.save()

    for item in cartitems:
        orderitem, created = Orderitem.objects.get_or_create(order=order, product=item.product)
        orderitem.quantity = item.quantity
        orderitem.save()

    amount_in_kobo = int(total_amount * 100)

    url = "https://api.paystack.co/transaction/initialize"
    headers = {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "email": email,
        "amount": amount_in_kobo,
        # "currency": "USD",
        "callback_url": f"{FRONTEND_URL}/payment-status",
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        data = response.json()

        if response.status_code == 200 and data.get("status"):
            order.reference = data["data"]["reference"]
            order.save()

            return Response({
                "authorization_url": data["data"]["authorization_url"],
                "access_code": data["data"]["access_code"],
                "reference": data["data"]["reference"],
            }, status=status.HTTP_200_OK)

        return Response(data, status=response.status_code)

    except requests.exceptions.RequestException as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




@api_view(["GET"])
@permission_classes([IsAuthenticated])
def verify_payment(request, reference):
    """
    Verify a Paystack payment and update the order status.
    """
    url = f"https://api.paystack.co/transaction/verify/{reference}"
    headers = {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
    }

    try:
        response = requests.get(url, headers=headers)
        data = response.json()

        # Check if Paystack confirms success
        if response.status_code == 200 and data.get("data", {}).get("status") == "success":
            try:
                order = Order.objects.get(reference=reference, user=request.user)
            except Order.DoesNotExist:
                return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

            # ✅ Return early if order already marked as successful
            if order.status == "success":
                return Response({
                    "message": "Payment already verified previously",
                    "reference": reference,
                    "status": data["data"]["status"]
                }, status=status.HTTP_200_OK)

            # Mark as paid
            order.status = "success"
            order.save()

            # Delete the cart after successful payment
            cart = Cart.objects.filter(cart_code=order.cart_code).last()
            if cart:
                cart.delete()
            
            # Mark as paid
            # order.status = "success"
            # order.cart_code = ""
            # order.save()

            # ✅ Subtract quantities only once
            orderitems = order.orderitems.all()
            for item in orderitems:
                if item.product.quantity >= item.quantity:
                    item.product.quantity -= item.quantity
                    item.product.save()

            return Response({
                "message": "Payment verified successfully",
                "reference": reference,
                "amount": data["data"]["amount"] / 100,
                "currency": data["data"]["currency"],
                "payment_date": data["data"]["paid_at"],
                "status": data["data"]["status"]
            }, status=status.HTTP_200_OK)

        return Response({"error": "Payment not successful"}, status=status.HTTP_400_BAD_REQUEST)

    except requests.exceptions.RequestException as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)






# @api_view(["POST"])
# # @csrf_exempt
# def paystack_webhook(request):
#     event = json.loads(request.body)
#     if event["event"] == "charge.success":
#         reference = event["data"]["reference"]
#         try:
#             order = Order.objects.get(reference=reference)
#             order.is_paid = True
#             order.payment_status = "success"
#             order.save()
#         except Order.DoesNotExist:
#             pass
#     return Response(status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_shipping_address(request):
    shipping_address = ShippingInfo.objects.get(user=request.user)
    serializer = ShippingInfoSerializer(shipping_address)
    return Response(serializer.data)





@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_analytics_data(request):
    """
    Return key analytics data for the admin dashboard.
    """

    # ---- 1️⃣  Key Metrics ----
    total_revenue = (
        Order.objects.filter(status="success").aggregate(total=Sum("total_amount"))["total"] or 0
    )
    total_orders = Order.objects.filter(status="success").count()

    average_order_value = (
        total_revenue / total_orders if total_orders > 0 else 0
    )

    conversion_rate = 3.2  # placeholder — later can be calculated based on traffic data if tracked

    # ---- 2️⃣  Monthly Sales Chart ----
    monthly_sales = (
        Order.objects.filter(status="success")
        .annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(
            sales=Sum("total_amount"),
            orders=Count("id"),
        )
        .order_by("month")
    )

    sales_data = [
        {
            "month": m["month"].strftime("%b"),
            "sales": float(m["sales"]),
            "orders": m["orders"],
        }
        for m in monthly_sales
    ]

    # ---- 3️⃣  Category Distribution (Pie Chart) ----
    category_data = (
        Product.objects.values("category")
        .annotate(value=Count("id"))
        .order_by("-value")
    )

    category_result = []
    colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#00C49F", "#FFBB28", "#FF8042"]
    for idx, c in enumerate(category_data):
        category_result.append({
            "name": c["category"].replace("_", " ").title() if c["category"] else "Uncategorized",
            "value": c["value"],
            "color": colors[idx % len(colors)],
        })

    # ---- 4️⃣  Top Products ----
    top_products = (
        Orderitem.objects
        .values("product__name", "product__price")
        .annotate(sold=Sum("quantity"))
        .order_by("-sold")[:5]
    )

    top_products_data = [
        {
            "name": item["product__name"],
            "sold": item["sold"],
            "revenue": float(item["product__price"]) * item["sold"],
        }
        for item in top_products
    ]

    # ---- ✅ Combine & Return ----
    data = {
        "metrics": {
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "average_order_value": average_order_value,
            "conversion_rate": conversion_rate,
        },
        "sales_data": sales_data,
        "category_data": category_result,
        "top_products": top_products_data,
    }

    return Response(data)


def admin_dashboard_stats(request):
    # Total products
    total_products = Product.objects.count()

    # Total orders
    total_orders = Order.objects.count()

    # Total revenue (sum of successful orders)
    total_revenue = Order.objects.filter(status="success").aggregate(total=Sum("total_amount"))["total"] or 0

    # Low stock products (below 10 units)
    low_stock_products = Product.objects.filter(quantity__lt=10).values(
        "id", "name", "category", "quantity"
    )

    # Recent orders (latest 5)
    recent_orders = (
        Order.objects.order_by("-created_at")
        .values("id", "sku", "total_amount", "status", "created_at")[:5]
    )

    data = {
        "total_products": total_products,
        "total_orders": total_orders,
        "total_revenue": float(total_revenue),
        "growth_rate": "+12.5%",  # you can compute this later dynamically
        "low_stock_products": list(low_stock_products),
        "recent_orders": list(recent_orders),
    }

    return JsonResponse(data)



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_orders(request):
    orders = Order.objects.filter(user=request.user).order_by("-created_at")  # latest first

    # Pagination setup
    paginator = PageNumberPagination()
    paginator.page_size = 5
    paginated_orders = paginator.paginate_queryset(orders, request)

    serializer = OrderSerializer(paginated_orders, many=True)

    return paginator.get_paginated_response(serializer.data)



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_all_orders(request):

    status = request.query_params.get("status")
    sku = request.query_params.get("sku")
    orders = Order.objects.all().order_by("-created_at")  # latest first

    if sku:
        sku = sku.strip()
        orders = orders.filter(sku__iexact=sku)


    if status:
        if status == "all":
            orders = orders
        else:
            orders = orders.filter(status=status)

    # Pagination setup
    paginator = PageNumberPagination()
    paginator.page_size = 10
    paginated_orders = paginator.paginate_queryset(orders, request)

    serializer = OrderSerializer(paginated_orders, many=True)

    return paginator.get_paginated_response(serializer.data)



@api_view(['PUT'])
def update_order_status(request, pk):
    order = get_object_or_404(Order, id=pk)
    status = request.data.get("status", order.status)
    order.status = status 
    order.save()
    serializer = OrderSerializer(order)
    return Response(serializer.data)


@api_view(['DELETE'])
def delete_order(request, pk):
    order = get_object_or_404(Order, id=pk)

    # Calculate how long the order has existed
    order_age = timezone.now() - order.created_at

    # Check conditions
    if order.status != "pending":
        return Response(
            {"error": "Only pending orders can be deleted."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if order_age < timedelta(days=7):
        return Response(
            {"error": "Orders can only be deleted after 7 days."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # If all checks pass, delete the order
    order.delete()
    return Response(
        {"message": "Order deleted successfully."},
        status=status.HTTP_204_NO_CONTENT
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_is_admin(request):
    user = request.user
    return Response({"is_admin": user.is_staff or user.is_superuser})



@api_view(["GET"])
def user_is_logged_in(request):
    user = request.user
    if user.is_authenticated:
        return Response({"is_logged_in": True, "email": user.email, "username": user.username})
    return Response({"is_logged_in": False}, status=status.HTTP_401_UNAUTHORIZED)