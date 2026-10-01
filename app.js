import { db } from "./firebase-config.js";
import { ref, onValue, set, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Elementos da Interface
const songGrid = document.getElementById('songGrid');
const likedSongGrid = document.getElementById('likedSongGrid');
const homeView = document.getElementById('homeView');
const likedView = document.getElementById('likedView');
const btnNavHome = document.getElementById('btnNavHome');
const btnNavLiked = document.getElementById('btnNavLiked');

const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const currentTitle = document.getElementById('currentTitle');
const currentArtist = document.getElementById('currentArtist');
const currentCover = document.getElementById('currentCover');
const playerHeartBtn = document.getElementById('playerHeartBtn');

const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const totalDurationEl = document.getElementById('totalDuration');
const volumeSlider = document.getElementById('volumeSlider');
const likedCountText = document.getElementById('likedCountText');
const likedBannerSubtitle = document.getElementById('likedBannerSubtitle');

// Estado da Aplicação
let songsList = [];
let likedSongIds = [];
let currentIndex = -1;
let isPlaying = false;

// ID do Utilizador (Gera um ID único para esta sessão e guarda localmente para identificar no Firebase)
let userId = localStorage.getItem('spotify_user_id');
if (!userId) {
  userId = 'user_' + Math.random().toString(36).substring(2, 9);
  localStorage.setItem('spotify_user_id', userId);
}

// 1. CARREGAR MÚSICAS DO FIREBASE (NO 'songs')
onValue(ref(db, 'songs'), (snapshot) => {
  const data = snapshot.val();
  songsList = [];

  if (data) {
    Object.keys(data).forEach((id) => {
      songsList.push({ id, ...data[id] });
    });
  }

  renderHomeSongs();
  renderLikedSongs();
});

// 2. ESCUTAR MÚSICAS CURTIDAS DO BANCO DE DADOS EM TEMPO REAL (`likes/${userId}`)
onValue(ref(db, `likes/${userId}`), (snapshot) => {
  const data = snapshot.val();
  likedSongIds = data ? Object.keys(data) : [];

  renderHomeSongs();
  renderLikedSongs();
  updateLikedCount();
  updatePlayerHeart();
});

// 3. ALTERNAR ENTRE VISTAS (PÁGINAS)
function showView(view) {
  if (view === 'home') {
    homeView.classList.remove('hidden');
    likedView.classList.add('hidden');
    btnNavHome.classList.add('active');
    btnNavLiked.classList.remove('active');
  } else if (view === 'liked') {
    homeView.classList.add('hidden');
    likedView.classList.remove('hidden');
    btnNavHome.classList.remove('active');
    btnNavLiked.classList.add('active');
  }
}

btnNavHome.addEventListener('click', (e) => {
  e.preventDefault();
  showView('home');
});

btnNavLiked.addEventListener('click', () => {
  showView('liked');
});

// 4. RENDERIZAR MÚSICAS DISPONÍVEIS (INÍCIO)
function renderHomeSongs() {
  songGrid.innerHTML = '';

  if (songsList.length === 0) {
    songGrid.innerHTML = '<p style="color: #b3b3b3; grid-column: 1/-1;">Nenhuma música disponível no momento.</p>';
    return;
  }

  songsList.forEach((song) => {
    const isLiked = likedSongIds.includes(song.id);
    const card = document.createElement('div');
    card.className = 'song-card';

    card.innerHTML = `
      <div class="card-cover">
        <img src="${song.coverUrl}" alt="${song.title}" onerror="this.src='https://via.placeholder.com/300?text=Capa'">
        <button class="card-like-btn ${isLiked ? 'liked' : ''}" data-id="${song.id}">
          <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
        </button>
        <button class="card-play-btn">
          <i class="fa-solid fa-play"></i>
        </button>
      </div>
      <h4>${song.title}</h4>
      <p>${song.artist}</p>
    `;

    card.querySelector('.card-play-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      playSongById(song.id);
    });

    card.querySelector('.card-like-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLikeSong(song.id);
    });

    card.addEventListener('click', () => playSongById(song.id));
    songGrid.appendChild(card);
  });
}

