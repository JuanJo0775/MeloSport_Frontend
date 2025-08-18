// apiService.js - MeloSport Public (unificado y compatible con publicHome)
/* eslint-disable no-unused-vars */
const API_BASE_URL = "http://127.0.0.1:8000/api";

// Estado global de filtros
window.categoriasSeleccionadas = window.categoriasSeleccionadas || [];   // IDs seleccionados desde el modal (padre/hija)
window.absolutasSeleccionadas = window.absolutasSeleccionadas || [];    // IDs seleccionados desde la barra de absolutas
window.terminoBusqueda = window.terminoBusqueda || "";
window.criterioOrden = window.criterioOrden || "";


const inputBusqueda = document.getElementById("busqueda");
const sugerenciasDiv = document.getElementById("sugerencias");
const formBusqueda = document.getElementById("formBusqueda");

if (formBusqueda && inputBusqueda) {
  formBusqueda.addEventListener("submit", (e) => {
    e.preventDefault();
    terminoBusqueda = inputBusqueda.value.trim();
    categoriasSeleccionadas = [];
    cargarProductos(true);
  });

  inputBusqueda.addEventListener("input", debounce(async () => {
    const q = inputBusqueda.value.trim();
    if (q.length < 2) {
      sugerenciasDiv.innerHTML = "";
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/products/autocomplete/?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      renderSugerencias(data);
    } catch (err) {
      console.error("❌ Autocomplete fetch error:", err);
    }
  }, 300));
}

// Utilidades

function showErrorPlaceholder(container, message) {
  if (!container) return;
  container.innerHTML = `
    <div class="alert alert-warning" role="alert" aria-live="assertive">
      ${message}
    </div>
  `;
}

function safeText(x) { return (x === null || typeof x === "undefined") ? "" : x; }

// Texto (normalización para búsquedas)

// Texto (normalización para búsquedas)
function normalizeText(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // quita acentos
}


// CARRUSEL

