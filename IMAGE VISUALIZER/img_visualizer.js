const container = document.querySelector(".container");
const items = document.querySelector(".items");
const indicator = document.querySelector(".indicator");
const previewImage = document.querySelector(".img_preview img");

// Config
let params = new URLSearchParams(window.location.search);
let archiveFile =  params.get("archive");

if (!archiveFile) {
  console.error("No se especificó ningún archivo en el parámetro 'archive'");
} else {
  cargarImagen(1, archiveFile);
}

let itemElements;
let itemImages;

const config = {
  activeItemOpacity: 0.3,
  scrollLerpFactor: 0.08,
  clickLerpFactor: 0.05,
  preloadCount: 2,
};

const state = {
  isHorizontal: window.innerWidth <= 900,
  dimensions: {
    itemSize: 0,
    containerSize: 0,
    indicatorSize: 0,
  },
  maxTranslate: 0,
  currentTranslate: 0,
  targetTranslate: 0,
  isClickMove: false,
  currentImageIndex: 0,
  touchStartY: 0,
  touchStartX: 0,
  isAnimating: false,
  loadedImages: new Set([0]),
};

function cargarImagen(i, carpeta) {
  const tempImg = new Image();
  tempImg.src = `IMAGE VISUALIZER/ASSETS/${carpeta}/${carpeta}_${i}.webp`;
  previewImage.src = `IMAGE VISUALIZER/ASSETS/${carpeta}/${carpeta}_1.webp`;
  tempImg.onload = function () {
    const div = document.createElement("div");
    div.classList.add("item", "lazy");
    div.setAttribute("aria-label", `Image ${i}`);
   
    const img = document.createElement("img");
    img.src = tempImg.src;
    img.alt = `Thumbnail ${i}`;
    img.setAttribute("data-src", tempImg.src);
    img.loading = "lazy";

    img.addEventListener("click", () => {
      previewImage.src = img.src;
      previewImage.alt = img.alt;
    });

    div.appendChild(img);
    items.appendChild(div);

    if (i === 1) {
      previewImage.src = img.src;
      previewImage.alt = img.alt;
    }

    cargarImagen(i + 1, carpeta);
  };

  tempImg.onerror = function () {
    console.log(`No se encontró ${carpeta}_${i}.webp. Fin.`);
    setTimeout(() => {
      initScrollVisualizer();
    }, 100);
  };
}

function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

function updateDimensions() {
  state.isHorizontal = window.innerWidth <= 900;

  if (state.isHorizontal) {
    state.dimensions = {
      itemSize: itemElements[0].getBoundingClientRect().width,
      containerSize: items.scrollWidth,
      indicatorSize: indicator.getBoundingClientRect().width,
    };
  } else {
    state.dimensions = {
      itemSize: itemElements[0].getBoundingClientRect().height,
      containerSize: items.scrollHeight,
      indicatorSize: indicator.getBoundingClientRect().height,
    };
  }

  state.maxTranslate = state.dimensions.containerSize - state.dimensions.indicatorSize;
}

function getItemIndicator() {
  itemImages.forEach((img) => (img.style.opacity = 1));

  const indicatorStart = Math.abs(state.currentTranslate);
  const indicatorEnd = indicatorStart + state.dimensions.indicatorSize;

  let maxOverlap = 0;
  let selectedIndex = 0;

  itemElements.forEach((item, index) => {
    const itemStart = index * state.dimensions.itemSize;
    const itemEnd = itemStart + state.dimensions.itemSize;

    const overlapStart = Math.max(indicatorStart, itemStart);
    const overlapEnd = Math.min(indicatorEnd, itemEnd);
    const overlap = Math.max(0, overlapEnd - overlapStart);

    if (overlap > maxOverlap) {
      maxOverlap = overlap;
      selectedIndex = index;
    }
  });

  itemImages[selectedIndex].style.opacity = config.activeItemOpacity;
  return selectedIndex;
}

function preloadImages(currentIndex) {
  const startIndex = Math.max(0, currentIndex - config.preloadCount);
  const endIndex = Math.min(itemElements.length - 1, currentIndex + config.preloadCount);

  for (let i = startIndex; i <= endIndex; i++) {
    if (!state.loadedImages.has(i)) {
      const img = itemImages[i];
      const originalSrc = img.getAttribute("src");
      const dataSrc = img.getAttribute("data-src");

      if (dataSrc && originalSrc.includes("placeholder")) {
        img.setAttribute("src", dataSrc);
        img.parentElement.classList.add("loading");

        img.onload = () => {
          img.parentElement.classList.remove("loading");
          state.loadedImages.add(i);
        };

        img.onerror = () => {
          img.parentElement.classList.remove("loading");
          img.setAttribute("src", originalSrc);
        };
      } else {
        state.loadedImages.add(i);
      }
    }
  }
}

