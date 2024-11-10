import { doc, setDoc, getDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from 'src/utils/firebase';

export async function createAutoEcole(data) {
  try {
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Les données sont requises');
    }

    const autoEcoleData = { ...data };
    let avatarUrl = null;

    if (data.avatarUrl && data.avatarUrl instanceof File) {
      try {
        const fileName = `auto-ecole/${Date.now()}_${data.avatarUrl.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, data.avatarUrl);
        avatarUrl = await getDownloadURL(storageRef);
        autoEcoleData.avatarUrl = avatarUrl;
      } catch (uploadError) {
        console.error('Erreur lors du téléchargement de l\'avatar:', uploadError);
        throw new Error('Erreur lors du téléchargement de l\'avatar');
      }
    } else {
      delete autoEcoleData.avatarUrl;
    }

    delete autoEcoleData.id;
    delete autoEcoleData.file;

    const timestampedData = {
      ...autoEcoleData,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };

    const docRef = await addDoc(collection(db, "auto-ecole"), timestampedData);
    const docSnap = await getDoc(docRef);

    return {
      success: true,
      message: 'Auto-école créée avec succès',
      data: {
        id: docRef.id,
        ...docSnap.data()
      }
    };

  } catch (error) {
    console.error('Erreur lors de la création:', error);
    throw error;
  }
}

export async function updateAutoEcole(data) {
  try {
    if (!data || !data.id) {
      throw new Error('ID et données requis');
    }

    const autoEcoleData = { ...data };
    let avatarUrl = null;

    if (data.avatarUrl && data.avatarUrl instanceof File) {
      try {
        const fileName = `auto-ecole/${Date.now()}_${data.avatarUrl.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, data.avatarUrl);
        avatarUrl = await getDownloadURL(storageRef);
        autoEcoleData.avatarUrl = avatarUrl;
      } catch (uploadError) {
        console.error('Erreur lors du téléchargement de l\'avatar:', uploadError);
        throw new Error('Erreur lors du téléchargement de l\'avatar');
      }
    } else if (!data.avatarUrl) {
      autoEcoleData.avatarUrl = null;
    }

    delete autoEcoleData.file;
    autoEcoleData.updatedAt = new Date();

    const docRef = doc(db, "auto-ecole", data.id);
    await setDoc(docRef, autoEcoleData, { merge: true });

    return {
      success: true,
      message: 'Auto-école mise à jour avec succès',
      data: autoEcoleData
    };

  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    throw error;
  }
}

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

export async function getAutoEcoleById(id) {
  try {
    if (!id) {
      throw new Error('ID requis');
    }

    const docSnap = await getDoc(doc(db, "auto-ecole", id));

    if (docSnap.exists()) {
      const data = docSnap.data();

      if (data.deletedAt) {
        return {
          success: false,
          message: 'Auto-école non trouvée'
        };
      }

      return {
        success: true,
        data: {
          id: docSnap.id,
          ...data
        }
      };
    }

    return {
      success: false,
      message: 'Auto-école non trouvée'
    };

  } catch (error) {
    console.error('Erreur lors de la récupération:', error);
    throw error;
  }
}

export async function getAutoEcoles() {
  try {
    const q = query(
      collection(db, "auto-ecole"),
      where("deletedAt", "==", null)
    );

    const querySnapshot = await getDocs(q);
    const autoEcoles = [];

    querySnapshot.forEach((_doc) => {
      autoEcoles.push({
        id: _doc.id,
        ..._doc.data()
      });
    });

    return {
      success: true,
      data: autoEcoles.sort((a, b) => b.createdAt - a.createdAt)
    };

  } catch (error) {
    console.error('Erreur lors de la récupération:', error);
    throw error;
  }
}
