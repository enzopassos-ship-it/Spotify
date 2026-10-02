import { db } from "./firebase-config.js"; // Importa a referência da base de dados Firebase do ficheiro de configuração
import { ref, onValue, set, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js"; // Importa os métodos necessários do Realtime Database do Firebase

// 1. ELEMENTOS DA PÁGINA // Comentário de agrupamento dos elementos da interface
const songGrid = document.getElementById('songGrid'); // Obtém o contentor da grelha de músicas da página inicial
const likedSongGrid = document.getElementById('likedSongGrid'); // Obtém o contentor da grelha da página de músicas curtidas
const homeView = document.getElementById('homeView'); // Obtém a secção da vista inicial
const likedView = document.getElementById('likedView'); // Obtém a secção da vista de músicas curtidas
const btnNavHome = document.getElementById('btnNavHome'); // Obtém o botão de navegação para a vista inicial
const btnNavLiked = document.getElementById('btnNavLiked'); // Obtém o botão de navegação para a vista de curtidas

// Elementos do player de áudio. // Comentário de agrupamento dos elementos do leitor
const audioPlayer = document.getElementById('audioPlayer'); // Obtém o elemento de áudio nativo HTML5
const playBtn = document.getElementById('playBtn'); // Obtém o botão principal de reproduzir e pausar
const prevBtn = document.getElementById('prevBtn'); // Obtém o botão de faixa anterior
const nextBtn = document.getElementById('nextBtn'); // Obtém o botão de próxima faixa
const currentTitle = document.getElementById('currentTitle'); // Obtém o elemento de texto do título da música em reprodução
const currentArtist = document.getElementById('currentArtist'); // Obtém o elemento de texto do artista em reprodução
const currentCover = document.getElementById('currentCover'); // Obtém o elemento de imagem da capa da música em reprodução
const playerHeartBtn = document.getElementById('playerHeartBtn'); // Obtém o botão de coração no leitor inferior

// Elementos da barra de progresso, volume e contagem de curtidas. // Comentário de agrupamento dos controlos secundários
const progressBar = document.getElementById('progressBar'); // Obtém a barra de progresso da faixa
const currentTimeEl = document.getElementById('currentTime'); // Obtém o texto do tempo decorrido
const totalDurationEl = document.getElementById('totalDuration'); // Obtém o texto do tempo total
const volumeSlider = document.getElementById('volumeSlider'); // Obtém o controlo deslizante de volume
const volumeBtn = document.getElementById('volumeBtn'); // Obtém o botão de ligar/desligar o som
const likedCountText = document.getElementById('likedCountText'); // Obtém o texto de contagem na biblioteca lateral
const likedBannerSubtitle = document.getElementById('likedBannerSubtitle'); // Obtém o texto de contagem no banner superior

// 2. DADOS QUE O SITE PRECISA MANTER EM MEMÓRIA // Comentário de inicialização do estado da aplicação
let songsList = [];       // Array em memória com todas as músicas recebidas do Firebase
let likedSongIds = [];    // Array em memória com os IDs das músicas favoritadas pelo utilizador atual
let currentIndex = -1;    // Índice da música atualmente selecionada ou em reprodução (-1 significa nenhuma)
let isPlaying = false;    // Estado boleano que indica se o áudio está atualmente em reprodução
let lastVolume = 80;      // Guarda o valor anterior do volume para restaurar após desativar o silêncio

// Cada navegador recebe um ID para guardar as curtidas separadamente. // Comentário sobre a identificação do utilizador
let userId = localStorage.getItem('spotify_user_id'); // Tenta obter o ID único do utilizador guardado no armazenamento local
if (!userId) { // Caso o ID ainda não exista para este navegador
  userId = 'user_' + Math.random().toString(36).substring(2, 9); // Gera uma string aleatória única de identificação de utilizador
  localStorage.setItem('spotify_user_id', userId); // Guarda o novo ID no armazenamento local do navegador
} // Fim da verificação de ID do utilizador

// 3. LIGAÇÃO AO FIREBASE // Comentário de subscrição de dados em tempo real

// Atualiza a lista quando as músicas no Firebase mudam. // Comentário sobre a lista global de músicas
onValue(ref(db, 'songs'), (snapshot) => { // Subscreve a alterações em tempo real no nó 'songs'
  const data = snapshot.val(); // Obtém o valor atual dos dados do snapshot
  songsList = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : []; // Transforma o objeto do Firebase num array com objetos contendo o respetivo ID
  
  renderHomeSongs(); // Redesenha a lista de músicas na vista principal
  renderLikedSongs(); // Redesenha a lista de músicas na vista de curtidas
}); // Fim da escuta de músicas

// Atualiza as curtidas e os elementos que dependem delas. // Comentário sobre as curtidas do utilizador
onValue(ref(db, `likes/${userId}`), (snapshot) => { // Subscreve a alterações em tempo real nas curtidas deste utilizador específico
  const data = snapshot.val(); // Obtém os dados de curtidas do snapshot
  likedSongIds = data ? Object.keys(data) : []; // Extrai os IDs das músicas curtidas para um array

  renderHomeSongs(); // Atualiza a vista inicial para refletir novos estados de curtida
  renderLikedSongs(); // Atualiza a vista de músicas curtidas
  updateLikedCount(); // Atualiza os textos com o número total de curtidas
  updatePlayerHeart(); // Atualiza o estado do ícone de coração do leitor
}); // Fim da escuta de curtidas

// 4. NAVEGAÇÃO ENTRE INÍCIO E MÚSICAS CURTIDAS // Comentário das funções de alternância de vistas
function showView(view) { // Alterna a visibilidade das secções da aplicação entre 'home' e 'liked'
  const isHome = view === 'home'; // Verifica se a vista solicitada é a vista principal
  homeView.classList.toggle('hidden', !isHome); // Exibe a vista inicial e oculta-a caso não seja a selecionada
  likedView.classList.toggle('hidden', isHome); // Exibe a vista de curtidas e oculta-a caso a vista inicial esteja ativa
  btnNavHome.classList.toggle('active', isHome); // Adiciona ou remove a classe ativa no botão de navegação Inicial
  btnNavLiked.classList.toggle('active', !isHome); // Adiciona ou remove a classe ativa no botão de navegação Curtidas
} // Fim da função showView

// O link Início não navega para outra página: apenas troca a vista. // Comentário de registo de ouvintes de navegação
btnNavHome.addEventListener('click', (e) => { e.preventDefault(); showView('home'); }); // Associa o clique do link inicial à troca de vista sem recarregar
btnNavLiked.addEventListener('click', () => showView('liked')); // Associa o clique do item de curtidas à exibição da vista respetiva

// 5. CRIAÇÃO E APRESENTAÇÃO DOS CARTÕES DE MÚSICA // Comentário da renderização de componentes

// Cria um cartão reutilizável para a página inicial e a lista de curtidas. // Comentário sobre a fábrica de cartões
function createSongCard(song) { // Constrói dinamicamente o elemento HTML do cartão de uma música
  const isLiked = likedSongIds.includes(song.id); // Verifica se a música atual consta do array de curtidas do utilizador
  const card = document.createElement('div'); // Cria um novo elemento div para representar o cartão
  card.className = 'song-card'; // Atribui a classe CSS 'song-card'

  card.innerHTML = `
    <div class="card-cover">
      <img src="${song.coverUrl}" alt="${song.title}" onerror="this.src='https://via.placeholder.com/300?text=Capa'">
      <button class="card-like-btn ${isLiked ? 'liked' : ''}">
        <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
      </button>
      <button class="card-play-btn">
        <i class="fa-solid fa-play"></i>
      </button>
    </div>
    <h4>${song.title}</h4>
    <p>${song.artist}</p>
  `; // Preenche a estrutura interna HTML do cartão com capa, botões, título e artista

  card.querySelector('.card-play-btn').addEventListener('click', (e) => { // Regista o evento de clique no botão de reprodução do cartão
    e.stopPropagation(); // Impede a propagação do evento para o contentor pai do cartão
    playSongById(song.id); // Inicia a reprodução da música com o ID correspondente
  }); // Fim do evento play do cartão

  card.querySelector('.card-like-btn').addEventListener('click', (e) => { // Regista o evento de clique no botão de curtir do cartão
    e.stopPropagation(); // Impede que o clique dispare a reprodução do cartão
    toggleLikeSong(song.id); // Alterna o estado de favorito da música
  }); // Fim do evento de curtir do cartão

  card.addEventListener('click', () => playSongById(song.id)); // Permite tocar a música clicando em qualquer área do cartão

  return card; // Retorna o nó HTML do cartão devidamente configurado
} // Fim da função createSongCard

// Apaga o conteúdo antigo e desenha novamente todas as músicas. // Comentário da renderização da página inicial
function renderHomeSongs() { // Limpa e desenha os cartões de música no catálogo principal
  songGrid.innerHTML = ''; // Limpa os elementos filhos do nó da grelha principal
  if (songsList.length === 0) { // Se a lista de músicas do catálogo estiver vazia
    songGrid.innerHTML = '<p style="color: #b3b3b3; grid-column: 1/-1;">Nenhuma música disponível no momento.</p>'; // Exibe mensagem informativa na grelha
    return; // Interrompe a execução
  } // Fim da verificação de lista vazia
  songsList.forEach(song => songGrid.appendChild(createSongCard(song))); // Cria e adiciona um cartão para cada música do catálogo
} // Fim da função renderHomeSongs

// Filtra as músicas e desenha apenas as que foram curtidas. // Comentário da renderização de faixas favoritadas
function renderLikedSongs() { // Desenha os cartões na grelha de músicas favoritadas
  likedSongGrid.innerHTML = ''; // Limpa os elementos atuais da grelha de curtidas
  const likedSongs = songsList.filter(song => likedSongIds.includes(song.id)); // Filtra o catálogo retendo apenas músicas cujos IDs estejam curtidos

  if (likedSongs.length === 0) { // Se o utilizador não tiver nenhuma música curtida
    likedSongGrid.innerHTML = '<p style="color: #b3b3b3; grid-column: 1/-1;">Ainda não adicionaste nenhuma música às tuas curtidas.</p>'; // Exibe mensagem informativa
    return; // Interrompe a execução
  } // Fim da verificação de curtidas vazias
  likedSongs.forEach(song => likedSongGrid.appendChild(createSongCard(song))); // Adiciona cada cartão filtrado à grelha de curtidas
} // Fim da função renderLikedSongs

// 6. GESTÃO DE CURTIDAS // Comentário das funções de manipulação de curtidas
async function toggleLikeSong(songId) { // Adiciona ou remove uma música da lista de favoritos na base de dados
  const likeRef = ref(db, `likes/${userId}/${songId}`); // Cria a referência para o nó da curtida na base de dados
  if (likedSongIds.includes(songId)) { // Se a música já se encontrar favoritada
    await remove(likeRef); // Elimina a referência de curtida no Firebase
  } else { // Caso a música ainda não esteja favoritada
    await set(likeRef, true); // Regista o valor verdadeiro no nó correspondente do Firebase
  } // Fim da alternância
} // Fim da função toggleLikeSong

function updateLikedCount() { // Atualiza a contagem textual exibida nos contadores da interface
  const count = likedSongIds.length; // Obtém o número total de itens curtidos
  const text = `Playlist • ${count} ${count === 1 ? 'música' : 'músicas'}`; // Formata a frase tratando a concordância singular/plural
  likedCountText.textContent = text; // Atualiza a mensagem na biblioteca lateral
  likedBannerSubtitle.textContent = text; // Atualiza a mensagem no banner superior da vista
} // Fim da função updateLikedCount

// 7. REPRODUÇÃO DE ÁUDIO // Comentário sobre o fluxo de execução de áudio
function playSongById(id) { // Localiza o índice de uma faixa pelo ID e dispara o carregamento
  const index = songsList.findIndex(s => s.id === id); // Procura a posição do objeto correspondente no array
  if (index !== -1) loadAndPlaySong(index); // Se encontrada, carrega e inicia a reprodução da faixa
} // Fim da função playSongById

function loadAndPlaySong(index) { // Carrega uma faixa pelo seu índice no array e reproduz
  if (index < 0 || index >= songsList.length) return; // Impede tentativas de acesso fora dos limites válidos do array

  currentIndex = index; // Define a posição global da música em execução
  const song = songsList[currentIndex]; // Obtém o objeto da música selecionada

  audioPlayer.src = song.audioUrl; // Atribui a fonte de áudio ao elemento leitor HTML5
  currentTitle.textContent = song.title; // Atualiza o nome da faixa na barra inferior
  currentArtist.textContent = song.artist; // Atualiza o artista da faixa na barra inferior
  currentCover.src = song.coverUrl; // Atualiza a miniatura da capa na barra inferior

  audioPlayer.play(); // Inicia a reprodução do áudio
  isPlaying = true; // Define o estado boleano como ativo
  updatePlayIcon(); // Atualiza a exibição do botão play/pause
  updatePlayerHeart(); // Atualiza o estado do ícone de coração do leitor
} // Fim da função loadAndPlaySong

function updatePlayIcon() { // Atualiza o ícone visual do botão central de reprodução
  playBtn.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>'; // Alterna entre os ícones de pausa e play
} // Fim da função updatePlayIcon

function updatePlayerHeart() { // Atualiza o estado visual do botão de curtida do leitor
  if (currentIndex === -1) return; // Se nenhuma música estiver selecionada, interrompe a execução
  const song = songsList[currentIndex]; // Obtém os dados da música atual
  const isLiked = likedSongIds.includes(song.id); // Avalia se a faixa atual está curtida

  playerHeartBtn.classList.toggle('liked', isLiked); // Adiciona ou remove a classe verde de destaque
  playerHeartBtn.innerHTML = `<i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>`; // Altera o ícone para sólido ou contorno
} // Fim da função updatePlayerHeart

// Controlos do player: curtir, pausar/retomar e mudar de faixa. // Comentário dos eventos de controlo do leitor
playerHeartBtn.addEventListener('click', () => { // Regista o evento de clique no coração do leitor
  if (currentIndex !== -1) toggleLikeSong(songsList[currentIndex].id); // Alterna o gosto da música atual
}); // Fim do evento de clique no coração

playBtn.addEventListener('click', () => { // Regista o evento de clique no botão principal de reprodução
  if (currentIndex === -1 && songsList.length > 0) { // Caso nenhuma música esteja a tocar e existam faixas disponíveis
    loadAndPlaySong(0); // Toca a primeira música da lista
    return; // Encerra o tratamento do evento
  } // Fim da verificação inicial
  if (isPlaying) { // Se o áudio estiver em execução
    audioPlayer.pause(); // Interrompe temporariamente a reprodução
    isPlaying = false; // Define a variável de estado para falso
  } else { // Se o áudio estiver pausado
    audioPlayer.play(); // Continua a reprodução
    isPlaying = true; // Define a variável de estado para verdadeiro
  } // Fim da alternância
  updatePlayIcon(); // Atualiza a representação do ícone de reprodução
}); // Fim do evento do botão play

prevBtn.addEventListener('click', () => { // Regista o evento de clique no botão de música anterior
  if (!songsList.length) return; // Se a lista estiver vazia, não executa
  const newIndex = currentIndex - 1 < 0 ? songsList.length - 1 : currentIndex - 1; // Calcula a posição anterior com rotação circular para a última
  loadAndPlaySong(newIndex); // Carrega e reproduz a faixa calculada
}); // Fim do evento do botão anterior

nextBtn.addEventListener('click', () => { // Regista o evento de clique no botão de próxima música
  if (!songsList.length) return; // Se a lista estiver vazia, não executa
  const newIndex = (currentIndex + 1) % songsList.length; // Calcula a próxima posição com rotação circular para a primeira
  loadAndPlaySong(newIndex); // Carrega e reproduz a faixa calculada
}); // Fim do evento do botão próxima

// Ao terminar uma faixa, usa o mesmo controlo do botão Próxima. // Comentário sobre o encerramento da música
audioPlayer.addEventListener('ended', () => { // Escuta o evento de término automático de reprodução do áudio
  if (songsList.length) nextBtn.click(); // Dispara o clique do botão da próxima música se existirem faixas
}); // Fim da escuta do evento ended

// 8. TEMPO E BARRA DE PROGRESSO // Comentário da atualização da linha de tempo
audioPlayer.addEventListener('timeupdate', () => { // Escuta as atualizações de progresso do áudio em tempo real
  if (!isNaN(audioPlayer.duration) && audioPlayer.duration > 0) { // Valida a existência de uma duração válida
    progressBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100; // Calcula a percentagem e atualiza o deslizador
    currentTimeEl.textContent = formatTime(audioPlayer.currentTime); // Formata e atualiza a exibição do tempo decorrido
    totalDurationEl.textContent = formatTime(audioPlayer.duration); // Formata e atualiza a exibição da duração total
  } // Fim da validação da duração
}); // Fim do evento timeupdate

progressBar.addEventListener('input', () => { // Escuta a interação manual do utilizador na barra de progresso
  if (!isNaN(audioPlayer.duration)) { // Garante que a duração do ficheiro é um número válido
    audioPlayer.currentTime = (progressBar.value / 100) * audioPlayer.duration; // Define a nova posição de reprodução do áudio
  } // Fim da validação de ajuste de tempo
}); // Fim do evento input na barra de progresso

function formatTime(seconds) { // Converte uma duração expressa em segundos para o formato mm:ss
  const mins = Math.floor(seconds / 60); // Obtém o total de minutos inteiros
  const secs = Math.floor(seconds % 60); // Obtém os segundos restantes
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`; // Formata a string adicionando zero à esquerda nos segundos se necessário
} // Fim da função formatTime

// 9. VOLUME // Comentário do ajuste e regulação sonora
function updateVolume(val) { // Atualiza o nível de som do leitor e o aspeto da barra
  audioPlayer.volume = val / 100; // Converte o valor de 0-100 para o intervalo de 0.0-1.0 do elemento HTML5
  volumeSlider.style.background = `linear-gradient(to right, #1fdf64 ${val}%, #4d4d4d ${val}%)`; // Ajusta o preenchimento verde do deslizador

  const icon = volumeBtn.querySelector('i'); // Obtém o elemento de ícone dentro do botão de volume
  if (val == 0) icon.className = 'fa-solid fa-volume-xmark'; // Se o volume for zero, exibe o ícone de sem som
  else if (val < 50) icon.className = 'fa-solid fa-volume-low'; // Se for menor que 50%, exibe o ícone de volume baixo
  else icon.className = 'fa-solid fa-volume-high'; // Para valores superiores a 50%, exibe o ícone de volume elevado
} // Fim da função updateVolume

volumeSlider.addEventListener('input', (e) => { // Escuta alterações no deslizador de volume
  const val = e.target.value; // Obtém o valor atual selecionado no slider
  updateVolume(val); // Aplica as alterações no leitor de áudio
  if (val > 0) lastVolume = val; // Se o volume for maior que zero, guarda o valor como último volume ativo
}); // Fim do evento input no slider de volume

volumeBtn.addEventListener('click', () => { // Regista o evento de clique no botão do ícone de volume (Mute/Unmute)
  if (volumeSlider.value > 0) { // Se o volume estiver ativo
    lastVolume = volumeSlider.value; // Guarda o volume atual antes de silenciar
    volumeSlider.value = 0; // Define o slider para zero
    updateVolume(0); // Aplica o silêncio ao leitor
  } else { // Se estiver silenciado
    volumeSlider.value = lastVolume || 80; // Restaura o último volume guardado ou o valor padrão de 80
    updateVolume(volumeSlider.value); // Restaura o nível de som do leitor
  } // Fim da alternância de volume
}); // Fim do evento do botão de volume

// Aplica o valor inicial do controlo de volume ao áudio e ao ícone. // Comentário de arranque inicial do volume
updateVolume(volumeSlider.value); // Inicializa o estado de som com base no valor padrão do controlo