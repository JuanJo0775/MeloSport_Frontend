// ===============================
// API Service - MeloSport Public
// ===============================

const API_BASE_URL = "https://backoffice.example.com/api"; // Ajusta al dominio real

// --- Obtener carrusel ---
async function fetchCarousel() {
    try {
        const response = await fetch(`${API_BASE_URL}/carousel/`);
        if (!response.ok) throw new Error("Error al obtener el carrusel");
        const data = await response.json();
        renderCarousel(data);
    } catch (error) {
        console.error("❌ Error cargando el carrusel:", error);
    }
}

// --- Renderizar carrusel dinámicamente ---
function renderCarousel(items) {
    const indicatorsContainer = document.querySelector("#promocionesCarousel .carousel-indicators");
    const innerContainer = document.querySelector("#promocionesCarousel .carousel-inner");

    if (!indicatorsContainer || !innerContainer) return;

    indicatorsContainer.innerHTML = "";
    innerContainer.innerHTML = "";

    items.forEach((item, index) => {
        const indicator = document.createElement("button");
        indicator.type = "button";
        indicator.setAttribute("data-bs-target", "#promocionesCarousel");
        indicator.setAttribute("data-bs-slide-to", index);
        indicator.setAttribute("aria-label", `Promoción ${index + 1}`);
        if (index === 0) indicator.classList.add("active");
        indicatorsContainer.appendChild(indicator);

        const carouselItem = document.createElement("div");
        carouselItem.classList.add("carousel-item", ...(index === 0 ? ["active"] : []));

        carouselItem.innerHTML = `
            <div class="bg-primary text-white py-5" style="min-height: 400px;">
                <div class="container">
                    <div class="row align-items-center">
                        <div class="col-lg-6">
                            <h1 class="display-4 fw-bold">${item.custom_title || item.product_name}</h1>
                            <p class="lead">${item.custom_subtitle || ''}</p>
                            <a href="/productos/${item.product_id}" class="btn btn-light btn-lg">Ver Producto</a>
                        </div>
                        <div class="col-lg-6 text-center">
                            <i class="fas fa-futbol display-1 opacity-50"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;

        innerContainer.appendChild(carouselItem);
    });
}

// --- Obtener productos ---
async function fetchProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products/`);
        if (!response.ok) throw new Error("Error al obtener productos");
        const data = await response.json();
        renderProducts(data);
    } catch (error) {
        console.error("❌ Error cargando productos:", error);
    }
}

// --- Renderizar productos ---
function renderProducts(products) {
    const container = document.getElementById("productosContainer");
    if (!container) return;

    container.innerHTML = "";

    products.forEach(product => {
        const card = document.createElement("div");
        card.className = "col-md-3 mb-4 fade-in";

        const categoryName = product.category?.name || "Sin categoría";
        const imageUrl = product.image || "/static/img/no-image.png";

        card.innerHTML = `
            <div class="card producto-card h-100 shadow-sm">
                <img src="${imageUrl}" class="card-img-top" alt="${product.name}">
                <div class="card-body">
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text text-muted">${categoryName}</p>
                    <p class="fw-bold text-success">$${product.price}</p>
                    <a href="/productos/${product.id}" class="btn btn-primary w-100">Ver Detalle</a>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

// --- Obtener categorías ---
async function fetchCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories/`);
        if (!response.ok) throw new Error("Error al obtener categorías");
        const data = await response.json();
        renderCategories(data);
    } catch (error) {
        console.error("❌ Error cargando categorías:", error);
    }
}

// --- Renderizar categorías ---
function renderCategories(categories) {
    const container = document.getElementById("categoriasContainer");
    if (!container) return;

    container.innerHTML = "";

    categories.forEach(category => {
        const btn = document.createElement("button");
        btn.className = "btn btn-outline-primary m-1";
        btn.innerText = category.name;
        btn.addEventListener("click", () => filterByCategory(category.id));
        container.appendChild(btn);
    });
}

// --- Filtrar productos por categoría ---
async function filterByCategory(categoryId) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/?category=${categoryId}`);
        if (!response.ok) throw new Error("Error al filtrar productos");
        const data = await response.json();
        renderProducts(data);
    } catch (error) {
        console.error("❌ Error filtrando productos:", error);
    }
}

// --- Inicializar ---
document.addEventListener("DOMContentLoaded", () => {
    fetchCarousel();
    fetchProducts();
    fetchCategories();
});
