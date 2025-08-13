// ===============================
// API Service - MeloSport Public
// ===============================

const API_BASE_URL = "http://127.0.0.1:8000/api"; // Ajusta al dominio real

// --- Utilidad de error accesible ---
function showErrorPlaceholder(container, message) {
  if (!container) return;
  container.innerHTML = `
    <div class="alert alert-warning" role="alert" aria-live="assertive">
      ${message}
    </div>
  `;
}

// --- Obtener carrusel (solo activos) ---
async function fetchCarousel() {
  const carousel = document.getElementById("promocionesCarousel");
  try {
    const res = await fetch(`${API_BASE_URL}/carousel/?is_active=true`);
    if (!res.ok) throw new Error("Error al obtener el carrusel");
    const data = await res.json();
    const items = data.results || data; // <-- soporte results o array

    // Mezclar con banners informativos locales
    const infoSlides = getInfoSlides();
    renderCarousel([...infoSlides, ...items]);
  } catch (err) {
    console.error("❌ Carrusel:", err);
    if (carousel) {
      const indicators = carousel.querySelector(".carousel-indicators");
      const inner = carousel.querySelector(".carousel-inner");
      if (indicators && inner) {
        indicators.innerHTML = "";
        inner.innerHTML = `
          <div class="carousel-item active">
            <div class="bg-secondary text-white py-5" style="min-height: 300px;">
              <div class="container text-center">
                <h2 class="fw-bold">Sin promociones disponibles</h2>
                <p class="mb-0">Vuelve más tarde o explora nuestros productos destacados.</p>
              </div>
            </div>
          </div>
        `;
      }
    }
  }
}

// --- Slides informativos por defecto ---
function getInfoSlides() {
  return [
    {
      type: "info",
      custom_title: "Promociones de temporada",
      custom_subtitle: "Ahorra en colecciones seleccionadas",
      cta_label: "Ver productos",
      cta_href: "#productos",
      bg: "bg-primary",
      text: "text-white"
    },
    {
      type: "info",
      custom_title: "Aviso institucional",
      custom_subtitle: "Atención personalizada a clubes y colegios",
      cta_label: "Contáctanos",
      cta_href: "#contacto",
      bg: "bg-dark",
      text: "text-light"
    }
  ];
}

// --- Renderizar carrusel ---
function renderCarousel(items) {
  const indicators = document.querySelector("#promocionesCarousel .carousel-indicators");
  const inner = document.querySelector("#promocionesCarousel .carousel-inner");
  if (!indicators || !inner) return;

  indicators.innerHTML = "";
  inner.innerHTML = "";

  items.forEach((item, index) => {
    const indicator = document.createElement("button");
    indicator.type = "button";
    indicator.setAttribute("data-bs-target", "#promocionesCarousel");
    indicator.setAttribute("data-bs-slide-to", index);
    indicator.setAttribute("aria-label", `Slide ${index + 1}`);
    if (index === 0) indicator.classList.add("active");
    indicators.appendChild(indicator);

    const isInfo = item.type === "info";
    const title = item.custom_title || item.product_name || "Destacado";
    const subtitle = item.custom_subtitle || "";
    const href = isInfo
      ? (item.cta_href || "#")
      : `/productos/${item.product_id}`;
    const cta = isInfo ? (item.cta_label || "Ver más") : "Ver producto";
    const bg = item.bg || "bg-primary";
    const text = item.text || "text-white";

    const slide = document.createElement("div");
    slide.className = `carousel-item ${index === 0 ? "active" : ""}`;
    slide.innerHTML = `
      <div class="${bg} ${text} py-5" style="min-height: 400px;">
        <div class="container">
          <div class="row align-items-center">
            <div class="col-lg-6">
              <h1 class="display-5 fw-bold mb-2">${title}</h1>
              ${subtitle ? `<p class="lead mb-4">${subtitle}</p>` : ""}
              <a href="${href}" class="btn btn-light btn-lg">${cta}</a>
            </div>
            <div class="col-lg-6 text-center">
              <i class="fas fa-futbol display-1 opacity-50"></i>
            </div>
          </div>
        </div>
      </div>
    `;
    inner.appendChild(slide);
  });
}