async function fetchCarousel() {
  const carousel = document.getElementById("promocionesCarousel");
  try {
    const res = await fetch(`${API_BASE_URL}/carousel/?is_active=true`);
    if (!res.ok) throw new Error("Error al obtener el carrusel");
    const data = await res.json();
    const items = data.results || data || [];
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

function getInfoSlides() {
  return [
    { type: "info", custom_title: "Promociones de temporada", custom_subtitle: "Ahorra en colecciones seleccionadas", cta_label:"Ver productos", cta_href:"#productos", bg:"bg-primary", text:"text-white" },
    { type: "info", custom_title: "Aviso institucional", custom_subtitle: "Atención personalizada a clubes y colegios", cta_label:"Contáctanos", cta_href:"#contacto", bg:"bg-dark", text:"text-light" }
  ];
}

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
    const href = isInfo ? (item.cta_href || "#") : `/productos/${item.product_id}`;
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


// PRODUCTOS (carga y render)

async function cargarProductos(resetPage = false) {
  try {
    if (resetPage) currentPage = 1;

    const params = new URLSearchParams();
    params.set("page", String(currentPage));

    // filtros
    if (terminoBusqueda && terminoBusqueda.trim() !== "") {
      params.set("search", terminoBusqueda.trim());
    }
    if (categoriasSeleccionadas.length > 0) {
      params.set("categories", categoriasSeleccionadas.join(",")); // IDs
    }
    if (categoriasAbsolutasSeleccionadas.length > 0) {
      params.set("absolute_categories", categoriasAbsolutasSeleccionadas.join(",")); // IDs absolutos
    }
    if (precioMin) params.set("price_min", String(precioMin));
    if (precioMax) params.set("price_max", String(precioMax));
    if (ordenActual) params.set("ordering", ordenActual);
    if (enStock !== null) params.set("in_stock", String(enStock));

    const url = `${API_BASE_URL}/products/?${params.toString()}`;
    // ... (tu fetch + render actual)
  } catch (err) {
    console.error("❌ cargarProductos:", err);
  }
}

function renderProducts(products) {
  const container = document.getElementById("productosContainer");
  if (!container) return;
  container.innerHTML = "";

  products.forEach(product => {
    // crear columna
    const col = document.createElement("div");
    col.className = "col-12 col-sm-6 col-lg-3 d-flex";

    const imageUrl = getImageUrlFromProduct(product);
    const categoryName = (product.categories?.length)
      ? product.categories[0].name
      : (product.category?.name || "Sin categoría");
    const absoluteCategoryName = product.absolute_category?.nombre || product.absolute_category?.name || null;

    function formatCOP(value) {
      const numberValue = Number(value) || 0;
      return `$${numberValue.toLocaleString("es-CO", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })} COP`;
    }

    const price = formatCOP(product.price);

    const sizes  = [...new Set(product.variants?.map(v => v.size ).filter(Boolean))];
    const colors = [...new Set(product.variants?.map(v => v.color).filter(Boolean))];

    const variantsStock = Array.isArray(product.variants) && product.variants.length
      ? product.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
      : 0;
    const baseStock = Number(product.stock ?? product.total_stock ?? 0);
    const totalStock = variantsStock > 0 ? variantsStock : baseStock;

    col.innerHTML = `
      <div class="card producto-card shadow-bottom w-100 d-flex flex-column h-100 cursor-pointer">
        <div class="image-container">
          <img src="${imageUrl}" class="card-img-top" alt="${safeText(product.name)}"
               onerror="this.onerror=null;this.src='https://via.placeholder.com/300x300?text=Sin+Imagen'">
          ${absoluteCategoryName ? `<span class="badge badge-absolute badge-over-image">${absoluteCategoryName}</span>` : ""}
        </div>

        <div class="card-body d-flex flex-column">
          <div class="product-info flex-grow-1">
            <h5 class="card-title mb-1" style="min-height:48px;">${safeText(product.name)}</h5>
            <p class="card-text text-muted" style="min-height:24px;">${safeText(categoryName)}</p>

            <!-- Tallas -->
            <div class="slot slot-sizes" style="min-height:45px;">
              ${
                sizes.length > 1
                  ? `<div class="sizes-container">${sizes.map(s => `<span class="size-box" data-size="${s}">${s}</span>`).join("")}</div>`
                  : sizes.length === 1
                    ? `<p class="m-0"><strong>Talla:</strong> ${sizes[0]}</p>`
                    : `<div class="sizes-placeholder" aria-hidden="true"></div>`
              }
            </div>

            <!-- Colores -->
            <div class="slot slot-colors" style="min-height:45px;">
              ${
                colors.length > 1
                  ? `<div class="variants-container">${colors.map(c => `<span class="variant-box" data-color="${c}">${c}</span>`).join("")}</div>`
                  : colors.length === 1
                    ? `<p class="m-0"><strong>Color:</strong> ${colors[0]}</p>`
                    : `<div class="colors-placeholder" aria-hidden="true"></div>`
              }
            </div>

            <!-- Precio -->
            <div class="slot slot-price" style="min-height:50px;">
              <p class="fw-bold text-success fs-4 mb-0">${price}</p>
            </div>

            <!-- Stock -->
            <div class="slot slot-stock" style="min-height:35px;">
              <p class="stock-text mb-0"><strong>Stock:</strong> ${totalStock} unidades</p>
            </div>
          </div>

          <a href="/productos/${product.id}" class="btn btn-primary w-100 mt-3">Ver Detalle</a>
        </div>
      </div>
    `;

    container.appendChild(col);

    // --- listeners dentro de la tarjeta ---
    const cardEl = col.querySelector(".card");
    if (!cardEl) return;

    // 🔹 Hacer toda la tarjeta clickeable
    cardEl.addEventListener("click", (e) => {
      // ignorar clicks en botones de talla, color o el propio botón "Ver Detalle"
      if (e.target.closest(".size-box") || e.target.closest(".variant-box") || e.target.closest("a.btn")) {
        return;
      }
      window.location.href = `/productos/${product.id}`;
    });

    // --- listeners de variantes ---
    let selectedSize = null;
    let selectedColor = null;

    const sizeBtns  = cardEl.querySelectorAll(".size-box");
    const colorBtns = cardEl.querySelectorAll(".variant-box");

    function updateStock() {
      let filtered = Array.isArray(product.variants) ? [...product.variants] : [];
      if (selectedSize)  filtered = filtered.filter(v => v.size  === selectedSize);
      if (selectedColor) filtered = filtered.filter(v => v.color === selectedColor);

      const stockFiltered = filtered.length
        ? filtered.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
        : totalStock;

      const stockNode = cardEl.querySelector(".stock-text");
      if (stockNode) stockNode.innerHTML = `<strong>Stock:</strong> ${stockFiltered} unidades (total: ${totalStock})`;
    }

    sizeBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // evitar que abra el detalle
        const value = btn.dataset.size;
        if (selectedSize === value) {
          selectedSize = null;
          btn.classList.remove("active");
        } else {
          selectedSize = value;
          sizeBtns.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
        }
        updateStock();
      });
    });

    colorBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // evitar que abra el detalle
        const value = btn.dataset.color;
        if (selectedColor === value) {
          selectedColor = null;
          btn.classList.remove("active");
        } else {
          selectedColor = value;
          colorBtns.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
        }
        updateStock();
      });
    });
  });
}


