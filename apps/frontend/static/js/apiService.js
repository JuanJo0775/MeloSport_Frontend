// apiService.js - MeloSport API Service Layer
/* eslint-disable no-unused-vars */

const API_BASE_URL = "http://127.0.0.1:8000/api";

// AbortController para cancelar peticiones
let currentController = null;

// ======================== UTILIDADES ========================

/**
 * Cancela la petición anterior si existe
 */
function cancelPreviousRequest() {
  if (currentController) {
    currentController.abort();
  }
  currentController = new AbortController();
  return currentController.signal;
}

/**
 * Normaliza respuesta de la API con estructura estándar
 * @param {Object} data - Datos de la API
 * @returns {Object} Datos normalizados
 */
function normalizeApiResponse(data) {
  return {
    items: data.results || data || [],
    count: data.count || 0,
    pageSize: data.page_size || 12,
    page: data.current_page || 1,
    totalPages: data.total_pages || Math.ceil((data.count || 0) / (data.page_size || 12)),
    hasNext: data.next !== null,
    hasPrev: data.previous !== null,
    next: data.next,
    previous: data.previous
  };
}

/**
 * Normaliza un producto individual
 * @param {Object} product - Producto crudo de la API
 * @returns {Object} Producto normalizado
 */
function normalizeProduct(product) {
  if (!product) return null;

  // Normalizar imagen principal
  const imageUrl = getProductImageUrl(product);

  // Normalizar categorías
  const categories = Array.isArray(product.categories) ? product.categories : [];
  const categoryName = categories.length > 0
    ? categories[0].name || categories[0].nombre
    : (product.category?.name || product.category?.nombre || "Sin categoría");

  // Normalizar categoría absoluta
  const absoluteCategory = product.absolute_category ? {
    id: product.absolute_category.id,
    nombre: product.absolute_category.nombre || product.absolute_category.name || "Categoría"
  } : null;

  // Normalizar variantes
  const variants = Array.isArray(product.variants) ? product.variants.map(v => ({
    id: v.id,
    size: v.size || v.talla || "",
    color: v.color || v.color_name || "",
    stock: Number(v.stock || 0),
    price: Number(v.price || product.price || 0)
  })) : [];

  // Calcular stock total
  const variantsStock = variants.reduce((sum, v) => sum + v.stock, 0);
  const baseStock = Number(product.stock || product.total_stock || 0);
  const totalStock = variantsStock > 0 ? variantsStock : baseStock;

  return {
    id: product.id,
    name: product.name || product.nombre || "",
    price: Number(product.price || 0),
    stock: totalStock,
    imageUrl: imageUrl,
    categories: categories,
    categoryName: categoryName,
    absoluteCategory: absoluteCategory,
    variants: variants,
    createdAt: product.created_at,
    inStock: totalStock > 0,
    // Datos adicionales que podrían ser útiles
    description: product.description || product.descripcion || "",
    images: product.images || [],
    slug: product.slug || `producto-${product.id}`,
    rating: product.rating || 0,
    reviews: product.reviews || 0
  };
}

/**
 * Obtiene la URL de imagen de un producto
 * @param {Object} product - Producto
 * @returns {string} URL de la imagen
 */
function getProductImageUrl(product) {
  const fallback = "https://via.placeholder.com/300x300?text=Sin+Imagen";

  if (!product) return fallback;

  // Imagen principal directa
  if (product.main_image) return product.main_image;

  // Buscar en array de imágenes
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const mainImage = product.images.find(img => img.is_main) || product.images[0];
    if (mainImage.image_url) return mainImage.image_url;

    if (mainImage.image) {
      const backendBase = API_BASE_URL.replace("/api", "");
      return mainImage.image.startsWith("http")
        ? mainImage.image
        : backendBase + (mainImage.image.startsWith("/") ? mainImage.image : `/${mainImage.image}`);
    }
  }

  // Campo image directo
  if (product.image) {
    const backendBase = API_BASE_URL.replace("/api", "");
    return product.image.startsWith("http")
      ? product.image
      : backendBase + (product.image.startsWith("/") ? product.image : `/${product.image}`);
  }

  return fallback;
}

// ======================== FUNCIONES DE API ========================