// --- Obtener productos ---
async function fetchProducts(limit = 12) {
  const container = document.getElementById("productosContainer");
  try {
    const res = await fetch(`${API_BASE_URL}/products/?limit=${limit}`);
    if (!res.ok) throw new Error("Error al obtener productos");
    const data = await res.json();
    const items = data.results || data; // <-- soporte results o array
    renderProducts(items);
  } catch (err) {
    console.error("❌ Productos:", err);
    showErrorPlaceholder(container, "No pudimos cargar los productos ahora mismo.");
  }
}

// --- Renderizar productos ---
function renderProducts(products) {
  const container = document.getElementById("productosContainer");
  if (!container) return;
  container.innerHTML = "";

  products.forEach(product => {
    const col = document.createElement("div");
    col.className = "col-12 col-sm-6 col-lg-3";

    const categoryName = product.category?.name || "Sin categoría";

    // --- Manejo de imagen en 3 casos ---
    let imageUrl;
    if (product.image) {
      if (product.image.startsWith("http")) {
        // Caso 1: URL absoluta
        imageUrl = product.image;
      } else if (product.image.startsWith("/")) {
        // Caso 2: Ruta relativa → agregar dominio backend
        const backendBase = API_BASE_URL.replace("/api", "");
        imageUrl = backendBase + product.image;
      } else {
        // Caso raro: sin slash inicial, tratamos como relativa
        const backendBase = API_BASE_URL.replace("/api", "");
        imageUrl = backendBase + "/" + product.image;
      }
    } else {
      // Caso 3: sin imagen → placeholder
      imageUrl = "https://via.placeholder.com/300x300?text=Sin+Imagen";
    }

    const price = (product.price ?? 0).toLocaleString("es-CO");

    col.innerHTML = `
      <div class="card producto-card h-100 shadow-sm">
        <img src="${imageUrl}" class="card-img-top" alt="${product.name}">
        <div class="card-body">
          <h5 class="card-title">${product.name}</h5>
          <p class="card-text text-muted">${categoryName}</p>
          <p class="fw-bold text-success">$${price}</p>
          <a href="/productos/${product.id}" class="btn btn-primary w-100">Ver Detalle</a>
        </div>
      </div>
    `;
    container.appendChild(col);
  });
}


// --- Categorías ---
async function fetchCategories() {
  const container = document.getElementById("categoriasContainer");
  try {
    const res = await fetch(`${API_BASE_URL}/categories/`);
    if (!res.ok) throw new Error("Error al obtener categorías");
    const data = await res.json();
    const categories = data.results || data; // <-- soporte results o array
    renderCategories(categories);
  } catch (err) {
    console.error("❌ Categorías:", err);
    showErrorPlaceholder(container, "Sin categorías disponibles por ahora.");
  }
}

function renderCategories(categories) {
  const container = document.getElementById("categoriasContainer");
  if (!container) return;
  container.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.className = "btn btn-primary";
  allBtn.innerText = "Todos";
  allBtn.addEventListener("click", () => filterByCategory(null));
  container.appendChild(allBtn);

  categories.forEach(category => {
    const btn = document.createElement("button");
    btn.className = "btn btn-outline-primary";
    btn.innerText = category.name;
    btn.addEventListener("click", () => filterByCategory(category.id));
    container.appendChild(btn);
  });
}

async function filterByCategory(categoryId) {
  const container = document.getElementById("productosContainer");
  try {
    const url = categoryId
      ? `${API_BASE_URL}/products/?category=${categoryId}&limit=12`
      : `${API_BASE_URL}/products/?limit=12`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error al filtrar productos");
    const data = await res.json();
    const items = data.results || data; // <-- soporte results o array
    renderProducts(items);
  } catch (err) {
    console.error("❌ Filtro:", err);
    showErrorPlaceholder(container, "No pudimos filtrar los productos.");
  }
}

// --- Inicializar ---
document.addEventListener("DOMContentLoaded", () => {
  fetchCarousel();
  fetchProducts(12);
  fetchCategories();
});
