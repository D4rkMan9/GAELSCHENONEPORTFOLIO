
  // Obtener el parámetro de la URL (?archive=smlr)
  let params = new URLSearchParams(window.location.search);
  let archiveFile = params.get("archive");

  if (!archiveFile) {
    console.error("No se especificó ningún archivo en el parámetro 'archive'");
  } else {
    const previewImage = document.querySelector(".img_preview img");

    function cargarImagen(i, carpeta) {
      const tempImg = new Image();
      tempImg.src = `IMAGE VISUALIZER/ASSETS/${carpeta}/${carpeta}_${i}.webp`;
      tempImg.onload = function () {
        const div = document.createElement("div");
        div.classList.add("item", "lazy");
        div.setAttribute("aria-label", `Image ${i}`);

        const img = document.createElement("img");
        img.src = tempImg.src;
        img.alt = `Thumbnail ${i}`;

        img.addEventListener("click", () => {
          previewImage.src = img.src;
          previewImage.alt = img.alt;
        });

        div.appendChild(img);
        document.querySelector(".items").appendChild(div);

        cargarImagen(i + 1, carpeta);
      };

      tempImg.onerror = function () {
        console.log(`No se encontró ${carpeta}_${i}.webp. Fin.`);
        // Cuando termina de cargar, iniciar la funcionalidad de scroll
        setTimeout(() => {
          initScrollVisualizer();
        }, 100);
      };
    }

    previewImage.src = `IMAGE VISUALIZER/ASSETS/${archiveFile}/${archiveFile}_1.webp`;
    previewImage.alt = `Gallery image 1`;

    cargarImagen(1, archiveFile);
  }

  function initScrollVisualizer() {
    const container = document.querySelector(".container");
    const items = document.querySelector(".items");
    const indicator = document.querySelector(".indicator");
    const itemElements = document.querySelectorAll(".item");
    const previewImage = document.querySelector(".img_preview img");
    const itemImages = document.querySelectorAll(".item img");

    const config = {
      activeItemOpacity: 0.3,
      scrollLerpFactor: 0.075,
      clickLerpFactor: 0.1,
      snapDelay: 100,
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
      isSnapping: false,
    };

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
      return state.dimensions;
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
          previewImage.onload = () => previewImage.classList.remove("loading");
          state.currentImageIndex = index;
          preloadImages(index);
        }
      }
    }

    function animate() {
      if (!state.isAnimating) return;

      let lerpFactor = config.scrollLerpFactor;
      if (state.isClickMove) lerpFactor = config.clickLerpFactor;
      else if (state.isSnapping) lerpFactor = 0.15;

      state.currentTranslate = lerp(state.currentTranslate, state.targetTranslate, lerpFactor);

      if (Math.abs(state.currentTranslate - state.targetTranslate) > 0.1) {
        const transform = state.isHorizontal
          ? `translateX(${state.currentTranslate}px)`
          : `translateY(${state.currentTranslate}px)`;

        items.style.transform = transform;
        const activeIndex = getItemIndicator();
        updatePreviewImage(activeIndex);
      } else {
        state.isClickMove = false;
        state.isSnapping = false;
        state.currentTranslate = state.targetTranslate;
        const transform = state.isHorizontal
          ? `translateX(${state.currentTranslate}px)`
          : `translateY(${state.currentTranslate}px)`;
        items.style.transform = transform;
      }

      requestAnimationFrame(animate);
    }

    function setupEventListeners() {
      container.addEventListener("wheel", (e) => {
        e.preventDefault();
        state.isClickMove = false;
        state.isSnapping = false;

        const delta = e.deltaY;
        const scrollVelocity = Math.min(Math.max(delta * 0.5, -20), 20);

        state.targetTranslate = Math.min(
          Math.max(state.targetTranslate - scrollVelocity, -state.maxTranslate),
          0
        );
      }, { passive: false });

      container.addEventListener("touchstart", (e) => {
        state.touchStartY = e.touches[0].clientY;
        state.touchStartX = e.touches[0].clientX;
        state.isSnapping = false;
      }, { passive: false });

      container.addEventListener("touchmove", (e) => {
        if (state.isHorizontal) {
          const touchX = e.touches[0].clientX;
          const deltaX = state.touchStartX - touchX;
          const scrollVelocity = Math.min(Math.max(deltaX * 0.5, -20), 20);
          state.targetTranslate = Math.min(
            Math.max(state.targetTranslate - scrollVelocity, -state.maxTranslate),
            0
          );
          state.touchStartX = touchX;
        } else {
          const touchY = e.touches[0].clientY;
          const deltaY = state.touchStartY - touchY;
          const scrollVelocity = Math.min(Math.max(deltaY * 0.5, -20), 20);
          state.targetTranslate = Math.min(
            Math.max(state.targetTranslate - scrollVelocity, -state.maxTranslate),
            0
          );
          state.touchStartY = touchY;
        }
        e.preventDefault();
      }, { passive: false });

      itemElements.forEach((item, index) => {
        item.addEventListener("click", () => {
          state.isClickMove = true;
          state.isSnapping = false;

          const targetPosition = -index * state.dimensions.itemSize +
            (state.dimensions.indicatorSize - state.dimensions.itemSize) / 2;

          state.targetTranslate = Math.max(
            Math.min(targetPosition, 0),
            -state.maxTranslate
          );
        });
      });

      window.addEventListener("resize", () => {
        updateDimensions();
        state.targetTranslate = Math.min(
          Math.max(state.targetTranslate, -state.maxTranslate),
          0
        );
        state.currentTranslate = state.targetTranslate;
        const transform = state.isHorizontal
          ? `translateX(${state.currentTranslate}px)`
          : `translateY(${state.currentTranslate}px)`;
        items.style.transform = transform;
      });

      document.addEventListener("keydown", (e) => {
        const currentIndex = getItemIndicator();
        let newIndex = currentIndex;

        if ((e.key === "ArrowDown" && !state.isHorizontal) || (e.key === "ArrowRight" && state.isHorizontal)) {
          newIndex = Math.min(currentIndex + 1, itemElements.length - 1);
        } else if ((e.key === "ArrowUp" && !state.isHorizontal) || (e.key === "ArrowLeft" && state.isHorizontal)) {
          newIndex = Math.max(currentIndex - 1, 0);
        }

        if (newIndex !== currentIndex) {
          state.isClickMove = true;
          state.isSnapping = false;
          const targetPosition = -newIndex * state.dimensions.itemSize +
            (state.dimensions.indicatorSize - state.dimensions.itemSize) / 2;

          state.targetTranslate = Math.max(
            Math.min(targetPosition, 0),
            -state.maxTranslate
          );
        }
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

    updateDimensions();
    itemImages[0].style.opacity = config.activeItemOpacity;
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
