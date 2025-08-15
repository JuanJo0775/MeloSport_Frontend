from django.shortcuts import render

def index(request):
    return render(request, "index.html")

def nosotros(request):
    return render(request, "nosotros.html")

def product_detail(request, id):
    return render(request, 'product_detail.html')