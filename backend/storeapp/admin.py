from django.contrib import admin
from .models import Order, Orderitem, Product, Cart, CartItem, ShippingInfo


class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'quantity', 'featured', 'created_at')
    list_filter = ('category', 'featured', 'created_at')
    search_fields = ('name', 'sku', 'category', 'description')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('-created_at',)
    list_editable = ('featured', 'price', 'quantity')


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 1
    autocomplete_fields = ('product',)


class CartAdmin(admin.ModelAdmin):
    list_display = ('cart_code', 'user', 'created_at', 'updated_at')
    search_fields = ('cart_code', 'user__username', 'user__email')
    list_filter = ('created_at',)
    inlines = [CartItemInline]


class CartItemAdmin(admin.ModelAdmin):
    list_display = ('cart', 'product', 'quantity')
    search_fields = ('cart__cart_code', 'product__name')
    list_filter = ('product__category',)


admin.site.register(Product, ProductAdmin)
admin.site.register(Cart, CartAdmin)
admin.site.register(CartItem, CartItemAdmin)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("reference", "user", "total_amount", "cart_code", "status", "created_at", "updated_at")
    list_filter = ("status", "created_at")
    search_fields = ("reference", "user__email")
    readonly_fields = ("reference", "created_at", "updated_at")
    ordering = ("-created_at",)


@admin.register(Orderitem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("order", "product", "quantity")
    list_filter = ("order__status",)
    search_fields = ("order__reference", "product__name")


@admin.register(ShippingInfo)
class ShippingInfoAdmin(admin.ModelAdmin):
    list_display = ("user", "first_name", "last_name", "email", "city", "state", "zip_code")
    search_fields = ("user__email", "first_name", "last_name", "city", "state")
    list_filter = ("city", "state")