/**
 * Obtiene productos con filtros
 * @param {Object} params - Parámetros de filtrado
 * @returns {Promise<Object>} Respuesta normalizada con productos
 */
async function getProducts(params = {}) {
  try {
    const signal = cancelPreviousRequest();
    const urlParams = new URLSearchParams();

    // Parámetros de paginación
    if (params.page) urlParams.set("page", String(params.page));

    // Filtros de búsqueda
    if (params.search && params.search.trim()) {
      urlParams.set("search", params.search.trim());
    }

    // Filtros de categorías
    if (params.categories && params.categories.length > 0) {
      urlParams.set("categories", params.categories.join(","));
    }

    if (params.absoluteCategories && params.absoluteCategories.length > 0) {
      urlParams.set("absolute_categories", params.absoluteCategories.join(","));
    }

    // Filtros de precio
    if (params.priceMin && params.priceMin > 0) urlParams.set("price_min", String(params.priceMin));
    if (params.priceMax && params.priceMax > 0) urlParams.set("price_max", String(params.priceMax));

    // Ordenamiento
    if (params.ordering) urlParams.set("ordering", params.ordering);

    // Stock
    if (params.inStock !== null && params.inStock !== undefined) {
      urlParams.set("in_stock", String(params.inStock));
    }

    const url = `${API_BASE_URL}/products/?${urlParams.toString()}`;
    console.log("🔗 Petición a:", url);

    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const normalized = normalizeApiResponse(data);

    // Normalizar cada producto
    normalized.items = normalized.items.map(normalizeProduct).filter(Boolean);

    console.log("✅ Productos obtenidos:", normalized.items.length);
    return normalized;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('⏹️ Petición cancelada');
      return null;
    }
    console.error("❌ Error en getProducts:", error);
    throw error;
  }
}

/**
 * Obtiene categorías en estructura de árbol
 * @returns {Promise<Array>} Categorías padre-hija
 */
async function getCategories() {
  try {
    // Intentar endpoint dedicado primero
    let response = await fetch(`${API_BASE_URL}/categories-tree/`);

    if (response.ok) {
      const data = await response.json();
      console.log("📁 Categorías desde /categories-tree/:", data);
      return Array.isArray(data) ? data : [];
    }

    // Fallback: construir árbol desde /categories/
    response = await fetch(`${API_BASE_URL}/categories/`);
    if (!response.ok) {
      throw new Error("No se pudieron obtener las categorías");
    }

    const data = await response.json();
    const categories = data.results || data || [];

    // Construir árbol padre-hija
    const byId = {};
    categories.forEach(cat => {
      byId[cat.id] = {
        id: cat.id,
        nombre: cat.nombre || cat.name || "Categoría",
        parent: cat.parent || null
      };
    });

    const tree = [];
    const parents = Object.values(byId).filter(cat => !cat.parent);

    parents.forEach(parent => {
      const parentNode = {
        id: parent.id,
        nombre: parent.nombre,
        hijas: []
      };

      Object.values(byId).forEach(cat => {
        if (cat.parent === parent.id) {
          parentNode.hijas.push({
            id: cat.id,
            nombre: cat.nombre
          });
        }
      });

      tree.push(parentNode);
    });

    console.log("📁 Árbol de categorías construido:", tree);
    return tree;

  } catch (error) {
    console.error("❌ Error en getCategories:", error);
    throw error;
  }
}

/**
 * Obtiene categorías absolutas
 * @returns {Promise<Array>} Lista de categorías absolutas
 */