function updatePreviewImage(index) {
  if (state.currentImageIndex !== index) {
    const targetItem = itemElements[index].querySelector("img");
    const targetSrc = targetItem.getAttribute("data-src") || targetItem.getAttribute("src");

    if (targetSrc) {
      previewImage.classList.add("loading");
      previewImage.setAttribute("src", targetSrc);

      previewImage.onload = () => {
        previewImage.classList.remove("loading");
      };

      state.currentImageIndex = index;
      preloadImages(index);
    }
  }
}

function updatePosition(value) {
  const transform = state.isHorizontal
    ? `translateX(${value}px)`
    : `translateY(${value}px)`;

  items.style.transform = transform;

  const activeIndex = getItemIndicator();
  updatePreviewImage(activeIndex);
}

function animate() {
  if (!state.isAnimating) return;

  const lerpFactor = state.isClickMove ? config.clickLerpFactor : config.scrollLerpFactor;
  state.currentTranslate = lerp(state.currentTranslate, state.targetTranslate, lerpFactor);

  if (Math.abs(state.currentTranslate - state.targetTranslate) > 0.1) {
    updatePosition(state.currentTranslate);
  } else {
    state.isClickMove = false;
  }

  requestAnimationFrame(animate);
}

function initScrollVisualizer() {
  // Actualizar referencias después de crear items e imágenes
  itemElements = document.querySelectorAll(".item");
  itemImages = document.querySelectorAll(".item img");

  updateDimensions();

  if (itemImages[0]) {
    itemImages[0].style.opacity = config.activeItemOpacity;
  }

  updatePreviewImage(0);

  itemElements.forEach((item, index) => {
    const img = item.querySelector("img");
    const src = img.getAttribute("src");

    if (index > 0) {
      img.setAttribute("data-src", src);
    } else {
      state.loadedImages.add(0);
    }
  });

  state.isAnimating = true;
  animate();

  setTimeout(() => preloadImages(0), 100);

  setupEventListeners();
}

function setupEventListeners() {
  container.addEventListener("wheel", (e) => {
    e.preventDefault();
    state.isClickMove = false;

    const delta = e.deltaY;
    const scrollVelocity = Math.min(Math.max(delta * 0.25, -10), 10);

    state.targetTranslate = Math.min(
      Math.max(state.targetTranslate - scrollVelocity, -state.maxTranslate),
      0
    );
  }, { passive: false });

  container.addEventListener("touchstart", (e) => {
    state.touchStartY = e.touches[0].clientY;
    state.touchStartX = e.touches[0].clientX;
  }, { passive: false });

  container.addEventListener("touchmove", (e) => {
    const isH = state.isHorizontal;
    const touch = e.touches[0];
    const delta = isH ? state.touchStartX - touch.clientX : state.touchStartY - touch.clientY;

    const scrollVelocity = Math.min(Math.max(delta * 0.25, -10), 10);
    state.targetTranslate = Math.min(
      Math.max(state.targetTranslate - scrollVelocity, -state.maxTranslate),
      0
    );

    if (isH) state.touchStartX = touch.clientX;
    else state.touchStartY = touch.clientY;

    e.preventDefault();
  }, { passive: false });

  itemElements.forEach((item, index) => {
    item.addEventListener("click", () => {
      state.isClickMove = true;
      state.targetTranslate = -index * state.dimensions.itemSize +
        (state.dimensions.indicatorSize - state.dimensions.itemSize) / 2;
      state.targetTranslate = Math.max(
        Math.min(state.targetTranslate, 0),
        -state.maxTranslate
      );
    });
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      updateDimensions();

      state.targetTranslate = Math.min(
        Math.max(state.targetTranslate, -state.maxTranslate),
        0
      );
      state.currentTranslate = state.targetTranslate;

      updatePosition(state.currentTranslate);
    }, 100);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      state.isAnimating = false;
    } else {
      state.isAnimating = true;
      requestAnimationFrame(animate);
    }
  });
}
