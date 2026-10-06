import { db } from "./firebase-config.js";
import { onValue, push, ref, remove, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Lê a lista "songs" do Firebase e avisa o player quando ela mudar.
// Cada música é entregue com seu ID junto dos outros dados.
export function acompanharMusicasDoFirebase(callback) {
  // O Firebase executa esta função ao carregar ou mudar a lista.
  function prepararListaDeMusicas(snapshot) {
    // val() pega os dados recebidos. Se não houver músicas, usa uma lista vazia.
    const data = snapshot.val() || {};
    // Junta o ID de cada música aos seus dados para o player poder encontrá-la.
    const songs = Object.entries(data).map(([id, song]) => ({ id, ...song }));
    callback(songs);
  }

  // Abre o caminho "songs" e mantém esta leitura atualizada em tempo real.
  return onValue(ref(db, "songs"), prepararListaDeMusicas);
}

// Lê as mesmas músicas, mantendo cada uma ligada ao seu ID.
// O painel usa o ID para editar ou apagar a música escolhida.
export function acompanharMusicasParaPainel(callback) {
  // O Firebase chama esta função quando carrega ou altera a lista.
  function prepararMusicasParaPainel(snapshot) {
    // Entrega uma lista vazia quando ainda não há músicas.
    callback(snapshot.val() || {});
  }

  // Abre a lista "songs" e avisa o painel quando ela mudar.
  return onValue(ref(db, "songs"), prepararMusicasParaPainel);
}

// Recebe os dados de uma música nova e salva com um ID criado pelo Firebase.
export function salvarMusicaNova(songData) {
  return push(ref(db, "songs"), songData);
}

// Recebe o ID e os novos dados e atualiza a música que já está salva.
export function salvarEdicaoDaMusica(id, songData) {
  return update(ref(db, `songs/${id}`), songData);
}

// Recebe o ID da música escolhida e a apaga do Firebase.
export function apagarMusica(id) {
  return remove(ref(db, `songs/${id}`));
}
