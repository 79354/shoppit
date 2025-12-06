from django.urls import path
from django.http import JsonResponse
from . import views  


urlpatterns = [
    path("add_product/", views.add_product, name="add_product"),
    path("generate_product_description/", views.generate_product_description, name="generate_product_description"),
    path("get_products/", views.get_products, name="get_products"),
    path("get_product/<int:pk>/", views.get_product, name='get_product'),
    path("update_product/<int:pk>/", views.update_product, name="update_product"),
    path("delete_product/<int:pk>/", views.delete_product, name="delete_product"),
    path("get_featured_products/", views.get_featured_products, name="get_featured_products"),
    path("get_all_products/", views.get_all_products, name="get_all_products"),
    path("get_product_by_slug/<str:slug>/", views.get_product_by_slug, name='get_product_by_slug'),
    path("get_cart/<str:cart_code>/", views.get_cart, name="get_cart"),
    path("add_to_cart/", views.add_to_cart, name="add_to_cart"),
    path("check_product_in_cart/", views.check_product_in_cart, name='check_product_in_cart'),
    path("increase_cartitem_quantity/", views.increase_cartitem_quantity, name='increase_cartitem_quantity'),
    path("decrease_cartitem_quantity/", views.decrease_cartitem_quantity, name='decrease_cartitem_quantity'),
    path("delete_cartitem/<int:pk>/", views.delete_cartitem, name='delete_cartitem'),
    path('create_or_update_shipping_info/', views.create_or_update_shipping_info, name="create_or_update_shipping_info"),
    path('initialize_payment/', views.initialize_payment, name='initialize_payment'),
    path('verify_payment/<str:reference>/', views.verify_payment, name='verify-payment'),
    path('get_shipping_address/', views.get_shipping_address, name='get_shipping_address'),
    path("analytics/", views.get_analytics_data, name="analytics-data"),
    path("dashboard-stats/", views.admin_dashboard_stats, name="admin-dashboard-stats"),
    path("get_user_orders/", views.get_user_orders, name="get_user_orders"),
    path("get_all_orders/", views.get_all_orders, name='get_all_orders'),
    path("update_order_status/<int:pk>/", views.update_order_status, name='update_order_status'),
    path("delete_order/<int:pk>/", views.delete_order, name="delete_order"),
    path("user_is_admin/", views.user_is_admin, name="user_is_admin"),
    path("user_is_logged_in/", views.user_is_logged_in, name='user_is_logged_in')
]