// Helpers imagen

function getImageUrlFromProduct(product) {
  if (!product) return "https://via.placeholder.com/300x300?text=Sin+Imagen";
  if (product.main_image) return product.main_image;
  if (product.images && product.images.length) {
    const main = product.images.find(i => i.is_main) || product.images[0];
    if (main.image_url) return main.image_url;
    const backendBase = API_BASE_URL.replace("/api", "");
    return main.image?.startsWith("http") ? main.image : backendBase + (main.image?.startsWith("/") ? main.image : `/${main.image}`);
  }
  if (product.image) {
    const backendBase = API_BASE_URL.replace("/api", "");
    return product.image.startsWith("http") ? product.image : backendBase + (product.image.startsWith("/") ? product.image : `/${product.image}`);
  }
  return "https://via.placeholder.com/300x300?text=Sin+Imagen";
}


// CATEGORÍAS ABSOLUTAS (barra principal)

async function fetchAbsoluteCategories() {
  const container = document.getElementById("categoriasContainer");
  if (!container) return;
  try {
    const res = await fetch(`${API_BASE_URL}/absolute-categories/`);
    if (!res.ok) throw new Error("Error al obtener categorías absolutas");
    const data = await res.json();

    // Asegurar que sea lista plana
    const list = (data.results || data || []).map(c => ({
      id: c.id,
      nombre: c.nombre || c.name || "Categoría",
      icon: c.icon || ""
    }));

    renderAbsoluteCategoriesBar(list);
  } catch (err) {
    console.error("❌ Categorías absolutas:", err);
    showErrorPlaceholder(container, "Sin categorías absolutas disponibles.");
  }
}


