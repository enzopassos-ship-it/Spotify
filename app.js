import { db } from "./firebase-config.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Elementos do Player Principal
const songContainer = document.getElementById('songContainer');
const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const progressBar = document.getElementById('progressBar');
const currentTitle = document.getElementById('currentTitle');
const currentArtist = document.getElementById('currentArtist');
const currentCover = document.getElementById('currentCover');
const volumeBar = document.getElementById('volumeBar');

// Elementos do Modal Fullscreen
const fullPlayerModal = document.getElementById('fullPlayerModal');
const closeFullPlayer = document.getElementById('closeFullPlayer');
const nowPlayingBar = document.getElementById('nowPlayingBar');
const fullCover = document.getElementById('fullCover');
const fullTitle = document.getElementById('fullTitle');
const fullArtist = document.getElementById('fullArtist');
const fullPlayBtn = document.getElementById('fullPlayBtn');
const fullProgressBar = document.getElementById('fullProgressBar');

let playlist = [];
let currentSongIndex = 0;
let isPlaying = false;

// Leitura em tempo real
onValue(ref(db, 'songs'), (snapshot) => {
  playlist = [];
  const data = snapshot.val();
  
  if (data) {
    Object.keys(data).forEach((id) => {
      playlist.push({ id, ...data[id] });
    });
  }
  
  renderSongs(playlist);
});

function renderSongs(songs) {
  songContainer.innerHTML = '';

  songs.forEach((song, index) => {
    const card = document.createElement('div');
    card.classList.add('song-card');
    card.innerHTML = `
      <img src="${song.coverUrl}" alt="${song.title}">
      <h4>${song.title}</h4>
      <p>${song.artist}</p>
    `;
    
    // Clica no card -> toca a música e abre o player em ecrã inteiro
    card.addEventListener('click', () => {
      playSong(index);
      openModal();
    });
    
    songContainer.appendChild(card);
  });
}

function playSong(index) {
  currentSongIndex = index;
  const song = playlist[currentSongIndex];

  audioPlayer.src = song.audioUrl;
  
  // Atualiza a barra de baixo
  currentTitle.textContent = song.title;
  currentArtist.textContent = song.artist;
  currentCover.src = song.coverUrl;

  // Atualiza o modal grande
  fullTitle.textContent = song.title;
  fullArtist.textContent = song.artist;
  fullCover.src = song.coverUrl;

  audioPlayer.play();
  isPlaying = true;
  updatePlayIcons('⏸');
}

function togglePlay() {
  if (!playlist.length) return;

  if (isPlaying) {
    audioPlayer.pause();
    updatePlayIcons('▶');
  } else {
    audioPlayer.play();
    updatePlayIcons('⏸');
  }
  isPlaying = !isPlaying;
}

function updatePlayIcons(icon) {
  playBtn.textContent = icon;
  fullPlayBtn.textContent = icon;
}

// Controlos de Play/Pause
playBtn.addEventListener('click', togglePlay);
fullPlayBtn.addEventListener('click', togglePlay);

// Abrir e Fechar Modal
function openModal() {
  if (playlist.length > 0) {
    fullPlayerModal.classList.remove('hidden');
  }
}

nowPlayingBar.addEventListener('click', openModal);
closeFullPlayer.addEventListener('click', () => fullPlayerModal.classList.add('hidden'));

// Sincronização do Tempo e Barras de Progresso
audioPlayer.addEventListener('timeupdate', () => {
  if (audioPlayer.duration) {
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.value = progress;
    fullProgressBar.value = progress;
  }
});

function seekAudio(e) {
  if (audioPlayer.duration) {
    audioPlayer.currentTime = (e.target.value / 100) * audioPlayer.duration;
  }
}

progressBar.addEventListener('input', seekAudio);
fullProgressBar.addEventListener('input', seekAudio);

volumeBar.addEventListener('input', (e) => {
  audioPlayer.volume = e.target.value;
});