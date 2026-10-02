import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js"; // Importa a função de inicialização da aplicação Firebase
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js"; // Importa a função para aceder à base de dados em tempo real

const firebaseConfig = { // Define o objeto de configuração com as credenciais do projeto Firebase
  apiKey: "AIzaSyA9l6PzTlXZsq7tZ1aVbxPYv91lob0JKmw", // Chave de API única para autenticação no Firebase
  authDomain: "enzo-48a4a.firebaseapp.com", // Domínio de autenticação associado ao projeto
  databaseURL: "https://enzo-48a4a-default-rtdb.firebaseio.com", // URL do servidor Realtime Database
  projectId: "enzo-48a4a", // Identificador único do projeto Firebase
  storageBucket: "enzo-48a4a.firebasestorage.app", // Endereço do bucket do Firebase Storage
  messagingSenderId: "697747200629", // ID do remetente para mensagens de serviço
  appId: "1:697747200629:web:36aefd1339e3569d7e363c", // Identificador único da aplicação web
  measurementId: "G-6XJBNYMFES" // ID de rastreio e análise estatística
}; // Fim do objeto de configuração

const app = initializeApp(firebaseConfig); // Inicializa a instância da aplicação Firebase com a configuração
export const db = getDatabase(app); // Exporta a referência da base de dados pronta a ser utilizada noutros módulos