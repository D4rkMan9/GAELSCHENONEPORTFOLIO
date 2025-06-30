let progress = document.querySelector("#song_time");
let song = document.querySelector("#song");
let cd_button = document.querySelector(".cd_player");
let current_time = document.querySelector("#time_current");
let volume_bar = document.querySelector("#volume_indicator");
let volume_box = document.querySelector(".volumen_ux");


// Obtener el parámetro de la URL
let params = new URLSearchParams(window.location.search);
let songTitle = params.get("song");

if (songTitle) {
    song.src = `/GAELSCHENONEPORTFOLIO/CDPLAYER/dasong/${songTitle}`;
    
}


volume_bar.disabled = true;
let progressInterval;

song.onloadedmetadata = function () {
    if (!isNaN(song.duration)) {
        progress.max = song.duration;
    }
    progress.value = song.currentTime;
    song.volume = 0.7;
    volume_bar.value = song.volume * 100;
    volume_bar.max = 100;
    updateSliderColor("time");
    updateSliderColor("vol");
};

// Función de reproducción y pausa
function reproducir() {
    cd_button.style.transform = "scale(0.95)"; // Reiniciar rotación al reproducir
    setTimeout(() => {
        cd_button.style.transform = "scale(1)"; // Volver a la escala original
    }, 100);
    
    if (song.paused) {
        song.play();
        iniciarRotacion();
        iniciarIntervaloProgreso();
    } else {
        song.pause();
        detenerRotacion(); 
        detenerIntervaloProgreso();
    }
}

function iniciarIntervaloProgreso() {
    detenerIntervaloProgreso(); // Limpiar cualquier intervalo previo
    progressInterval = setInterval(() => {
        progress.value = song.currentTime;
        updateSliderColor("time");
    }, 500);
}

function detenerIntervaloProgreso() {
    clearInterval(progressInterval);
}

let rotacion = 0;
let rotando = false;
let intervalo;

// Rotación del CD
function iniciarRotacion() {
    if (!rotando) {
        rotando = true;
        intervalo = setInterval(() => {
            cd_button.style.transform = `rotate(${(song.currentTime*50)}deg)`;
        }, 50);
    }
}

function detenerRotacion() {
    rotando = false;
    clearInterval(intervalo);
}

// Detener rotación cuando la canción termine
song.onended = function () {
    detenerRotacion();
    detenerIntervaloProgreso();
};

// Control del teclado para reproducción con espacio
document.addEventListener("keydown", function (event) {
    if (event.code === "Space") {
        event.preventDefault(); // Evita el scroll al presionar espacio
        reproducir();
    } else if (event.code === "ArrowUp") {
        event.preventDefault(); // Evita el scroll
        volumeUp();
    } else if (event.code === "ArrowDown") {
        event.preventDefault(); // Evita el scroll
        volumeDown();
    }
});

progress.oninput = function () {
    song.currentTime = progress.value;
    updateSliderColor("time");
};

progress.onchange = function () {
    song.play();
    iniciarRotacion();
    iniciarIntervaloProgreso();
};

// Controles de volumen
let soundPlaying = false;

function volumeUp() {
    song.volume = Math.min(song.volume + 0.05, 1);
    volume_update();
    
    if (!soundPlaying) {
        soundPlaying = true;
        setTimeout(() => { 
            playSound("-");
            soundPlaying = false;
        }, 100);
    }
}

function volumeDown() {
    song.volume = Math.max(song.volume - 0.05, 0);
    volume_update();
    
    if (!soundPlaying) {
        soundPlaying = true;
        setTimeout(() => { 
            playSound("-");
            soundPlaying = false;
        }, 100);
    }
} 

// Actualización del color del slider
function updateSliderColor(tipo) {
    let value, max, slider;

    if (tipo === "vol") {
        value = volume_bar.value;
        max = 100;
        slider = volume_bar;
    } else {
        value = progress.value;
        max = progress.max;
        slider = progress;
    }

    const percent = (value / max) * 100;
    slider.style.setProperty("--value-percent", `${percent}%`);
}

// Temporizador del tema y actualización de la barra de progreso
song.ontimeupdate = function () {
    let tiempoActual = Math.floor(song.currentTime);
    let minutos = Math.floor(tiempoActual / 60);
    let segundos = tiempoActual % 60;

    segundos = segundos < 10 ? "0" + segundos : segundos;
    minutos = minutos < 10 ? "0" + minutos : minutos;

    current_time.innerHTML = `${minutos}:${segundos}`;

    updateSliderColor("time");
};

//VOLUMEN BARRA
let volumeTimeout;

function volume_update() {
    updateSliderColor("vol");
    volume_bar.value = song.volume * 100;
    volume_bar.style.setProperty("--value-percent", `${song.volume * 100}%`);

    volume_box.style.zIndex = 1;
    volume_box.style.opacity = 1;

    clearTimeout(volumeTimeout);
    volumeTimeout = setTimeout(() => {   
        volume_box.style.opacity = 0;
        setTimeout(() => {
            volume_box.style.zIndex = -10; 
        }, 200);
    }, 1500);
}

// SFX FUNCTION JEJE
function playSound(sfx) {
    let sound;
    if (sfx == "-") {
        sound = new Audio("/GAELSCHENONEPORTFOLIO/CDPLAYER/dasong/select_001.ogg");
    } else if (sfx == "+") {
        sound = new Audio("/GAELSCHENONEPORTFOLIO/CDPLAYER/dasong/select_002.ogg");
    }
    sound.volume = Math.min(song.volume, 1);
    sound.play();
}
