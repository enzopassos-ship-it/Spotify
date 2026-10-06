import { pegarIdDoNavegador, acompanharCurtidasDoUsuario, salvarOuRemoverCurtida } from "../models/likes-model.js";
import { acompanharMusicasDoFirebase } from "../models/songs-model.js";
import {
  pegarElementosDoPlayer,
  atualizarPlayerComMusica,
  atualizarContadorDeCurtidas,
  atualizarCoracaoDoPlayer,
  atualizarBotaoPlayPause,
  atualizarProgressoDoPlayer,
  mostrarMusicasNaTela,
  atualizarVolumeDoPlayer,
  mostrarPaginaEscolhida
} from "../views/player-view.js";

// Prepara o player quando o index.html abre.
// Liga os botões da página às músicas, às curtidas e ao desenho da tela.
export function iniciarPlayer() {
  // Busca os botões, listas e textos que já existem no index.html.
  const elements = pegarElementosDoPlayer();
  // Usa um identificador salvo neste navegador para guardar as curtidas.
  const userId = pegarIdDoNavegador();

  // Guarda as músicas, as curtidas, a faixa atual e o último volume usado.
  let songsList = [];
  let likedSongIds = [];
  let currentIndex = -1;
  let lastVolume = Number(elements.volumeSlider.value) || 80;

  // Atualiza os cartões e o contador usando as músicas e curtidas recebidas.
  function atualizarMusicasNaTela() {
    mostrarMusicasNaTela(songsList, likedSongIds, elements);
    atualizarContadorDeCurtidas(likedSongIds.length, elements);
  }

  // Confere se a música que está tocando foi curtida e atualiza o coração.
  function atualizarCoracaoDaFaixa() {
    const currentSong = songsList[currentIndex];
    const isLiked = currentSong ? likedSongIds.includes(currentSong.id) : false;
    atualizarCoracaoDoPlayer(isLiked, elements);
  }

  // Recebe o ID do cartão clicado e procura essa música na lista.
  function tocarMusicaEscolhida(id) {
    const index = songsList.findIndex((song) => song.id === id);
    if (index !== -1) tocarMusicaPelaPosicao(index);
  }

  // Recebe a posição da música na lista, atualiza o player e começa a tocar.
  function tocarMusicaPelaPosicao(index) {
    const song = songsList[index];
    if (!song) return;

    currentIndex = index;
    atualizarPlayerComMusica(song, elements);
    atualizarCoracaoDaFaixa();
    // Zera os tempos e a barra antes de começar outra música.
    elements.progressBar.value = "0";
    elements.currentTime.textContent = "0:00";
    elements.totalDuration.textContent = "0:00";
    elements.audioPlayer.play().catch((error) => {
      console.error("Não foi possível reproduzir a música:", error);
    });
  }

  // Envia os IDs do navegador e da música para adicionar ou remover a curtida.
  function alternarCurtidaDaFaixa() {
    const currentSong = songsList[currentIndex];
    if (!currentSong) return;
    const isLiked = likedSongIds.includes(currentSong.id);
    salvarOuRemoverCurtida(userId, currentSong.id, isLiked).catch((error) => {
      console.error("Não foi possível atualizar a curtida:", error);
    });
  }

  // Responde ao clique em uma música. O cartão informa se foi play ou curtida.
  // Clicar em outra parte do cartão também começa a música.
  function aoClicarEmMusica(event) {
    const button = event.target.closest("[data-action][data-song-id]");
    if (!button) {
      const card = event.target.closest(".song-card[data-song-id]");
      if (card) tocarMusicaEscolhida(card.dataset.songId);
      return;
    }

    const { action, songId } = button.dataset;
    if (action === "play") tocarMusicaEscolhida(songId);
    if (action === "like") {
      const isLiked = likedSongIds.includes(songId);
      salvarOuRemoverCurtida(userId, songId, isLiked).catch((error) => {
        console.error("Não foi possível atualizar a curtida:", error);
      });
    }
  }

  // Toca a próxima música. Depois da última, volta para a primeira.
  function tocarProximaMusica() {
    if (!songsList.length) return;
    const nextIndex = (currentIndex + 1) % songsList.length;
    tocarMusicaPelaPosicao(nextIndex);
  }

  // Toca a música anterior. Antes da primeira, vai para a última da lista.
  function tocarMusicaAnterior() {
    if (!songsList.length) return;
    const previousIndex = currentIndex <= 0 ? songsList.length - 1 : currentIndex - 1;
    tocarMusicaPelaPosicao(previousIndex);
  }

  // Se ainda não há música escolhida, começa pela primeira.
  // Se já há uma, toca ou pausa conforme o estado do player.
  function tocarOuPausarMusica() {
    if (currentIndex === -1 && songsList.length) {
      tocarMusicaPelaPosicao(0);
    } else if (elements.audioPlayer.paused) {
      elements.audioPlayer.play().catch((error) => {
        console.error("Não foi possível reproduzir a música:", error);
      });
    } else {
      elements.audioPlayer.pause();
    }
  }

  // Usa a posição do controle e a duração do áudio para avançar ou voltar.
  function mudarPontoDaMusica() {
    const duration = elements.audioPlayer.duration;
    if (Number.isFinite(duration) && duration > 0) {
      elements.audioPlayer.currentTime = (Number(elements.progressBar.value) / 100) * duration;
    }
  }

  // Lê o valor do controle de volume e aplica esse valor ao player.
  function mudarVolume(event) {
    const value = Number(event.currentTarget.value);
    if (value > 0) lastVolume = value;
    atualizarVolumeDoPlayer(value, elements);
  }

  // Se há som, guarda o volume e silencia.
  // Se está silenciado, recupera o último volume usado.
  function silenciarOuRestaurarVolume() {
    const currentVolume = Number(elements.volumeSlider.value);
    const nextVolume = currentVolume > 0 ? 0 : lastVolume;
    elements.volumeSlider.value = String(nextVolume);
    atualizarVolumeDoPlayer(nextVolume, elements);
  }

  // Recebe do Firebase a lista de músicas, inclusive quando ela muda.
  // Mantém a faixa atual selecionada se ela ainda estiver na lista.
  function atualizarListaDeMusicas(songs) {
    const currentSongId = songsList[currentIndex]?.id;
    songsList = songs;
    // Procura novamente a faixa selecionada na lista atualizada.
    currentIndex = currentSongId
      ? songsList.findIndex((song) => song.id === currentSongId)
      : -1;
    atualizarMusicasNaTela();
    atualizarCoracaoDaFaixa();
  }

  // Recebe do Firebase os IDs das músicas curtidas e atualiza a página.
  function atualizarListaDeCurtidas(songIds) {
    likedSongIds = songIds;
    atualizarMusicasNaTela();
    atualizarCoracaoDaFaixa();
  }

  // Responde ao clique em Início sem recarregar a página.
  function mostrarPaginaInicial(event) {
    event.preventDefault();
    mostrarPaginaEscolhida("home", elements);
  }

  // Responde ao clique em Curtidas sem recarregar a página.
  function mostrarPaginaDeCurtidas(event) {
    if (event) event.preventDefault();
    mostrarPaginaEscolhida("liked", elements);
  }

  // Enquanto a música toca, atualiza a barra e os tempos mostrados na tela.
  function atualizarProgressoEnquantoToca() {
    const duration = elements.audioPlayer.duration;
    if (Number.isFinite(duration) && duration > 0) {
      atualizarProgressoDoPlayer(elements.audioPlayer.currentTime, duration, elements);
    }
  }

  // Liga cada botão e controle à função que responde ao clique ou à mudança.
  elements.btnNavHome.addEventListener("click", mostrarPaginaInicial);
  elements.btnNavLiked.addEventListener("click", mostrarPaginaDeCurtidas);
  elements.songGrid.addEventListener("click", aoClicarEmMusica);
  elements.likedSongGrid.addEventListener("click", aoClicarEmMusica);
  elements.playerHeartBtn.addEventListener("click", alternarCurtidaDaFaixa);
  elements.playBtn.addEventListener("click", tocarOuPausarMusica);
  elements.prevBtn.addEventListener("click", tocarMusicaAnterior);
  elements.nextBtn.addEventListener("click", tocarProximaMusica);
  elements.audioPlayer.addEventListener("ended", tocarProximaMusica);
  elements.audioPlayer.addEventListener("timeupdate", atualizarProgressoEnquantoToca);
  elements.audioPlayer.addEventListener("play", () => atualizarBotaoPlayPause(true, elements));
  elements.audioPlayer.addEventListener("pause", () => atualizarBotaoPlayPause(false, elements));
  elements.progressBar.addEventListener("input", mudarPontoDaMusica);
  elements.volumeSlider.addEventListener("input", mudarVolume);
  elements.volumeBtn.addEventListener("click", silenciarOuRestaurarVolume);

  // Recebe as músicas e curtidas do Firebase sempre que houver mudanças.
  // Aplica ao player o volume que aparece inicialmente no controle.
  acompanharMusicasDoFirebase(atualizarListaDeMusicas);
  acompanharCurtidasDoUsuario(userId, atualizarListaDeCurtidas);
  atualizarVolumeDoPlayer(elements.volumeSlider.value, elements);
}