function renderAbsoluteCategoriesBar(absCategories) {
  const container = document.getElementById("categoriasContainer");
  if (!container) return;
  container.innerHTML = "";

  // Botón "Todos"
  const allBtn = document.createElement("button");
  allBtn.className = "btn btn-primary me-2 mb-2";
  allBtn.innerText = "Todos";
  allBtn.addEventListener("click", () => {
    absolutasSeleccionadas = [];
    container.querySelectorAll(".btn-absolute").forEach(btn => {
      btn.classList.remove("active", "btn-primary");
      btn.classList.add("btn-outline-primary");
    });
    allBtn.classList.add("active");
    cargarProductos();
  });
  container.appendChild(allBtn);

  // Botones de absolutas (multi-selección estilo botón)
  absCategories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "btn btn-outline-primary me-2 mb-2 btn-absolute";
    btn.innerHTML = `${cat.icon ? `${cat.icon} ` : ""}${cat.nombre}`;

    btn.addEventListener("click", () => {
      const idx = absolutasSeleccionadas.indexOf(cat.id);
      if (idx >= 0) {
        absolutasSeleccionadas.splice(idx, 1);
        btn.classList.remove("active", "btn-primary");
        btn.classList.add("btn-outline-primary");
      } else {
        absolutasSeleccionadas.push(cat.id);
        btn.classList.add("active", "btn-primary");
        btn.classList.remove("btn-outline-primary");
      }
      if (absolutasSeleccionadas.length > 0) allBtn.classList.remove("active");
      else allBtn.classList.add("active");
      cargarProductos();
    });

    container.appendChild(btn);
  });

  // Botón "Más filtros…" -> abre modal existente #modalCategorias
  const verTodasBtn = document.createElement("button");
  verTodasBtn.className = "btn btn-secondary mb-2";
  verTodasBtn.innerText = "Más filtros…";
  verTodasBtn.setAttribute("data-bs-toggle", "modal");
  verTodasBtn.setAttribute("data-bs-target", "#modalCategorias");
  container.appendChild(verTodasBtn);

  allBtn.classList.add("active");
}


// CATEGORÍAS (modal padre/hija) - getCategoriasTree + render

async function getCategoriasTree() {
  // Intentamos endpoint dedicado; si no, construimos el árbol desde /categories/
  try {
    let res = await fetch(`${API_BASE_URL}/categories-tree/`);
    if (res.ok) {
      const data = await res.json();
      return data || [];
    }

    // Fallback: obtener todas y construir árbol
    res = await fetch(`${API_BASE_URL}/categories/`);
    if (!res.ok) throw new Error("No se pudo obtener categorías para construir árbol");
    const data = await res.json();
    const list = data.results || data || [];

    // construir árbol: padres (parent==null), hijas agrupadas
    const byId = {};
    list.forEach(c => byId[c.id] = { id: c.id, nombre: c.nombre || c.name, parent: c.parent || null });
    const padres = [];
    Object.values(byId).forEach(c => {
      if (!c.parent) padres.push({ id: c.id, nombre: c.nombre, hijas: [] });
    });
    Object.values(byId).forEach(c => {
      if (c.parent) {
        const p = padres.find(xx => xx.id === c.parent);
        if (p) p.hijas.push({ id: c.id, nombre: c.nombre });
      }
    });
    return padres;
  } catch (err) {
    console.error("❌ getCategoriasTree:", err);
    return [];
  }
}

function renderCategoriasModal(cats) {
  const cont = document.getElementById("listaCategorias");
  if (!cont) return;
  cont.innerHTML = "";

  cats.forEach(parent => {
    // Padre
    const padreDiv = document.createElement("div");
    padreDiv.className = "option-box option-parent";
    padreDiv.dataset.id = parent.id;
    padreDiv.dataset.type = "parent";
    padreDiv.dataset.nombre = parent.nombre;
    padreDiv.textContent = parent.nombre;
    if (categoriasSeleccionadas.includes(parent.id)) padreDiv.classList.add("active");
    padreDiv.addEventListener("click", () => toggleCategoriaModal(parent.id, padreDiv));
    cont.appendChild(padreDiv);

    // Hijas
    (parent.hijas || []).forEach(h => {
      const hijaDiv = document.createElement("div");
      hijaDiv.className = "option-box option-child ms-3";
      hijaDiv.dataset.id = h.id;
      hijaDiv.dataset.type = "child";
      hijaDiv.dataset.parent = String(parent.id);
      hijaDiv.dataset.nombre = h.nombre;
      hijaDiv.textContent = h.nombre;
      if (categoriasSeleccionadas.includes(h.id)) hijaDiv.classList.add("active");
      hijaDiv.addEventListener("click", () => toggleCategoriaModal(h.id, hijaDiv));
      cont.appendChild(hijaDiv);
    });
  });
}