async function getAbsoluteCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/absolute-categories/`);

    if (!response.ok) {
      throw new Error("Error al obtener categorías absolutas");
    }

    const data = await response.json();
    const categories = data.results || data || [];

    const normalized = categories.map(cat => ({
      id: cat.id,
      nombre: cat.nombre || cat.name || "Categoría",
      icon: cat.icon || "",
      slug: cat.slug || `categoria-${cat.id}`
    }));

    console.log("🏷️ Categorías absolutas:", normalized);
    return normalized;

  } catch (error) {
    console.error("❌ Error en getAbsoluteCategories:", error);
    throw error;
  }
}

/**
 * Obtiene items del carrusel
 * @returns {Promise<Array>} Items del carrusel normalizados
 */
async function getCarouselItems() {
  try {
    const response = await fetch(`${API_BASE_URL}/carousel/?is_active=true`);

    if (!response.ok) {
      throw new Error("Error al obtener items del carrusel");
    }

    const data = await response.json();
    const items = data.results || data || [];

    const normalized = items.map(item => ({
      id: item.id,
      type: "product",
      productId: item.product_id,
      productName: item.product_name || "Producto destacado",
      customTitle: item.custom_title || null,
      customSubtitle: item.custom_subtitle || null,
      ctaLabel: item.cta_label || "Ver producto",
      ctaHref: item.product_id ? `/productos/${item.product_id}` : "#",
      bg: item.bg || "bg-primary",
      text: item.text || "text-white",
      image: item.image || null,
      order: item.order || 0
    }));

    console.log("🎠 Items del carrusel:", normalized);
    return normalized;

  } catch (error) {
    console.error("❌ Error en getCarouselItems:", error);
    // Devolver array vacío en lugar de lanzar error para no romper la UI
    return [];
  }
}

/**
 * Obtiene sugerencias de autocompletado
 * @param {string} query - Término de búsqueda
 * @returns {Promise<Object>} Sugerencias de productos y categorías
 */
async function getAutocomplete(query) {
  try {
    if (!query || query.trim().length < 2) {
      return { productos: [], categorias: [] };
    }

    const signal = cancelPreviousRequest();
    const response = await fetch(
      `${API_BASE_URL}/products/autocomplete/?q=${encodeURIComponent(query.trim())}`,
      { signal }
    );

    if (!response.ok) {
      throw new Error("Error en autocompletado");
    }

    const data = await response.json();

    const normalized = {
      productos: Array.isArray(data.productos) ? data.productos.slice(0, 5) : [], // Limitar a 5
      categorias: Array.isArray(data.categorias) ? data.categorias.slice(0, 3).map(cat => ({
        id: cat.id,
        name: cat.name || cat.nombre || "Categoría"
      })) : []
    };

    console.log("🔍 Autocompletado para:", query, normalized);
    return normalized;

  } catch (error) {
    if (error.name === 'AbortError') {
      return { productos: [], categorias: [] };
    }
    console.error("❌ Error en getAutocomplete:", error);
    return { productos: [], categorias: [] };
  }
}

/**
 * Obtiene slides informativos estáticos
 * @returns {Array} Slides informativos
 */
function getInfoSlides() {
  return [
    {
      type: "info",
      customTitle: "Promociones de temporada",
      customSubtitle: "Ahorra en colecciones seleccionadas",
      ctaLabel: "Ver productos",
      ctaHref: "#productos",
      bg: "bg-primary",
      text: "text-white"
    },
    {
      type: "info",
      customTitle: "Aviso institucional",
      customSubtitle: "Atención personalizada a clubes y colegios",
      ctaLabel: "Contáctanos",
      ctaHref: "#contacto",
      bg: "bg-dark",
      text: "text-light"
    }
  ];
}

/**
 * Obtiene estadísticas del sitio
 * @returns {Promise<Object>} Estadísticas básicas
 */
async function getSiteStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/stats/`);

    if (!response.ok) {
      // Si no existe el endpoint, devolver valores por defecto
      return {
        totalProducts: 0,
        totalCategories: 0,
        featuredProducts: 0
      };
    }

    const data = await response.json();
    return {
      totalProducts: data.total_products || 0,
      totalCategories: data.total_categories || 0,
      featuredProducts: data.featured_products || 0
    };

  } catch (error) {
    console.error("❌ Error en getSiteStats:", error);
    return {
      totalProducts: 0,
      totalCategories: 0,
      featuredProducts: 0
    };
  }
}

// ======================== EXPORTAR FUNCIONES ========================

// Hacer las funciones disponibles globalmente para compatibilidad
if (typeof window !== 'undefined') {
  window.apiService = {
    getProducts,
    getCategories,
    getAbsoluteCategories,
    getCarouselItems,
    getAutocomplete,
    getInfoSlides,
    getSiteStats,
    normalizeProduct,
    getProductImageUrl,
    normalizeApiResponse,
    cancelPreviousRequest
  };

  console.log("✅ apiService.js cargado y disponible globalmente");
}