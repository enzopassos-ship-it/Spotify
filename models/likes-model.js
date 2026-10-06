import { db } from "./firebase-config.js";
import { onValue, ref, remove, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Procura o identificador salvo neste navegador.
// Se não encontrar, cria um e salva para lembrar as curtidas neste navegador.
export function pegarIdDoNavegador() {
  let userId = localStorage.getItem("spotify_user_id");
  if (!userId) {
    userId = "user_" + Math.random().toString(36).substring(2, 9);
    localStorage.setItem("spotify_user_id", userId);
  }
  return userId;
}

// Acompanha no Firebase as curtidas deste navegador.
// Quando elas mudam, envia para quem chamou a lista de IDs das músicas.
export function acompanharCurtidasDoUsuario(userId, callback) {
  // O Firebase chama esta função ao carregar ou mudar as curtidas.
  function listarIdsCurtidos(snapshot) {
    const data = snapshot.val();
    // Cada nome dentro desta lista é o ID de uma música curtida.
    callback(data ? Object.keys(data) : []);
  }

  return onValue(ref(db, `likes/${userId}`), listarIdsCurtidos);
}

// Recebe os IDs do navegador e da música, além de dizer se ela está curtida.
// Se já está curtida, apaga a curtida; se não, salva uma nova.
export function salvarOuRemoverCurtida(userId, songId, isLiked) {
  const likeRef = ref(db, `likes/${userId}/${songId}`);
  return isLiked ? remove(likeRef) : set(likeRef, true);
}
