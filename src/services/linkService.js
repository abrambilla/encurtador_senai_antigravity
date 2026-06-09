import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { generateShortCode } from '../utils/hash';

/**
 * Cria um novo link encurtado no Firestore.
 * O shortCode gerado é utilizado como a ID do documento para leitura O(1).
 * 
 * @param {string} originalUrl - A URL longa de destino.
 * @param {string} userId - O UID do criador.
 * @returns {Promise<object>} O link criado.
 */
export async function createLink(originalUrl, userId) {
  let shortCode = generateShortCode();
  let docRef = doc(db, 'links', shortCode);
  let docSnap = await getDoc(docRef);

  // Tratamento contra colisões (raro com 62^6 combinações, mas seguro)
  let attempts = 0;
  while (docSnap.exists() && attempts < 5) {
    shortCode = generateShortCode();
    docRef = doc(db, 'links', shortCode);
    docSnap = await getDoc(docRef);
    attempts++;
  }

  const payload = {
    originalUrl,
    shortCode,
    userId,
    clicks: 0,
    createdAt: new Date(), // Salva a data local atual (Firestore converte em Timestamp)
    updatedAt: new Date()
  };

  await setDoc(docRef, payload);
  return payload;
}

/**
 * Exclui um link do Firestore.
 * @param {string} shortCode - O código do link.
 */
export async function deleteLink(shortCode) {
  const docRef = doc(db, 'links', shortCode);
  await deleteDoc(docRef);
}

/**
 * Incrementa o contador de cliques de um link.
 * Importante: Para permitir acesso público de gravação de acordo com rules,
 * atualizamos APENAS o campo 'clicks'.
 * 
 * @param {string} shortCode - O código do link.
 */
export async function incrementClicks(shortCode) {
  const docRef = doc(db, 'links', shortCode);
  await updateDoc(docRef, {
    clicks: increment(1)
  });
}

/**
 * Busca um link específico por seu código.
 * @param {string} shortCode - O código do link.
 * @returns {Promise<object|null>} Os dados do link ou null.
 */
export async function getLink(shortCode) {
  const docRef = doc(db, 'links', shortCode);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

/**
 * Escuta os links de um usuário em tempo real.
 * Realiza ordenação client-side para evitar a necessidade de criar
 * índices compostos no painel do Firebase.
 * 
 * @param {string} userId - O UID do usuário.
 * @param {function} callback - Função de retorno com a lista de links.
 * @returns {function} Função de desinscrição do listener.
 */
export function subscribeUserLinks(userId, callback, onError) {
  const q = query(
    collection(db, 'links'),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const links = [];
      snapshot.forEach((doc) => {
        links.push({ id: doc.id, ...doc.data() });
      });

      // Ordenação client-side por createdAt descendente
      links.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });

      callback(links);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}
