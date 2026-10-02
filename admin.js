import { db } from "./firebase-config.js"; // Importa a referência da base de dados inicializada do ficheiro de configuração
import { ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js"; // Importa as funções da biblioteca do Firebase Realtime Database

// 1. ELEMENTOS DA PÁGINA E ESTADO DO FORMULÁRIO // Comentário de agrupamento das variáveis do DOM
const addSongForm = document.getElementById('addSongForm'); // Obtém o elemento do formulário de adição/edição
const adminSongList = document.getElementById('adminSongList'); // Obtém o corpo da tabela onde as músicas são listadas
const formTitleText = document.getElementById('formTitleText'); // Obtém o elemento de texto do título do formulário
const saveBtnText = document.getElementById('saveBtnText'); // Obtém o elemento de texto do botão principal de guardar
const saveBtnIcon = document.getElementById('saveBtnIcon'); // Obtém o elemento de ícone do botão principal de guardar
const saveBtn = document.getElementById('saveBtn'); // Obtém o botão principal do formulário
const cancelEditBtn = document.getElementById('cancelEditBtn'); // Obtém o botão para cancelar o modo de edição

const coverFileInput = document.getElementById('coverFile'); // Obtém o campo de ficheiro da imagem de capa
const audioFileInput = document.getElementById('audioFile'); // Obtém o campo de ficheiro do áudio MP3
const coverStatus = document.getElementById('coverStatus'); // Obtém o elemento de texto de estado da capa
const audioStatus = document.getElementById('audioStatus'); // Obtém o elemento de texto de estado do áudio

let currentEditingId = null; // Guarda o ID da música em edição (null significa que é uma criação nova)
let songsCache = {};         // Objeto em memória para guardar a cópia local dos dados das músicas do Firebase

// 2. CONVERSÃO DE FICHEIRO // Comentário de agrupamento das funções auxiliares
function fileToDataURL(file) { // Converte um ficheiro selecionado pelo utilizador numa string Data URL em Base64
  return new Promise((resolve, reject) => { // Retorna uma Promise para lidar de forma assíncrona com a leitura do ficheiro
    if (!file) return resolve(null); // Se nenhum ficheiro for fornecido, resolve imediatamente com valor nulo
    const reader = new FileReader(); // Cria uma nova instância do leitor de ficheiros do navegador
    reader.onload = () => resolve(reader.result); // Resolve a Promise com o resultado da leitura Base64
    reader.onerror = (error) => reject(error); // Rejeita a Promise caso ocorra um erro de leitura
    reader.readAsDataURL(file); // Inicia a leitura do ficheiro convertendo-o para Data URL
  }); // Fim da Promise
} // Fim da função fileToDataURL

// 3. CARREGAR A TABELA DE MÚSICAS // Comentário de escuta de alterações na base de dados
onValue(ref(db, 'songs'), (snapshot) => { // Subscreve a alterações em tempo real no nó 'songs' da base de dados
  adminSongList.innerHTML = ''; // Limpa as linhas atuais da tabela antes de desenhar os dados atualizados
  const data = snapshot.val(); // Obtém os dados do snapshot retornado pelo Firebase
  songsCache = data || {}; // Atualiza a cache local com os dados recebidos ou com um objeto vazio caso seja nulo

  if (!data) { // Verifica se não existem músicas registadas na base de dados
    adminSongList.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #b3b3b3; padding: 24px;">Nenhuma música registada.</td></tr>'; // Insere uma mensagem informativa na tabela
    return; // Interrompe a execução da função
  } // Fim da verificação de ausência de dados

  Object.keys(data).forEach((id) => { // Percorre cada chave/ID único de música presente nos dados
    const song = data[id]; // Obtém o objeto com as informações da música correspondente
    const row = document.createElement('tr'); // Cria um novo elemento de linha de tabela (tr)

    row.innerHTML = ` 
      <td>
        <img src="${song.coverUrl}" alt="${song.title}" class="admin-cover-thumb" onerror="this.src='https://via.placeholder.com/48?text=Capa'">
      </td>
      <td class="song-title-cell">${song.title}</td>
      <td class="song-artist-cell">${song.artist}</td>
      <td style="text-align: right;">
        <div class="action-btns">
          <button class="btn-edit" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="btn-delete" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </td>
    `; // Preenche o conteúdo HTML da linha da tabela com imagem, título, artista e botões de ação

    row.querySelector('.btn-edit').addEventListener('click', () => startEditing(id)); // Regista o evento de clique do botão editar para iniciar a edição

    row.querySelector('.btn-delete').addEventListener('click', () => { // Regista o evento de clique do botão eliminar
      if (confirm('Deseja eliminar esta música?')) { // Exibe uma caixa de confirmação ao utilizador
        if (currentEditingId === id) resetForm(); // Se a música eliminada estiver a ser editada, reinicia o formulário
        remove(ref(db, `songs/${id}`)); // Remove a música da base de dados Firebase
      } // Fim do bloco de confirmação
    }); // Fim do evento do botão eliminar

    adminSongList.appendChild(row); // Adiciona a linha construída ao corpo da tabela
  }); // Fim da iteração sobre as músicas
}); // Fim da escuta de dados onValue

// 4. MODOS DO FORMULÁRIO: EDITAR E NOVO CADASTRO // Comentário sobre funções de alteração de estado do formulário
function startEditing(id) { // Coloca o formulário em modo de edição para uma música específica
  const song = songsCache[id]; // Obtém a música selecionada a partir da cache local
  if (!song) return; // Se a música não existir na cache, interrompe a execução

  currentEditingId = id; // Define o ID da música atualmente em edição
  document.getElementById('songTitle').value = song.title || ''; // Preenche o campo de título com os dados existentes
  document.getElementById('songArtist').value = song.artist || ''; // Preenche o campo de artista com os dados existentes
  
  coverFileInput.required = false; // Torna o campo de seleção da imagem de capa opcional na edição
  audioFileInput.required = false; // Torna o campo de seleção de ficheiro de áudio opcional na edição

  coverStatus.textContent = "A manter a imagem atual. Selecione um novo ficheiro para alterar."; // Exibe mensagem sobre a preservação da imagem atual
  audioStatus.textContent = "A manter o áudio atual. Selecione um novo ficheiro para alterar."; // Exibe mensagem sobre a preservação do áudio atual

  formTitleText.textContent = 'Editar Música'; // Atualiza o título do formulário
  saveBtnText.textContent = 'Atualizar Música'; // Atualiza o texto do botão de guardar
  saveBtnIcon.className = 'fa-solid fa-floppy-disk'; // Altera o ícone do botão para guardar alterações
  cancelEditBtn.classList.remove('hidden'); // Exibe o botão de cancelar a edição
} // Fim da função startEditing

function resetForm() { // Restaura o formulário para o modo inicial de criação de novas músicas
  currentEditingId = null; // Limpa o ID da música em edição
  addSongForm.reset(); // Limpa todos os campos de texto e ficheiros do formulário

  coverFileInput.required = true; // Torna o campo da capa obrigatório para novas músicas
  audioFileInput.required = true; // Torna o campo de áudio obrigatório para novas músicas

  coverStatus.textContent = ""; // Limpa a mensagem do estado da capa
  audioStatus.textContent = ""; // Limpa a mensagem do estado do áudio

  formTitleText.textContent = 'Adicionar Nova Música'; // Restaura o título padrão do formulário
  saveBtnText.textContent = 'Guardar Música'; // Restaura o texto padrão do botão
  saveBtnIcon.className = 'fa-solid fa-upload'; // Restaura o ícone padrão de carregamento
  saveBtn.disabled = false; // Reativa o botão de guardar caso estivesse desativado
  cancelEditBtn.classList.add('hidden'); // Oculta o botão de cancelar edição
} // Fim da função resetForm

cancelEditBtn.addEventListener('click', resetForm); // Regista o evento de clique no botão de cancelar para reiniciar o formulário

// 5. GUARDAR UMA MÚSICA NOVA OU ATUALIZAR UMA EXISTENTE // Comentário sobre submissão do formulário
addSongForm.addEventListener('submit', async (e) => { // Regista o evento de submissão do formulário de forma assíncrona
  e.preventDefault(); // Impede o comportamento padrão de recarregamento da página

  const title = document.getElementById('songTitle').value.trim(); // Obtém e remove espaços extras do título digitado
  const artist = document.getElementById('songArtist').value.trim(); // Obtém e remove espaços extras do artista digitado
  const coverFile = coverFileInput.files[0]; // Obtém o ficheiro de imagem selecionado (se houver)
  const audioFile = audioFileInput.files[0]; // Obtém o ficheiro de áudio selecionado (se houver)

  if (!title || !artist) return; // Se o título ou artista estiverem vazios, interrompe a submissão

  if (!currentEditingId && (!coverFile || !audioFile)) { // Valida a obrigatoriedade dos ficheiros num novo registo
    alert("Por favor, selecione a imagem da capa e o ficheiro MP3."); // Exibe alerta caso falte algum ficheiro
    return; // Interrompe a execução
  } // Fim da validação de ficheiros

  try { // Inicia bloco de captura de erros
    saveBtn.disabled = true; // Desativa o botão de guardar para evitar múltiplos cliques
    saveBtnText.textContent = "A processar ficheiros..."; // Altera o texto do botão para informar o utilizador

    let coverUrl = currentEditingId ? songsCache[currentEditingId].coverUrl : ""; // Mantém a imagem atual se estiver em modo de edição
    let audioUrl = currentEditingId ? songsCache[currentEditingId].audioUrl : ""; // Mantém o áudio atual se estiver em modo de edição

    if (coverFile) coverUrl = await fileToDataURL(coverFile); // Converte e atualiza a capa se um novo ficheiro tiver sido selecionado
    if (audioFile) audioUrl = await fileToDataURL(audioFile); // Converte e atualiza o áudio se um novo ficheiro tiver sido selecionado

    const songData = { // Cria o objeto com os dados da música a ser guardado no Firebase
      title, // Adiciona o título da música
      artist, // Adiciona o nome do artista
      coverUrl, // Adiciona a URL/Base64 da imagem de capa
      audioUrl, // Adiciona a URL/Base64 do áudio
      updatedAt: Date.now() // Regista o carimbo de data/hora da última atualização
    }; // Fim do objeto de dados da música

    if (currentEditingId) { // Se existir um ID em edição, faz a atualização do registo
      await update(ref(db, `songs/${currentEditingId}`), songData); // Atualiza os dados da música existente na base de dados
    } else { // Caso contrário, cria um novo registo
      songData.createdAt = Date.now(); // Regista o carimbo de data/hora de criação do novo registo
      await push(ref(db, 'songs'), songData); // Adiciona uma nova música com ID gerado automaticamente pelo Firebase
    } // Fim da verificação de edição/criação

    resetForm(); // Restaura o formulário ao seu estado padrão após guardar
  } catch (err) { // Captura eventuais erros ocorridos no processo
    alert("Erro ao guardar: " + err.message); // Exibe uma caixa de mensagem com a descrição do erro
    saveBtn.disabled = false; // Reativa o botão de submissão
    saveBtnText.textContent = currentEditingId ? 'Atualizar Música' : 'Guardar Música'; // Restaura o texto apropriado do botão
  } // Fim do bloco try-catch
}); // Fim do evento de submissão do formulário