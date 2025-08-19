// publicHome.js - MeloSport Public Frontend Logic
/* eslint-disable no-unused-vars */
console.log("✅ publicHome.js cargado correctamente");

// ======================== Estado Global ========================

// Compartido con apiService.js
window.categoriasSeleccionadas = window.categoriasSeleccionadas || [];
window.absolutasSeleccionadas = window.absolutasSeleccionadas || [];
let currentPage = 1;

// ======================== Utilidades ========================

/**
 * Normaliza texto para búsquedas (sin acentos, minúsculas)
 * @param {string} text - Texto a normalizar
 * @returns {string} Texto normalizado
 */
function normalizeText(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Muestra un placeholder de error en un contenedor
 * @param {HTMLElement} container - Contenedor DOM
 * @param {string} message - Mensaje de error
 */
function showErrorPlaceholder(container, message) {
  if (!container) return;
  container.innerHTML = `
    <div class="alert alert-warning" role="alert" aria-live="assertive">
      ${message}
    </div>
  `;
}

/**
 * Formatea precio en COP
 * @param {number} value - Valor numérico
 * @returns {string} Precio formateado
 */
function formatCOP(value) {
  const numberValue = Number(value) || 0;
  return `$${numberValue.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })} COP`;
}

// ======================== Categorías (Modal Padre/Hija) ========================

/**
 * Alterna selección de categoría en el modal
 * @param {number} id - ID de la categoría
 * @param {HTMLElement} element - Elemento DOM
 */
function toggleCategoria(id, element) {
  id = Number(id);
  const index = window.categoriasSeleccionadas.indexOf(id);
  if (index >= 0) {
    window.categoriasSeleccionadas.splice(index, 1);
    element.classList.remove("active");
  } else {
    window.categoriasSeleccionadas.push(id);
    element.classList.add("active");
  }
}

/**
 * Renderiza categorías en el modal
 * @param {Array} categories - Lista de categorías (padre/hija)
 */
function renderCategorias(categories) {
  const container = document.getElementById("listaCategorias");
  if (!container) return;

  container.innerHTML = "";
  categories.forEach(parent => {
    // Padre
    const parentDiv = document.createElement("div");
    parentDiv.className = "option-box option-parent";
    parentDiv.dataset.id = parent.id;
    parentDiv.dataset.type = "parent";
    parentDiv.dataset.nombre = parent.nombre;
    parentDiv.textContent = parent.nombre;
    if (window.categoriasSeleccionadas.includes(parent.id)) {
      parentDiv.classList.add("active");
    }
    parentDiv.addEventListener("click", () => toggleCategoria(parent.id, parentDiv));
    container.appendChild(parentDiv);

    // Hijas
    (parent.hijas || []).forEach(child => {
      const childDiv = document.createElement("div");
      childDiv.className = "option-box option-child ms-3";
      childDiv.dataset.id = child.id;
      childDiv.dataset.type = "child";
      childDiv.dataset.parent = String(parent.id);
      childDiv.dataset.nombre = child.nombre;
      childDiv.textContent = child.nombre;
      if (window.categoriasSeleccionadas.includes(child.id)) {
        childDiv.classList.add("active");
      }
      childDiv.addEventListener("click", () => toggleCategoria(child.id, childDiv));
      container.appendChild(childDiv);
    });
  });
}

/**
 * Filtra categorías en el modal según el término de búsqueda
 */
function filtrarCategoriasModal() {
  const input = document.getElementById("buscarCategoria");
  if (!input) return;

  // Evitar acumulación de listeners
  input.removeEventListener("input", input._filtrarHandler);
  input._filtrarHandler = () => {
    const filtro = normalizeText(input.value.trim());
    const parents = document.querySelectorAll("#listaCategorias .option-box[data-type='parent']");

    parents.forEach(parentEl => {
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
        childEl.style.display = (filtro === "" || childMatches || parentMatches) ? "" : "none";
      });

      parentEl.style.display = (filtro === "" || parentMatches || anyChildMatches) ? "" : "none";
      if (filtro !== "" && parentMatches) {
        children.forEach(child => (child.style.display = ""));
      }
    });
  };

  input.addEventListener("input", input._filtrarHandler);
  input.dispatchEvent(new Event("input"));
}

