// src/data/store.js
// ─────────────────────────────────────────────────────────────
// Camada de dados: persistência via LocalStorage usando JSON
// ESM: este módulo exporta funções puras (programação funcional)
// ─────────────────────────────────────────────────────────────

import loginsData from './logins.json';

// Prefixo usado para todas as chaves de armazenamento no LocalStorage.
// Isso permite separar o banco de dados do SIRA de outras chaves que o app
// ou o navegador possa gravar no localStorage.
const DB_PREFIX = 'sira_db';

// Constrói a chave de armazenamento a partir do e-mail do usuário e da coleção.
// Exemplo: sira_db/admin@ifpb.edu.br/rooms.json
const buildCollectionKey = (email, collection) => `${DB_PREFIX}/${email}/${collection}.json`;

// Estado global atual do usuário logado. Esse valor é atualizado no login
// e usado como fallback em loadCollection/saveCollection quando o e-mail não
// é passado explicitamente.
export let CURRENT_USER = null;

// Carrega uma coleção específica do LocalStorage para um usuário.
// Se o usuário ou a coleção não estiverem definidos, retorna um array vazio.
export function loadCollection(collection, email = CURRENT_USER?.email) {
  if (!email || !collection) return [];

  // Constrói a chave com base no usuário e coleção solicitados.
  const key = buildCollectionKey(email, collection);

  // Tenta ler o JSON armazenado. Se não existir, retorna array vazio.
  const raw = localStorage.getItem(key);
  if (!raw) return [];

  try {
    // Se o JSON estiver válido, converte para um valor JS.
    return JSON.parse(raw);
  } catch {
    // Se houve erro de parse, evita crash e retorna uma coleção limpa.
    return [];
  }
}

// Persiste uma coleção no LocalStorage para um usuário.
// O retorno é o mesmo objeto enviado, o que facilita encadeamento nas chamadas.
export function saveCollection(collection, data, email = CURRENT_USER?.email) {
  if (!email || !collection) return null;

  // Garante que a chave seja sempre construída da mesma maneira.
  const key = buildCollectionKey(email, collection);

  // Serializa o payload em JSON antes de gravar.
  const payload = JSON.stringify(data);
  localStorage.setItem(key, payload);

  // Retorna os dados gravados para conveniência.
  return data;
}

export function login(email) {
  // Sempre procuramos primeiro na fonte da verdade nativa (loginsData),
  // pois o LocalStorage pode conter dados de sessão obsoletos ou inválidos.
  let users = loginsData;
  let user = users.find((u) => u.email === email);

  if (!user) {
    // Se não encontrou no seed local, usamos o cache global de usuários.
    // Isso permite suportar futuros cadastros que persistam na aplicação.
    users = getUsersGlobal();
    user = users.find((u) => u.email === email);
  }

  if (user) {
    // Se o usuário existe, define a sessão atual e grava a conta no storage.
    CURRENT_USER = user;
    localStorage.setItem('sira-auth', email);
    return true;
  }

  return false;
}

export function logout() {
  // Limpa a sessão atual em memória e remove a marcação do storage.
  CURRENT_USER = null;
  localStorage.removeItem('sira-auth');
}

export function tryRestoreSession() {
  // Tenta restaurar a sessão com base no e-mail persistido anteriormente.
  const email = localStorage.getItem('sira-auth');
  if (email) login(email);
}

// Global para seeds iniciais sem login.
// Utilizado como fallback quando o app precisa da lista de usuários e não
// existe um usuário autenticado ou a chave foi perdida.
export const getUsersGlobal = () => {
  const raw = localStorage.getItem('sira:users');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // Se a chave existir e estiver corrompida, ignoramos e reconstruímos abaixo.
    }
  }

  // Inicializa o LocalStorage com o seed de login padrão.
  localStorage.setItem('sira:users', JSON.stringify(loginsData));
  return loginsData;
};
