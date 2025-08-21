from django.urls import path
from . import views

urlpatterns = [
    path("home/", views.index, name="index"),
    path("nosotros/", views.nosotros, name="nosotros"),
    path('productos/<int:id>/', views.product_detail, name='product_detail'),
    path("terminos/", views.terminos, name="terminos"),
]
