// Procura no admin.html os campos, botões e a tabela usados pelo painel.
export function pegarElementosDoPainel() {
  return {
    form: document.getElementById("addSongForm"),
    titleInput: document.getElementById("songTitle"),
    artistInput: document.getElementById("songArtist"),
    coverInput: document.getElementById("coverFile"),
    audioInput: document.getElementById("audioFile"),
    coverStatus: document.getElementById("coverStatus"),
    audioStatus: document.getElementById("audioStatus"),
    saveButton: document.getElementById("saveBtn"),
    saveButtonIcon: document.getElementById("saveBtnIcon"),
    saveText: document.getElementById("saveBtnText"),
    cancelButton: document.getElementById("cancelEditBtn"),
    formTitleText: document.getElementById("formTitleText"),
    songList: document.getElementById("adminSongList")
  };
}

// Recebe as músicas e mostra uma linha para cada uma na tabela.
// Guarda o ID em cada linha para os botões saberem qual música foi escolhida.
export function desenharTabelaDeMusicas(songs, songList) {
  songList.innerHTML = "";
  const ids = Object.keys(songs);
  if (ids.length === 0) {
    songList.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #b3b3b3; padding: 24px;">Nenhuma música registada.</td></tr>';
    return;
  }

  for (const id of ids) {
    const song = songs[id];
    const row = document.createElement("tr");
    row.dataset.songId = id;
    row.innerHTML = `
      <td>
        <img src="${song.coverUrl}" alt="${song.title}" class="admin-cover-thumb" onerror="this.src='assets/cover-placeholder.svg'">
      </td>
      <td class="song-title-cell">${song.title}</td>
      <td class="song-artist-cell">${song.artist}</td>
      <td style="text-align: right;">
        <div class="action-btns">
          <button class="btn-edit" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="btn-delete" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </td>
    `;
    songList.appendChild(row);
  }
}

// Recebe uma música e coloca seu título e artista no formulário.
// Os campos de arquivo ficam vazios; o navegador não permite preencher arquivos.
export function preencherFormularioComMusica(song, elements) {
  elements.titleInput.value = song.title;
  elements.artistInput.value = song.artist;
  elements.coverInput.value = "";
  elements.audioInput.value = "";
  elements.coverStatus.textContent = song.coverUrl ? "Capa atual mantida se não escolher outra." : "";
  elements.audioStatus.textContent = song.audioUrl ? "Áudio atual mantido se não escolher outro." : "";
  elements.formTitleText.textContent = "Editar Música";
  elements.saveButtonIcon.className = "fa-solid fa-floppy-disk";
  elements.saveText.textContent = "Atualizar Música";
  elements.cancelButton.classList.remove("hidden");
}

// Limpa o formulário e prepara os botões para cadastrar outra música.
export function limparFormulario(elements) {
  elements.form.reset();
  elements.coverStatus.textContent = "";
  elements.audioStatus.textContent = "";
  elements.formTitleText.textContent = "Adicionar Nova Música";
  elements.saveButtonIcon.className = "fa-solid fa-upload";
  elements.saveText.textContent = "Guardar Música";
  elements.saveButton.disabled = false;
  elements.cancelButton.classList.add("hidden");
}

// Mostra que a música está sendo salva e desativa o botão para evitar outro envio.
export function mostrarSalvamentoEmAndamento(elements) {
  elements.saveButton.disabled = true;
  elements.saveText.textContent = "A guardar...";
}

// Se o salvamento falhar, ativa o botão novamente e restaura seu texto.
export function mostrarErroDeSalvamento(isEditing, elements) {
  elements.saveButton.disabled = false;
  elements.saveText.textContent = isEditing ? "Atualizar Música" : "Guardar Música";
}