// 5. RENDERIZAR MÚSICAS CURTIDAS (PÁGINA DEDICADA)
function renderLikedSongs() {
  likedSongGrid.innerHTML = '';
  const likedSongs = songsList.filter(song => likedSongIds.includes(song.id));

  if (likedSongs.length === 0) {
    likedSongGrid.innerHTML = '<p style="color: #b3b3b3; grid-column: 1/-1;">Ainda não adicionaste nenhuma música às tuas curtidas.</p>';
    return;
  }

  likedSongs.forEach((song) => {
    const card = document.createElement('div');
    card.className = 'song-card';

    card.innerHTML = `
      <div class="card-cover">
        <img src="${song.coverUrl}" alt="${song.title}" onerror="this.src='https://via.placeholder.com/300?text=Capa'">
        <button class="card-like-btn liked" data-id="${song.id}">
          <i class="fa-solid fa-heart"></i>
        </button>
        <button class="card-play-btn">
          <i class="fa-solid fa-play"></i>
        </button>
      </div>
      <h4>${song.title}</h4>
      <p>${song.artist}</p>
    `;

    card.querySelector('.card-play-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      playSongById(song.id);
    });

    card.querySelector('.card-like-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLikeSong(song.id);
    });

    card.addEventListener('click', () => playSongById(song.id));
    likedSongGrid.appendChild(card);
  });
}

// 6. ADICIONAR / REMOVER FAVORITO NO FIREBASE REALTIME DATABASE
async function toggleLikeSong(songId) {
  const likeRef = ref(db, `likes/${userId}/${songId}`);

  if (likedSongIds.includes(songId)) {
    // Se já curtida, remove do banco de dados
    await remove(likeRef);
  } else {
    // Se não curtida, adiciona ao banco de dados
    await set(likeRef, true);
  }
}

function updateLikedCount() {
  const count = likedSongIds.length;
  const text = `Playlist • ${count} ${count === 1 ? 'música' : 'músicas'}`;
  likedCountText.textContent = text;
  likedBannerSubtitle.textContent = text;
}

// 7. CONTROLO DO PLAYER DE ÁUDIO
function playSongById(id) {
  const index = songsList.findIndex(s => s.id === id);
  if (index !== -1) loadAndPlaySong(index);
}

function loadAndPlaySong(index) {
  if (index < 0 || index >= songsList.length) return;

  currentIndex = index;
  const song = songsList[currentIndex];

  audioPlayer.src = song.audioUrl;
  currentTitle.textContent = song.title;
  currentArtist.textContent = song.artist;
  currentCover.src = song.coverUrl;

  audioPlayer.play();
  isPlaying = true;
  updatePlayIcon();
  updatePlayerHeart();
}

function updatePlayIcon() {
  playBtn.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
}

function updatePlayerHeart() {
  if (currentIndex === -1) return;
  const song = songsList[currentIndex];
  const isLiked = likedSongIds.includes(song.id);

  if (isLiked) {
    playerHeartBtn.classList.add('liked');
    playerHeartBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
  } else {
    playerHeartBtn.classList.remove('liked');
    playerHeartBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
  }
}

playerHeartBtn.addEventListener('click', () => {
  if (currentIndex !== -1) {
    toggleLikeSong(songsList[currentIndex].id);
  }
});

playBtn.addEventListener('click', () => {
  if (currentIndex === -1 && songsList.length > 0) {
    loadAndPlaySong(0);
    return;
  }
  if (isPlaying) {
    audioPlayer.pause();
    isPlaying = false;
  } else {
    audioPlayer.play();
    isPlaying = true;
  }
  updatePlayIcon();
});

prevBtn.addEventListener('click', () => {
  if (songsList.length === 0) return;
  const newIndex = currentIndex - 1 < 0 ? songsList.length - 1 : currentIndex - 1;
  loadAndPlaySong(newIndex);
});

nextBtn.addEventListener('click', () => {
  if (songsList.length === 0) return;
  const newIndex = (currentIndex + 1) % songsList.length;
  loadAndPlaySong(newIndex);
});

// Barra de progresso e volume
audioPlayer.addEventListener('timeupdate', () => {
  if (!isNaN(audioPlayer.duration) && audioPlayer.duration > 0) {
    const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.value = progressPercent || 0;
    currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    totalDurationEl.textContent = formatTime(audioPlayer.duration);
  }
});

progressBar.addEventListener('input', () => {
  if (!isNaN(audioPlayer.duration)) {
    audioPlayer.currentTime = (progressBar.value / 100) * audioPlayer.duration;
  }
});

volumeSlider.addEventListener('input', (e) => {
  audioPlayer.volume = e.target.value / 100;
});

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}