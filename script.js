class JuliaFractal {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.imageData = null;
        this.data = null;
        this.cReal = -0.8;
        this.cImag = 0.156;
        this.zoom = 1;
        this.maxIter = 40;
        this.time = 0;
        this.speed = 0.005;

        if (window.innerWidth <= 900) {
            this.maxIter = 25; // Menos iteraciones en mobile
        }

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }

    resize() {
        const isMobile = window.innerWidth <= 900;
        // Ajusta el factor de escala según la resolución para mejorar la visualización y el rendimiento
        let scaleFactor;
        if (window.innerWidth <= 480) {
            scaleFactor = 0.25; // Ajustado para móviles muy pequeños
        } else if (window.innerWidth <= 900) {
            scaleFactor = 0.35; // Móviles y tablets
        } else if (window.innerWidth <= 1600) {
            scaleFactor = 0.4; // Pantallas medianas
        } else {
            scaleFactor = 0.5; // Pantallas grandes
        }

        this.width = Math.max(200, (window.innerWidth * (isMobile ? 1 : 0.2)) * scaleFactor);
        this.height = Math.max(120, (window.innerHeight * (isMobile ? 0.4 : 1)) * scaleFactor);

        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = `${this.width / scaleFactor}px`;
        this.canvas.style.height = `${this.height / scaleFactor}px`;

        this.imageData = this.ctx.createImageData(this.width, this.height);
        this.data = this.imageData.data;
    }

    julia(x, y) {
        const scale = Math.min(this.width, this.height) / 4;
        let zReal = (y - this.height / 2) / scale / this.zoom;
        let zImag = -(x - this.width / 2) / scale / this.zoom;
        let iter = 0;

        while (iter < this.maxIter && zReal * zReal + zImag * zImag < 4) {
            let temp = zReal * zReal - zImag * zImag + this.cReal;
            zImag = 2 * zReal * zImag + this.cImag;
            zReal = temp;
            iter++;
        }

        return iter;
    }

    render() {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const iter = this.julia(x, y);
                const i = (y * this.width + x) * 4;

                if (iter === this.maxIter) {
                    this.data[i] = this.data[i + 1] = this.data[i + 2] = this.data[i + 3] = 0;
                } else {
                    const intensity = Math.sin(iter * 0.2 + this.time) * 0.4 + 0.8;
                    const alpha = Math.min(200, iter * 5) * intensity;
                    this.data[i] = this.data[i + 1] = this.data[i + 2] = 255;
                    this.data[i + 3] = alpha;
                }
            }
        }

        this.ctx.putImageData(this.imageData, 0, 0);
    }

    animate() {
        this.time += this.speed;
        this.zoom = 4 + Math.sin(this.time * 0.3) * 0.5;
        this.cReal = -0.8 + Math.sin(this.time * 0.3) * 0.02;
        this.cImag = 0.156 + Math.cos(this.time * 0.2) * 0.015;

        this.render();
        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('juliaCanvas');
    if (canvas) {
        new JuliaFractal(canvas);
    }
});



const items = document.querySelectorAll(".item");
const ce = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

items.forEach(item => {
  const link = item.querySelector("a");
  if (!link) return;

  const originalText = link.textContent;
  let intervalId;

  item.addEventListener("mouseenter", () => {
    let count = 0;
    const maxLoops = originalText.length;
    const intervalTime = 30 + (0.2 * originalText.length); // Ajusta el tiempo del intervalo según la longitud del texto

    clearInterval(intervalId);

    intervalId = setInterval(() => {
      let displayedText = "";

      for (let i = 0; i < originalText.length; i++) {
        if (i < count) {
          displayedText += originalText[i];
        } else {
          displayedText += ce[Math.floor(Math.random() * ce.length)];
        }
      }

      link.textContent = displayedText;

      count++;
      if (count > maxLoops) {
        clearInterval(intervalId);
        link.textContent = originalText;
      }
    }, intervalTime);
  });


});
