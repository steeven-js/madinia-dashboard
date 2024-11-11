// Imports Firebase Storage pour la gestion des fichiers
import { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// Imports Firebase Firestore pour la base de données
import { doc, query, setDoc, getDoc, addDoc, orderBy, collection, onSnapshot } from 'firebase/firestore';

// Import des instances Firebase initialisées
import { db, storage } from 'src/utils/firebase';

/**
 * Crée ou met à jour une auto-école dans Firestore
 * @param {Object} data - Les données de l'auto-école
 * @param {string} [data.id] - L'ID de l'auto-école (optionnel, si absent = création)
 * @returns {Promise<Object>} Résultat de l'opération avec les données créées/mises à jour
 */
export async function saveAutoEcole(data) {
  try {
    // Validation des données d'entrée
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Les données sont requises');
    }

    const isUpdate = Boolean(data.id);
    const autoEcoleData = { ...data };
    let avatarUrl = null;

    // Gestion du téléchargement de l'avatar si présent
    if (data.avatarUrl && data.avatarUrl instanceof File) {
      try {
        // Création d'un nom de fichier unique
        const fileName = `auto-ecole/${Date.now()}_${data.avatarUrl.name}`;
        const storageRef = ref(storage, fileName);
        // Upload du fichier
        await uploadBytes(storageRef, data.avatarUrl);
        // Récupération de l'URL de téléchargement
        avatarUrl = await getDownloadURL(storageRef);
        autoEcoleData.avatarUrl = avatarUrl;
      } catch (uploadError) {
        console.error('Erreur lors du téléchargement de l\'avatar:', uploadError);
        throw new Error('Erreur lors du téléchargement de l\'avatar');
      }
    } else if (!data.avatarUrl && isUpdate) {
      // En cas de mise à jour, si pas d'avatar, on met explicitement à null
      autoEcoleData.avatarUrl = null;
    } else if (!isUpdate) {
      // En cas de création, si pas d'avatar, on supprime la propriété
      delete autoEcoleData.avatarUrl;
    }

    // Nettoyage des données non nécessaires
    delete autoEcoleData.file;

    // Préparation des données avec timestamps
    const timestampedData = {
      ...autoEcoleData,
      updatedAt: new Date(),
    };

    if (!isUpdate) {
      // Cas création : ajout des timestamps initiaux
      timestampedData.createdAt = new Date();
      timestampedData.deletedAt = null;
      delete timestampedData.id; // On supprime l'id pour la création
    }

    let docRef;
    let docSnap;

    if (isUpdate) {
      // Mise à jour
      docRef = doc(db, "auto-ecole", data.id);
      await setDoc(docRef, timestampedData, { merge: true });
      docSnap = await getDoc(docRef);
    } else {
      // Création
      docRef = await addDoc(collection(db, "auto-ecole"), timestampedData);
      docSnap = await getDoc(docRef);
    }

    return {
      success: true,
      message: `Auto-école ${isUpdate ? 'mise à jour' : 'créée'} avec succès`,
      data: {
        id: docRef.id,
        ...docSnap.data()
      }
    };

  } catch (error) {
    console.error(`Erreur lors de la ${data.id ? 'mise à jour' : 'création'}:`, error);
    throw error;
  }
}

/**
 * Suppression douce d'une auto-école
 * @param {string} id - L'ID de l'auto-école à supprimer
 * @returns {Promise<Object>} Résultat de l'opération
 */
export async function deleteAutoEcole(id) {
  try {
    if (!id) {
      throw new Error('ID requis');
    }

    await setDoc(
      doc(db, "auto-ecole", id),
      {
        deletedAt: new Date(),
        updatedAt: new Date()
      },
      { merge: true }
    );

    return {
      success: true,
      message: 'Auto-école supprimée avec succès'
    };

  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    throw error;
  }
}

/**
 * Récupère une auto-école par son ID
 * @param {string} id - L'ID de l'auto-école
 * @returns {Promise<Object>} Les données de l'auto-école
 */
export function useAutoEcoleById(id) {
  const [autoEcoleById, setAutoEcoleById] = useState(null);
  const [autoEcoleByIdLoading, setAutoEcoleByIdLoading] = useState(true);
  const [autoEcoleError, setAutoEcoleError] = useState(null);

  useEffect(() => {
    let unsubscribe = () => {};

    const fetchAutoEcole = () => {
      if (!id) {
        setAutoEcoleByIdLoading(false);
        return;
      }

      const autoEcoleRef = doc(db, 'auto-ecole', id);

      unsubscribe = onSnapshot(
        autoEcoleRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            setAutoEcoleById({ id: docSnapshot.id, ...docSnapshot.data() });
            setAutoEcoleError(null);
          } else {
            setAutoEcoleError("L'auto-école n'existe pas");
            setAutoEcoleById(null);
          }
          setAutoEcoleByIdLoading(false);
        },
        (error) => {
          console.error("Erreur lors de la récupération de l'auto-école:", error);
          setAutoEcoleError(error.message);
          setAutoEcoleByIdLoading(false);
        }
      );
    };

    fetchAutoEcole();

    // Nettoyage du listener lors du démontage du composant
    return () => unsubscribe();
  }, [id]);

  return { autoEcoleById, autoEcoleByIdLoading, autoEcoleError };
}

/**
 * Hook personnalisé pour récupérer toutes les auto-écoles en temps réel
 * @returns {Object} État des auto-écoles {data, loading, error}
 */
export function useAutoEcoles() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Création de la requête
    const q = query(
      collection(db, "auto-ecole"),
      orderBy("createdAt", "desc")
    );

    // Mise en place de l'écouteur temps réel
    const unsubscribe = onSnapshot(q,
      (querySnapshot) => {
        // En cas de succès
        const autoEcoles = [];
        querySnapshot.forEach((_doc) => {
          autoEcoles.push({
            id: _doc.id,
            ..._doc.data()
          });
        });
        setData(autoEcoles);
        setLoading(false);
      },
      (_error) => {
        // En cas d'erreur
        setLoading(false);
        if (_error.code === 'failed-precondition') {
          console.error(
            'Un index est requis pour cette requête. Veuillez suivre le lien pour le créer :',
            _error.message
          );
          setError('Index manquant pour cette requête');
        } else {
          console.error('Erreur lors de la récupération:', _error);
          setError('Erreur lors de la récupération des données');
        }
      }
    );

    // Nettoyage lors du démontage du composant
    return () => unsubscribe();
  }, []); // Dépendances vides car on veut que l'effet s'exécute une seule fois

  return {
    data,
    loading,
    error,
    success: !error
  };
}

export async function updateFastAutoEcole({ currentAutoEcole, data }) {
  try {
    const autoEcoleRef = doc(db, 'auto-ecole', currentAutoEcole.id);
    await setDoc(autoEcoleRef, data, { merge: true });
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    throw error;
  }
}
