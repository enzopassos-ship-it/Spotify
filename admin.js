import { db } from "./firebase-config.js";
import { ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const addSongForm = document.getElementById('addSongForm');
const adminSongList = document.getElementById('adminSongList');
const formTitleText = document.getElementById('formTitleText');
const saveBtnText = document.getElementById('saveBtnText');
const saveBtnIcon = document.getElementById('saveBtnIcon');
const saveBtn = document.getElementById('saveBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

const coverFileInput = document.getElementById('coverFile');
const audioFileInput = document.getElementById('audioFile');
const coverStatus = document.getElementById('coverStatus');
const audioStatus = document.getElementById('audioStatus');

let currentEditingId = null;
let songsCache = {};

// Converter ficheiro do computador para Data URL (Base64)
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// 1. Carregar lista em tempo real do Realtime Database
onValue(ref(db, 'songs'), (snapshot) => {
  adminSongList.innerHTML = '';
  const data = snapshot.val();
  songsCache = data || {};

  if (!data) {
    adminSongList.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #b3b3b3; padding: 24px;">Nenhuma música registada.</td></tr>';
    return;
  }

  Object.keys(data).forEach((id) => {
    const song = data[id];
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>
        <img src="${song.coverUrl}" alt="${song.title}" class="admin-cover-thumb" onerror="this.src='https://via.placeholder.com/48?text=Capa'">
      </td>
      <td class="song-title-cell">${song.title}</td>
      <td class="song-artist-cell">${song.artist}</td>
      <td style="text-align: right;">
        <div class="action-btns">
          <button class="btn-edit" title="Editar" data-id="${id}"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="btn-delete" title="Eliminar" data-id="${id}"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </td>
    `;

    adminSongList.appendChild(row);
  });

  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => startEditing(e.currentTarget.getAttribute('data-id')));
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (confirm('Deseja eliminar esta música?')) {
        if (currentEditingId === id) resetForm();
        remove(ref(db, `songs/${id}`));
      }
    });
  });
});

// 2. Preencher formulário em modo de Edição
function startEditing(id) {
  const song = songsCache[id];
  if (!song) return;

  currentEditingId = id;
  document.getElementById('songTitle').value = song.title || '';
  document.getElementById('songArtist').value = song.artist || '';
  
  coverFileInput.required = false;
  audioFileInput.required = false;

  coverStatus.textContent = "A manter a imagem atual. Selecione um novo ficheiro apenas se desejar alterar.";
  audioStatus.textContent = "A manter o áudio atual. Selecione um novo ficheiro apenas se desejar alterar.";

  formTitleText.textContent = 'Editar Música';
  saveBtnText.textContent = 'Atualizar Música';
  saveBtnIcon.className = 'fa-solid fa-floppy-disk';
  cancelEditBtn.classList.remove('hidden');
}

// 3. Resetar o Formulário
function resetForm() {
  currentEditingId = null;
  addSongForm.reset();

  coverFileInput.required = true;
  audioFileInput.required = true;

  coverStatus.textContent = "";
  audioStatus.textContent = "";

  formTitleText.textContent = 'Adicionar Nova Música';
  saveBtnText.textContent = 'Guardar Música';
  saveBtnIcon.className = 'fa-solid fa-upload';
  saveBtn.disabled = false;
  cancelEditBtn.classList.add('hidden');
}

cancelEditBtn.addEventListener('click', resetForm);

// 4. Submeter formulário e guardar no Realtime Database
addSongForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('songTitle').value.trim();
  const artist = document.getElementById('songArtist').value.trim();
  const coverFile = coverFileInput.files[0];
  const audioFile = audioFileInput.files[0];

  if (!title || !artist) return;

  if (!currentEditingId && (!coverFile || !audioFile)) {
    alert("Por favor, selecione a imagem da capa e o ficheiro MP3 do seu computador.");
    return;
  }

  // Aviso de tamanho recomendado para o Realtime Database
  if (audioFile && audioFile.size > 12 * 1024 * 1024) {
    alert("O ficheiro de áudio excede 12MB. Para um melhor desempenho no Realtime Database, prefira ficheiros menores.");
  }

  try {
    saveBtn.disabled = true;
    saveBtnText.textContent = "A processar ficheiros...";

    let coverUrl = currentEditingId ? songsCache[currentEditingId].coverUrl : "";
    let audioUrl = currentEditingId ? songsCache[currentEditingId].audioUrl : "";

    if (coverFile) {
      coverUrl = await fileToDataURL(coverFile);
    }
    if (audioFile) {
      audioUrl = await fileToDataURL(audioFile);
    }

    const songData = {
      title,
      artist,
      coverUrl,
      audioUrl,
      updatedAt: Date.now()
    };

    if (currentEditingId) {
      await update(ref(db, `songs/${currentEditingId}`), songData);
    } else {
      songData.createdAt = Date.now();
      await push(ref(db, 'songs'), songData);
    }

    resetForm();
  } catch (err) {
    alert("Erro ao guardar no Realtime Database: " + err.message);
    saveBtn.disabled = false;
    saveBtnText.textContent = currentEditingId ? 'Atualizar Música' : 'Guardar Música';
  }
});