// ======================== Renderizado de Productos ========================

/**
 * Renderiza productos en el contenedor
 * @param {Array} products - Lista de productos normalizados
 */
function renderProducts(products) {
  const container = document.getElementById("productosContainer");
  if (!container) return;

  container.innerHTML = "";
  if (!products || products.length === 0) {
    showErrorPlaceholder(container, "No se encontraron productos.");
    return;
  }

  products.forEach(product => {
    const col = document.createElement("div");
    col.className = "col-12 col-sm-6 col-lg-3 d-flex";

    const sizes = [...new Set(product.variants?.map(v => v.size).filter(Boolean))];
    const colors = [...new Set(product.variants?.map(v => v.color).filter(Boolean))];
    const price = formatCOP(product.price);

    col.innerHTML = `
      <div class="card producto-card shadow-bottom w-100 d-flex flex-column h-100 cursor-pointer">
        <div class="image-container">
          <img src="${product.imageUrl}" class="card-img-top" alt="${product.name || 'Producto'}"
               onerror="this.onerror=null;this.src='https://via.placeholder.com/300x300?text=Sin+Imagen'">
          ${product.absoluteCategory?.nombre ? `<span class="badge badge-absolute badge-over-image">${product.absoluteCategory.nombre}</span>` : ""}
        </div>
        <div class="card-body d-flex flex-column">
          <div class="product-info flex-grow-1">
            <h5 class="card-title mb-1" style="min-height:48px;">${product.name || 'Sin nombre'}</h5>
            <p class="card-text text-muted" style="min-height:24px;">${product.categoryName}</p>
            <div class="slot slot-sizes" style="min-height:45px;">
              ${
                sizes.length > 1
                  ? `<div class="sizes-container">${sizes.map(s => `<span class="size-box" data-size="${s}">${s}</span>`).join("")}</div>`
                  : sizes.length === 1
                    ? `<p class="m-0"><strong>Talla:</strong> ${sizes[0]}</p>`
                    : `<div class="sizes-placeholder" aria-hidden="true"></div>`
              }
            </div>
            <div class="slot slot-colors" style="min-height:45px;">
              ${
                colors.length > 1
                  ? `<div class="variants-container">${colors.map(c => `<span class="variant-box" data-color="${c}">${c}</span>`).join("")}</div>`
                  : colors.length === 1
                    ? `<p class="m-0"><strong>Color:</strong> ${colors[0]}</p>`
                    : `<div class="colors-placeholder" aria-hidden="true"></div>`
              }
            </div>
            <div class="slot slot-price" style="min-height:50px;">
              <p class="fw-bold text-success fs-4 mb-0">${price}</p>
            </div>
            <div class="slot slot-stock" style="min-height:35px;">
              <p class="stock-text mb-0"><strong>Stock:</strong> ${product.stock} unidades</p>
            </div>
          </div>
          <a href="/productos/${product.id}" class="btn btn-primary w-100 mt-3">Ver Detalle</a>
        </div>
      </div>
    `;

    container.appendChild(col);

    // Listeners para la tarjeta
    const cardEl = col.querySelector(".card");
    if (!cardEl) return;

    cardEl.addEventListener("click", (e) => {
      if (e.target.closest(".size-box, .variant-box, a.btn")) return;
      window.location.href = `/productos/${product.id}`;
    });

    // Listeners para variantes
    let selectedSize = null;
    let selectedColor = null;
    const sizeBtns = cardEl.querySelectorAll(".size-box");
    const colorBtns = cardEl.querySelectorAll(".variant-box");

    function updateStock() {
      let filtered = product.variants ? [...product.variants] : [];
      if (selectedSize) filtered = filtered.filter(v => v.size === selectedSize);
      if (selectedColor) filtered = filtered.filter(v => v.color === selectedColor);

      const stockFiltered = filtered.length
        ? filtered.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
        : product.stock;

      const stockNode = cardEl.querySelector(".stock-text");
      if (stockNode) {
        stockNode.innerHTML = `<strong>Stock:</strong> ${stockFiltered} unidades (total: ${product.stock})`;
      }
    }

    sizeBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
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
        e.stopPropagation();
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

// ======================== Carrusel ========================

/**
 * Renderiza el carrusel de promociones
 * @param {Array} items - Items del carrusel
 */
function renderCarousel(items) {
  const carousel = document.getElementById("promocionesCarousel");
  if (!carousel) return;

  const indicators = carousel.querySelector(".carousel-indicators");
  const inner = carousel.querySelector(".carousel-inner");
  if (!indicators || !inner) return;

  indicators.innerHTML = "";
  inner.innerHTML = "";

  if (!items || items.length === 0) {
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
    return;
  }

  items.forEach((item, index) => {
    const indicator = document.createElement("button");
    indicator.type = "button";
    indicator.setAttribute("data-bs-target", "#promocionesCarousel");
    indicator.setAttribute("data-bs-slide-to", index);
    indicator.setAttribute("aria-label", `Slide ${index + 1}`);
    if (index === 0) indicator.classList.add("active");
    indicators.appendChild(indicator);

    const isInfo = item.type === "info";
    const title = item.customTitle || item.productName || "Destacado";
    const subtitle = item.customSubtitle || "";
    const href = item.ctaHref || (isInfo ? "#" : `/productos/${item.productId}`);
    const cta = item.ctaLabel || (isInfo ? "Ver más" : "Ver producto");
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

// ======================== Carga de Productos ========================

/**
 * Carga productos con filtros aplicados
 * @param {boolean} resetPage - Reiniciar página a 1
 */
async function cargarProductos(resetPage = false) {
  if (resetPage) currentPage = 1;

  const params = {
    page: currentPage,
    categories: window.categoriasSeleccionadas,
    absoluteCategories: window.absolutasSeleccionadas,
    search: window.terminoBusqueda || "",
    priceMin: window.precioMin || "",
    priceMax: window.precioMax || "",
    ordering: window.ordenActual || "",
    inStock: window.enStock !== null ? window.enStock : undefined
  };

  try {
    const data = await window.apiService.getProducts(params);
    if (data && data.items) {
      renderProducts(data.items);
    } else {
      const container = document.getElementById("productosContainer");
      showErrorPlaceholder(container, "No se pudieron cargar los productos.");
    }
  } catch (err) {
    console.error("❌ Error en cargarProductos:", err);
    const container = document.getElementById("productosContainer");
    showErrorPlaceholder(container, "Error al cargar productos. Intenta de nuevo.");
  }
}

// ======================== Categorías Absolutas (Barra) ========================

/**
 * Renderiza la barra de categorías absolutas
 * @param {Array} absCategories - Lista de categorías absolutas
 */
function renderAbsoluteCategoriesBar(absCategories) {
  const container = document.getElementById("categoriasContainer");
  if (!container) return;

  container.innerHTML = "";

  // Botón "Todos"
  const allBtn = document.createElement("button");
  allBtn.className = "btn btn-primary me-2 mb-2";
  allBtn.innerText = "Todos";
  allBtn.addEventListener("click", () => {
    window.absolutasSeleccionadas = [];
    container.querySelectorAll(".btn-absolute").forEach(btn => {
      btn.classList.remove("active", "btn-primary");
      btn.classList.add("btn-outline-primary");
    });
    allBtn.classList.add("active");
    cargarProductos(true);
  });
  container.appendChild(allBtn);

  // Botones de categorías absolutas
  absCategories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = `btn btn-outline-primary me-2 mb-2 btn-absolute ${
      window.absolutasSeleccionadas.includes(cat.id) ? "active btn-primary" : ""
    }`;
    btn.innerHTML = `${cat.icon ? `${cat.icon} ` : ""}${cat.nombre}`;
    btn.addEventListener("click", () => {
      const idx = window.absolutasSeleccionadas.indexOf(cat.id);
      if (idx >= 0) {
        window.absolutasSeleccionadas.splice(idx, 1);
        btn.classList.remove("active", "btn-primary");
        btn.classList.add("btn-outline-primary");
      } else {
        window.absolutasSeleccionadas.push(cat.id);
        btn.classList.add("active", "btn-primary");
        btn.classList.remove("btn-outline-primary");
      }
      allBtn.classList.toggle("active", window.absolutasSeleccionadas.length === 0);
      cargarProductos(true);
    });
    container.appendChild(btn);
  });

  // Botón "Más filtros"
  const moreFiltersBtn = document.createElement("button");
  moreFiltersBtn.className = "btn btn-secondary mb-2";
  moreFiltersBtn.innerText = "Más filtros…";
  moreFiltersBtn.setAttribute("data-bs-toggle", "modal");
  moreFiltersBtn.setAttribute("data-bs-target", "#modalCategorias");
  container.appendChild(moreFiltersBtn);

  if (window.absolutasSeleccionadas.length === 0) {
    allBtn.classList.add("active");
  }
}

// ======================== Inicialización ========================

document.addEventListener("DOMContentLoaded", () => {
  // Cargar carrusel
  window.apiService.getCarouselItems().then(items => {
    const infoSlides = window.apiService.getInfoSlides();
    renderCarousel([...infoSlides, ...items]);
  });

  // Cargar categorías absolutas
  window.apiService.getAbsoluteCategories().then(absCategories => {
    renderAbsoluteCategoriesBar(absCategories);
  });

  // Cargar productos iniciales
  cargarProductos();

  // Modal de categorías
  const modalCategorias = document.getElementById("modalCategorias");
  if (modalCategorias) {
    modalCategorias.addEventListener("shown.bs.modal", async () => {
      try {
        const categories = await window.apiService.getCategories();
        renderCategorias(categories);
        filtrarCategoriasModal();
      } catch (err) {
        console.error("❌ Error cargando categorías:", err);
        showErrorPlaceholder(
          document.getElementById("listaCategorias"),
          "Error al cargar categorías."
        );
      }
    });
  }

  // Botón aplicar categorías
  const aplicarBtn = document.getElementById("aplicarCategorias");
  if (aplicarBtn) {
    aplicarBtn.addEventListener("click", () => {
      const modalEl = document.getElementById("modalCategorias");
      if (typeof bootstrap !== "undefined" && modalEl) {
        const bsModal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        bsModal.hide();
      }
      cargarProductos(true);
    });
  }

  // Botón limpiar categorías
  const limpiarBtn = document.getElementById("limpiarCategorias");
  if (limpiarBtn) {
    limpiarBtn.addEventListener("click", () => {
      window.categoriasSeleccionadas = [];
      document.querySelectorAll("#listaCategorias .option-box.active").forEach(el =>
        el.classList.remove("active")
      );
      cargarProductos(true);
    });
  }

  // Filtros de precio y ordenamiento
  const selectOrden = document.getElementById("ordenSelect");
  const inputMin = document.getElementById("priceMin");
  const inputMax = document.getElementById("priceMax");

  if (selectOrden) {
    selectOrden.addEventListener("change", () => {
      const value = selectOrden.value;
      switch (value) {
        case "precio-asc":
          window.ordenActual = "price";
          break;
        case "precio-desc":
          window.ordenActual = "-price";
          break;
        case "nombre":
          window.ordenActual = "name";
          break;
        case "recientes":
          window.ordenActual = "-created_at";
          break;
        case "antiguos":
          window.ordenActual = "created_at";
          break;
        case "disponibilidad":
          window.ordenActual = "in_stock";
          break;
        default:
          window.ordenActual = "";
      }
      cargarProductos(true);
    });
  }

  function handlePriceChange() {
    window.precioMin = inputMin && inputMin.value ? inputMin.value : "";
    window.precioMax = inputMax && inputMax.value ? inputMax.value : "";
    cargarProductos(true);
  }

  if (inputMin) inputMin.addEventListener("change", handlePriceChange);
  if (inputMax) inputMax.addEventListener("change", handlePriceChange);

  // Formulario de búsqueda
  const formBusqueda = document.getElementById("formBusquedaProductos");
  if (formBusqueda) {
    formBusqueda.addEventListener("submit", e => {
      e.preventDefault();
      const input = document.getElementById("busqueda");
      if (input) {
        window.terminoBusqueda = input.value.trim();
        window.categoriasSeleccionadas = [];
        cargarProductos(true);
      }
    });
  }

  // Autocompletado
  const inputBusqueda = document.getElementById("busqueda");
  if (inputBusqueda) {
    const sugerenciasDiv = document.createElement("div");
    sugerenciasDiv.className = "list-group position-absolute w-100";
    sugerenciasDiv.style.zIndex = "1000";
    sugerenciasDiv.style.maxHeight = "250px";
    sugerenciasDiv.style.overflowY = "auto";
    inputBusqueda.parentNode.appendChild(sugerenciasDiv);

    let selectedIndex = -1;

    inputBusqueda.addEventListener("input", () => {
      clearTimeout(inputBusqueda._timeout);
      const query = inputBusqueda.value.trim();
      selectedIndex = -1;
      if (!query) {
        sugerenciasDiv.innerHTML = "";
        return;
      }

      inputBusqueda._timeout = setTimeout(async () => {
        try {
          const data = await window.apiService.getAutocomplete(query);
          renderSugerencias(data, sugerenciasDiv);
        } catch (err) {
          console.error("❌ Error en autocompletado:", err);
          sugerenciasDiv.innerHTML = `<div class="p-2 text-muted">Error al cargar sugerencias</div>`;
        }
      }, 300);
    });

    inputBusqueda.addEventListener("keydown", e => {
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

    function renderSugerencias(data, container) {
      container.innerHTML = "";
      const { productos = [], categorias = [] } = data;

      if (!productos.length && !categorias.length) {
        container.innerHTML = `<div class="p-2 text-muted">Sin resultados</div>`;
        return;
      }

      if (productos.length) {
        const header = document.createElement("div");
        header.className = "px-2 py-1 text-uppercase small fw-bold border-bottom bg-light";
        header.textContent = "Productos";
        container.appendChild(header);

        productos.forEach(nombre => {
          const item = document.createElement("button");
          item.type = "button";
          item.className = "list-group-item list-group-item-action";
          item.textContent = `🛍 ${nombre}`;
          item.addEventListener("click", () => {
            inputBusqueda.value = nombre;
            container.innerHTML = "";
            window.terminoBusqueda = nombre;
            window.categoriasSeleccionadas = [];
            cargarProductos(true);
          });
          container.appendChild(item);
        });
      }

      if (categorias.length) {
        const header = document.createElement("div");
        header.className = "px-2 py-1 text-uppercase small fw-bold border-bottom bg-light";
        header.textContent = "Categorías";
        container.appendChild(header);

        categorias.forEach(cat => {
          const item = document.createElement("button");
          item.type = "button";
          item.className = "list-group-item list-group-item-action";
          item.textContent = `📂 ${cat.name}`;
          item.addEventListener("click", () => {
            inputBusqueda.value = cat.name;
            container.innerHTML = "";
            window.terminoBusqueda = "";
            window.categoriasSeleccionadas = [String(cat.id)];
            cargarProductos(true);
          });
          container.appendChild(item);
        });
      }
    }
  }
});
