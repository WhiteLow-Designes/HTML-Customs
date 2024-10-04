const media = document.getElementById("media");
const playlist = document.getElementById("playlist").getElementsByTagName("li");
let currentTrack = 0;

// Lade das erste Element der Playlist
loadMedia(currentTrack);

function loadMedia(index) {
    // Setze die Quelle des Videos oder Audios auf den 'data-src'-Attribut-Wert
    const src = playlist[index].getAttribute("data-src");
    media.src = src;
    media.load();

    // Aktiviere den aktuellen Track in der Playlist
    updatePlaylistUI(index);
}

function playMedia() {
    media.play();
}

function pauseMedia() {
    media.pause();
}

function prevMedia() {
    currentTrack = currentTrack === 0 ? playlist.length - 1 : currentTrack - 1;
    loadMedia(currentTrack);
    playMedia();
}

function nextMedia() {
    currentTrack = (currentTrack + 1) % playlist.length;
    loadMedia(currentTrack);
    playMedia();
}

function updatePlaylistUI(index) {
    // Entferne alle aktiven Klassen
    for (let i = 0; i < playlist.length; i++) {
        playlist[i].classList.remove("active");
    }
    // Setze die aktive Klasse für den aktuellen Track
    playlist[index].classList.add("active");
}

// Klicken auf einen Titel in der Playlist
for (let i = 0; i < playlist.length; i++) {
    playlist[i].addEventListener("click", function() {
        currentTrack = i;
        loadMedia(currentTrack);
        playMedia();
    });
}

// Automatischer Wechsel zum nächsten Track, wenn einer endet
media.addEventListener("ended", function() {
    nextMedia();
});