function filtrarCategoriasModal() {
  const input = document.getElementById("buscarCategoria");
  if (!input) return;

  // Evitar que se acumulen listeners
  input.removeEventListener("input", input._filtrarHandler);

  // Nuevo listener como función aparte para poder removerlo después
  input._filtrarHandler = () => {
    const filtro = normalizeText(input.value.trim());
    const padres = document.querySelectorAll("#listaCategorias .option-box[data-type='parent']");

    padres.forEach(parentEl => {
      const parentName = normalizeText(parentEl.dataset.nombre || "");
      const children = document.querySelectorAll(
        `#listaCategorias .option-box[data-type='child'][data-parent='${parentEl.dataset.id}']`
      );

      let parentMatches = filtro === "" ? true : parentName.includes(filtro);
      let anyChildMatches = false;

      children.forEach(childEl => {
        const childName = normalizeText(childEl.dataset.nombre || "");
        const childMatches = filtro === "" ? true : childName.includes(filtro);
        anyChildMatches = anyChildMatches || childMatches;

        // Mostrar/ocultar hijo
        childEl.style.display = (filtro === "" || childMatches || parentMatches) ? "" : "none";
      });

      // Mostrar padre si coincide o si alguna hija coincide
      parentEl.style.display = (filtro === "" || parentMatches || anyChildMatches) ? "" : "none";

      // Si el padre coincide con el filtro, mostrar todas sus hijas
      if (filtro !== "" && parentMatches) {
        children.forEach(ch => ch.style.display = "");
      }
    });
  };

  // Asignar nuevo listener
  input.addEventListener("input", input._filtrarHandler);

  // Forzar un filtrado inicial
  input.dispatchEvent(new Event("input"));
}



function toggleCategoriaModal(id, element) {
  id = Number(id);
  const idx = categoriasSeleccionadas.indexOf(id);
  if (idx >= 0) {
    categoriasSeleccionadas.splice(idx, 1);
    element.classList.remove("active");
  } else {
    categoriasSeleccionadas.push(id);
    element.classList.add("active");
  }
}

// Aplicar / Limpiar del modal (se asume ids: aplicarCategorias, limpiarCategorias)
document.addEventListener("DOMContentLoaded", () => {
  // cargar árbol cuando se abra el modal
  const modalCategorias = document.getElementById("modalCategorias");
  if (modalCategorias) {
    modalCategorias.addEventListener("shown.bs.modal", async () => {
      const cats = await getCategoriasTree();
      renderCategoriasModal(cats);
      filtrarCategoriasModal(); // activa búsqueda en tiempo real
    });
  }

  const aplicarBtn = document.getElementById("aplicarCategorias");
  if (aplicarBtn) {
    aplicarBtn.addEventListener("click", () => {
      // cerrar modal usando bootstrap if available
      const modalEl = document.getElementById("modalCategorias");
      if (typeof bootstrap !== "undefined" && modalEl) {
        const bs = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        bs.hide();
      }
      cargarProductos();
    });
  }

  const limpiarBtn = document.getElementById("limpiarCategorias");
  if (limpiarBtn) {
    limpiarBtn.addEventListener("click", () => {
      categoriasSeleccionadas = [];
      document.querySelectorAll("#listaCategorias .option-box.active").forEach(el => el.classList.remove("active"));
      cargarProductos();
    });
  }
});


// Inicialización

document.addEventListener("DOMContentLoaded", () => {
  // Carga inicial
  fetchCarousel();
  fetchAbsoluteCategories();
  cargarProductos();

  // Listener para el select de orden
  const ordenSelect = document.getElementById("ordenSelect");
  if (ordenSelect) {
    ordenSelect.addEventListener("change", () => {
      switch (ordenSelect.value) {
        case "precio-asc":
          criterioOrden = "price";
          break;
        case "precio-desc":
          criterioOrden = "-price";
          break;
        case "nombre":
          criterioOrden = "name";
          break;
        case "disponibilidad":
          criterioOrden = "-total_stock";
          break;
        default:
          criterioOrden = "";
      }
      cargarProductos();
    });
  }
// FORMULARIO DE BÚSQUEDA (submit)
const formBusqueda = document.getElementById("formBusquedaProductos");
if (formBusqueda) {
  formBusqueda.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("busqueda");
    if (!input) {
      console.warn("⚠️ No se encontró el input de búsqueda");
      return;
    }
    terminoBusqueda = input.value.trim();
    categoriasSeleccionadas = [];
    cargarProductos(true);
  });
}

