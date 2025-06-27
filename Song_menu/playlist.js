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
