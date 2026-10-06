import { salvarMusicaNova, apagarMusica, acompanharMusicasParaPainel, salvarEdicaoDaMusica } from "../models/songs-model.js";
import {
  pegarElementosDoPainel,
  desenharTabelaDeMusicas,
  limparFormulario,
  preencherFormularioComMusica,
  mostrarErroDeSalvamento,
  mostrarSalvamentoEmAndamento
} from "../views/admin-view.js";

// Recebe uma imagem ou um áudio escolhido no computador e lê seu conteúdo.
// O navegador transforma o arquivo em um texto que pode ser salvo no banco.
function prepararArquivoParaSalvar(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      // Na edição, deixar o campo vazio mantém o arquivo que já está salvo.
      resolve(null);
      return;
    }

    // FileReader é a ferramenta do navegador que abre o arquivo escolhido.
    const reader = new FileReader();

    // Quando a leitura termina, recebe um texto com o tipo e o conteúdo do arquivo.
    // Esse texto começa, por exemplo, com "data:audio/mpeg" para um MP3.
    reader.onload = function aoTerminarLeituraDoArquivo() {
      resolve(reader.result);
    };

    // Se a leitura falhar, envia o erro para o formulário mostrar.
    reader.onerror = function aoFalharLeituraDoArquivo(error) {
      reject(error);
    };

    // Começa a ler; o resultado chega quando a leitura termina.
    reader.readAsDataURL(file);
  });
}

// Prepara o painel quando admin.html abre.
// Encontra os campos, liga os botões e começa a receber as músicas salvas.
export function iniciarPainelAdmin() {
  // Busca os campos e a tabela que estão no admin.html.
  const elements = pegarElementosDoPainel();

  let currentEditingId = null; // Guarda o ID da música que está sendo editada.
  let songsCache = {}; // Guarda as músicas recebidas para a tabela e a edição.

  // Recebe as músicas salvas e atualiza a tabela.
  function atualizarTabelaDeMusicas(songs) {
    songsCache = songs;
    desenharTabelaDeMusicas(songsCache, elements.songList);
  }

  // Recebe o ID da linha clicada e coloca essa música no formulário.
  function abrirEdicaoDaMusica(id) {
    const song = songsCache[id];
    if (!song) return;
    currentEditingId = id;
    preencherFormularioComMusica(song, elements);
  }

  // Sai do modo de edição e limpa o formulário.
  function cancelarEdicao() {
    currentEditingId = null;
    limparFormulario(elements);
  }

  // Responde aos cliques em Editar e Excluir em qualquer linha da tabela.
  async function aoClicarNaAcaoDaMusica(event) {
    // Encontra o botão e a linha, mesmo se o clique foi no desenho do botão.
    const button = event.target.closest("button");
    const row = event.target.closest("tr[data-song-id]");
    if (!button || !row) return;

    const id = row.dataset.songId;
    if (button.classList.contains("btn-edit")) {
      abrirEdicaoDaMusica(id);
      return;
    }

    if (button.classList.contains("btn-delete") && confirm("Deseja eliminar esta música?")) {
      if (currentEditingId === id) cancelarEdicao();
      try {
        // Só apaga a música depois que a pessoa confirma.
        await apagarMusica(id);
      } catch (error) {
        alert("Erro ao eliminar: " + error.message);
      }
    }
  }

  // Recebe o envio do formulário, prepara os arquivos e salva a música.
  async function salvarMusicaDoFormulario(event) {
    // Evita que o envio recarregue a página.
    event.preventDefault();

    const title = elements.titleInput.value.trim();
    const artist = elements.artistInput.value.trim();
    // Lê a primeira imagem e o primeiro áudio escolhidos no formulário.
    const coverFile = elements.coverInput.files[0];
    const audioFile = elements.audioInput.files[0];
    // Confere novamente se título e artista foram preenchidos.
    if (!title || !artist) return;

    // Para uma música nova, é preciso escolher a capa e o áudio.
    // Na edição, os arquivos atuais podem continuar sem mudanças.
    if (!currentEditingId && (!coverFile || !audioFile)) {
      alert("Por favor, selecione a imagem da capa e o ficheiro MP3.");
      return;
    }

    try {
      mostrarSalvamentoEmAndamento(elements);

      // Na edição, começa com a capa e o áudio já salvos.
      // Para uma música nova, esses campos começam vazios.
      let coverUrl = currentEditingId ? songsCache[currentEditingId].coverUrl : "";
      let audioUrl = currentEditingId ? songsCache[currentEditingId].audioUrl : "";

      // Se escolheu arquivos novos, transforma cada um em texto antes de salvar.
      // Se deixou o campo vazio durante a edição, mantém o arquivo atual.
      if (coverFile) coverUrl = await prepararArquivoParaSalvar(coverFile);
      if (audioFile) audioUrl = await prepararArquivoParaSalvar(audioFile);

      // Junta os dados da música. A capa e o áudio são guardados como texto
      // no banco de dados, e não como arquivos separados.
      const songData = {
        title,
        artist,
        coverUrl,
        audioUrl,
        updatedAt: Date.now()
      };

      if (currentEditingId) {
        // Usa o ID para atualizar a música que já existe.
        await salvarEdicaoDaMusica(currentEditingId, songData);
      } else {
        // Em uma música nova, também guarda a data de criação.
        songData.createdAt = Date.now();
        await salvarMusicaNova(songData);
      }

      // Depois de salvar, limpa o formulário e sai do modo de edição.
      cancelarEdicao();
    } catch (error) {
      alert("Erro ao guardar: " + error.message);
      mostrarErroDeSalvamento(Boolean(currentEditingId), elements);
    }
  }

  // Liga os botões às funções e começa a receber a lista de músicas salvas.
  elements.cancelButton.addEventListener("click", cancelarEdicao);
  elements.songList.addEventListener("click", aoClicarNaAcaoDaMusica);
  elements.form.addEventListener("submit", salvarMusicaDoFormulario);

  acompanharMusicasParaPainel(atualizarTabelaDeMusicas);
}
