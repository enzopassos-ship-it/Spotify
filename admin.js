import { db } from "./firebase-config.js";
import { ref as dbRef, push, set, update, remove, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Elementos do DOM
const form = document.getElementById('adminSongForm');
const songIdInput = document.getElementById('songId');
const titleInput = document.getElementById('inputTitle');
const artistInput = document.getElementById('inputArtist');
const coverInput = document.getElementById('inputCover');
const audioInput = document.getElementById('inputAudio');
const btnSave = document.getElementById('btnSave');
const btnCancel = document.getElementById('btnCancel');
const tableBody = document.getElementById('adminTableBody');
const formTitle = document.getElementById('formTitle');

// Função auxiliar para converter ficheiros para Base64
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = (error) => reject(error);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = songIdInput.value;
  const title = titleInput.value;
  const artist = artistInput.value;
  const coverFile = coverInput.files[0];
  const audioFile = audioInput.files[0];

  btnSave.textContent = "A processar...";
  btnSave.disabled = true;

  try {
    let coverUrl = "";
    let audioUrl = "";

    // Converte os ficheiros locais para texto Base64
    if (coverFile) {
      coverUrl = await fileToBase64(coverFile);
    }

    if (audioFile) {
      coverUrl = await fileToBase64(coverFile);
      audioUrl = await fileToBase64(audioFile);
    }

    if (id) {
      // Editar registo existente
      const updateData = { title, artist };
      if (coverUrl) updateData.coverUrl = coverUrl;
      if (audioUrl) updateData.audioUrl = audioUrl;

      await update(dbRef(db, `songs/${id}`), updateData);
    } else {
      // Criar novo registo
      if (!coverUrl || !audioUrl) {
        alert("Seleciona os ficheiros de capa e áudio.");
        btnSave.textContent = "Salvar Música";
        btnSave.disabled = false;
        return;
      }

      const newSongRef = push(dbRef(db, 'songs'));
      await set(newSongRef, {
        title,
        artist,
        coverUrl,
        audioUrl,
        createdAt: Date.now()
      });
    }

    resetForm();
  } catch (error) {
    console.error("Erro ao salvar:", error);
    alert("Erro ao processar os ficheiros. Tenta utilizar um MP3 mais pequeno.");
  } finally {
    btnSave.textContent = "Salvar Música";
    btnSave.disabled = false;
  }
});

// Ler músicas em tempo real
onValue(dbRef(db, 'songs'), (snapshot) => {
  tableBody.innerHTML = '';
  const data = snapshot.val();

  if (data) {
    Object.keys(data).forEach((id) => {
      const song = { id, ...data[id] };
      renderRow(song);
    });
  }
});

// Funções de suporte da interface
function renderRow(song) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><img src="${song.coverUrl}" class="table-thumb"></td>
    <td><strong>${song.title}</strong></td>
    <td>${song.artist}</td>
    <td>
      <button class="btn-action edit-btn">✏️ Editar</button>
      <button class="btn-action delete-btn">🗑️ Excluir</button>
    </td>
  `;

  row.querySelector('.edit-btn').addEventListener('click', () => editSong(song));
  row.querySelector('.delete-btn').addEventListener('click', () => deleteSong(song.id));

  tableBody.appendChild(row);
}

function editSong(song) {
  songIdInput.value = song.id;
  titleInput.value = song.title;
  artistInput.value = song.artist;
  formTitle.textContent = "Editar Música";
  btnCancel.classList.remove('hidden');
}

async function deleteSong(id) {
  if (confirm("Desejas excluir esta música?")) {
    await remove(dbRef(db, `songs/${id}`));
  }
}

function resetForm() {
  form.reset();
  songIdInput.value = '';
  formTitle.textContent = "Adicionar Nova Música";
  btnCancel.classList.add('hidden');
}

btnCancel.addEventListener('click', resetForm);