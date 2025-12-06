import uuid
from django.db import models
from django.conf import settings
from django.utils.text import slugify

# Create your models here.
class Product(models.Model):
    CATEGORIES = (
        ("books", "Books"),
        ("sports", "Sports"),
        ("home_and_garden", "Home and Garden"),
        ("health_and_beauty", "Health and Beauty"),
        ("toys_and_games", "Toys and Games"),
        ("clothing", "Clothing"),
        ("electronics", "Electronics"),
        ("food", "Food")
    )

    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    sku = models.CharField(max_length=50, unique=True)
    category = models.CharField(max_length=50, choices=CATEGORIES, blank=True, null=True)  # increased length
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=0)
    featured = models.BooleanField(default=False)
    minimumStock = models.PositiveIntegerField(default=10)
    image = models.ImageField(upload_to='product_images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


    def save(self, *args, **kwargs):
        # Always regenerate slug when name changes
        base_slug = slugify(self.name)
        slug = base_slug
        counter = 1
        while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
    

class Cart(models.Model):
    cart_code = models.CharField(max_length=100, unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.cart_code


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="cartitems")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="item")
    quantity = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} x {self.product.name} in cart {self.cart.cart_code}"
    


class Order(models.Model):
    STATUS = (
        ("success", "Success"),
        ("failed", "Failed"), 
        ("pending", "Pending"), 
        ("shipped", "Shipped"),
        ("delivered", "Delivered")
    )
    reference = models.CharField(max_length=64, unique=True, blank=True, null=True)
    sku = models.CharField(max_length=100, unique=True, blank=True, null=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders", blank=True, null=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS, default="pending")
    cart_code = models.CharField(max_length=100, unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def generate_unique_sku(self):
        prefix = "ORD"
        while True:
            uid = uuid.uuid4().hex[:6].upper()
            new_ref = f"{prefix}-{uid}"
            if not Order.objects.filter(sku=new_ref).exists():
                return new_ref

    def save(self, *args, **kwargs):
        if not self.sku:
            self.sku = self.generate_unique_sku()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"An order with reference {self.reference}"


class Orderitem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="orderitems")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="orderitem")
    quantity = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} x {self.product.name} in order {self.order.reference}"



class ShippingInfo(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="shipping_info")
    address = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.user.email} shipping address"



