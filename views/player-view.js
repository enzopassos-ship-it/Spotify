// Procura no index.html os elementos usados pelo player.
// Devolve esses elementos para o arquivo que controla os cliques e a reprodução.
export function pegarElementosDoPlayer() {
  return {
    audioPlayer: document.getElementById("audioPlayer"),
    currentCover: document.getElementById("currentCover"),
    currentTitle: document.getElementById("currentTitle"),
    currentArtist: document.getElementById("currentArtist"),
    playerHeartBtn: document.getElementById("playerHeartBtn"),
    shuffleBtn: document.getElementById("shuffleBtn"),
    prevBtn: document.getElementById("prevBtn"),
    playBtn: document.getElementById("playBtn"),
    nextBtn: document.getElementById("nextBtn"),
    repeatBtn: document.getElementById("repeatBtn"),
    currentTime: document.getElementById("currentTime"),
    progressBar: document.getElementById("progressBar"),
    totalDuration: document.getElementById("totalDuration"),
    volumeBtn: document.getElementById("volumeBtn"),
    volumeSlider: document.getElementById("volumeSlider"),
    btnNavHome: document.getElementById("btnNavHome"),
    btnNavLiked: document.getElementById("btnNavLiked"),
    songGrid: document.getElementById("songGrid"),
    likedSongGrid: document.getElementById("likedSongGrid"),
    likedCountText: document.getElementById("likedCountText"),
    likedBannerSubtitle: document.getElementById("likedBannerSubtitle"),
    homeView: document.getElementById("homeView"),
    likedView: document.getElementById("likedView")
  };
}

// Recebe uma música e informa se ela está curtida.
// Cria o cartão que aparece na página e guarda nele o ID da música
// para que os botões saibam qual faixa foi clicada.
export function montarCartaoDeMusica(song, isLiked) {
  const card = document.createElement("article");
  card.className = "song-card";
  // O arquivo de controle usa este ID para encontrar a música clicada.
  card.dataset.songId = song.id;
  card.innerHTML = `
    <div class="card-cover">
      <img src="${song.coverUrl}" alt="${song.title}" onerror="this.src='assets/cover-placeholder.svg'">
      <button class="card-like-btn ${isLiked ? "liked" : ""}" data-action="like" data-song-id="${song.id}" title="Curtir">
        <i class="${isLiked ? "fa-solid" : "fa-regular"} fa-heart"></i>
      </button>
      <button class="card-play-btn" data-action="play" data-song-id="${song.id}" title="Reproduzir">
        <i class="fa-solid fa-play"></i>
      </button>
    </div>
    <h4>${song.title}</h4>
    <p>${song.artist}</p>
  `;
  return card;
}

// Recebe a lista de músicas e os IDs das curtidas.
// Apaga os cartões antigos e desenha de novo as listas da página.
export function mostrarMusicasNaTela(songs, likedSongIds, elements) {
  elements.songGrid.replaceChildren();
  elements.likedSongGrid.replaceChildren();

  for (const song of songs) {
    const isLiked = likedSongIds.includes(song.id);
    elements.songGrid.appendChild(montarCartaoDeMusica(song, isLiked));
    if (isLiked) {
      elements.likedSongGrid.appendChild(montarCartaoDeMusica(song, true));
    }
  }
}

// Recebe "home" ou "liked" e mostra a parte escolhida da página.
export function mostrarPaginaEscolhida(view, elements) {
  const mostrarCurtidas = view === "liked";
  elements.homeView.classList.toggle("hidden", mostrarCurtidas);
  elements.likedView.classList.toggle("hidden", !mostrarCurtidas);
  elements.btnNavHome.classList.toggle("active", !mostrarCurtidas);
  elements.btnNavLiked.classList.toggle("active", mostrarCurtidas);
}

// Recebe o número de músicas curtidas e atualiza os dois contadores da página.
export function atualizarContadorDeCurtidas(count, elements) {
  const text = `Playlist • ${count} ${count === 1 ? "música" : "músicas"}`;
  elements.likedCountText.textContent = text;
  elements.likedBannerSubtitle.textContent = text;
}

// Recebe a música escolhida na lista e mostra sua capa, título e artista.
// Também coloca o endereço do áudio no player do navegador.
export function atualizarPlayerComMusica(song, elements) {
  elements.currentCover.src = song.coverUrl || "assets/cover-placeholder.svg";
  elements.currentCover.onerror = () => {
    elements.currentCover.src = "assets/cover-placeholder.svg";
  };
  elements.currentTitle.textContent = song.title;
  elements.currentArtist.textContent = song.artist;
  elements.audioPlayer.src = song.audioUrl;
  elements.audioPlayer.load();
}

// Recebe true se a música está tocando e false se está pausada.
// Troca o desenho do botão para mostrar play ou pause.
export function atualizarBotaoPlayPause(isPlaying, elements) {
  elements.playBtn.innerHTML = `<i class="fa-solid fa-${isPlaying ? "pause" : "play"}"></i>`;
}

// Recebe true se a música está curtida e mostra o coração correspondente.
export function atualizarCoracaoDoPlayer(isLiked, elements) {
  elements.playerHeartBtn.classList.toggle("liked", isLiked);
  elements.playerHeartBtn.innerHTML = `<i class="${isLiked ? "fa-solid" : "fa-regular"} fa-heart"></i>`;
}

// Recebe o tempo atual e a duração do áudio, em segundos.
// Atualiza os tempos e a posição da barra de progresso.
export function atualizarProgressoDoPlayer(currentTime, duration, elements) {
  elements.currentTime.textContent = formatarTempo(currentTime);
  elements.totalDuration.textContent = formatarTempo(duration);
  elements.progressBar.value = String((currentTime / duration) * 100);
  elements.progressBar.style.background = `linear-gradient(to right, #1fdf64 ${elements.progressBar.value}%, #4d4d4d ${elements.progressBar.value}%)`;
}

// Recebe um tempo em segundos e transforma em minutos e segundos.
// Por exemplo: 125 vira "2:05".
function formatarTempo(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

// Recebe o volume do controle, que vai de 0 a 100.
// Ajusta o áudio e mostra o ícone de volume adequado.
export function atualizarVolumeDoPlayer(value, elements) {
  const volume = Number(value);
  elements.audioPlayer.volume = volume / 100;
  elements.volumeSlider.style.background = `linear-gradient(to right, #1fdf64 ${volume}%, #4d4d4d ${volume}%)`;

  const icon = elements.volumeBtn.querySelector("i");
  if (volume === 0) icon.className = "fa-solid fa-volume-xmark";
  else if (volume < 50) icon.className = "fa-solid fa-volume-low";
  else icon.className = "fa-solid fa-volume-high";
}