// AUTOCOMPLETADO
const inputBusqueda = document.getElementById("busqueda"); // 👈 corregido
if (inputBusqueda) {
  const sugerenciasDiv = document.createElement("div");
  sugerenciasDiv.className = "list-group position-absolute w-100";
  sugerenciasDiv.style.zIndex = "1000";
  sugerenciasDiv.style.maxHeight = "250px";
  sugerenciasDiv.style.overflowY = "auto";
  inputBusqueda.parentNode.appendChild(sugerenciasDiv);

  let timeout = null;
  let selectedIndex = -1; // para manejar teclas ↑ ↓

  inputBusqueda.addEventListener("input", () => {
    clearTimeout(timeout);
    const query = inputBusqueda.value.trim();
    selectedIndex = -1;
    if (!query) {
      sugerenciasDiv.innerHTML = "";
      return;
    }

    timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/products/autocomplete/?q=${encodeURIComponent(query)}`
        );
        if (!res.ok) throw new Error("Error en autocompletado");
        const data = await res.json();
        renderSugerencias(data);
      } catch (err) {
        console.error("❌ Autocomplete:", err);
      }
    }, 300);
  });

  // Navegación con teclas ↑ ↓ y Enter
  inputBusqueda.addEventListener("keydown", (e) => {
    const items = sugerenciasDiv.querySelectorAll(".list-group-item, button");
    if (!items.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % items.length;
      updateHighlight(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + items.length) % items.length;
      updateHighlight(items);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < items.length) {
        items[selectedIndex].click();
      } else {
        formBusqueda?.requestSubmit();
      }
    }
  });

  function updateHighlight(items) {
    items.forEach((item, idx) => {
      item.classList.toggle("active", idx === selectedIndex);
    });
  }

  function renderSugerencias(data) {
    sugerenciasDiv.innerHTML = "";
    const { productos = [], categorias = [] } = data;

    if (!productos.length && !categorias.length) {
      sugerenciasDiv.innerHTML = `<div class="p-2 text-muted">Sin resultados</div>`;
      return;
    }

    if (productos.length) {
      const header = document.createElement("div");
      header.className = "px-2 py-1 text-uppercase small fw-bold border-bottom bg-light";
      header.textContent = "Productos";
      sugerenciasDiv.appendChild(header);

      productos.forEach((nombre) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "list-group-item list-group-item-action";
        item.textContent = `🛍 ${nombre}`;
        item.addEventListener("click", () => {
          inputBusqueda.value = nombre;
          sugerenciasDiv.innerHTML = "";
          terminoBusqueda = nombre;
          categoriasSeleccionadas = [];
          cargarProductos(true);
        });
        sugerenciasDiv.appendChild(item);
      });
    }

    if (categorias.length) {
      const header = document.createElement("div");
      header.className = "px-2 py-1 text-uppercase small fw-bold border-bottom bg-light";
      header.textContent = "Categorías";
      sugerenciasDiv.appendChild(header);

      categorias.forEach((c) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "list-group-item list-group-item-action";
        item.textContent = `📂 ${c.name}`;
        item.addEventListener("click", () => {
          inputBusqueda.value = c.name;
          sugerenciasDiv.innerHTML = "";
          terminoBusqueda = "";
          categoriasSeleccionadas = [String(c.id)];
          cargarProductos(true);
        });
        sugerenciasDiv.appendChild(item);
      });
    }
  }
}
});