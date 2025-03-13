// Script pour supprimer complètement un utilisateur de Firebase (Auth, Firestore, Storage)
// Usage: node scripts/deleteUser.js <userId>

import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Obtenir le chemin du répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Chemin vers le fichier de clé de service
const serviceAccountPath = resolve(__dirname, '../madinia-dashboard-firebase-adminsdk-fbsvc-0bbf6e78a4.json');

// Vérifier si le fichier existe
if (!fs.existsSync(serviceAccountPath)) {
    console.error('Erreur: Fichier de clé de service introuvable:', serviceAccountPath);
    process.exit(1);
}

// Initialiser l'application Firebase Admin
try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: `${serviceAccount.project_id}.appspot.com`
    });

    console.log('Firebase Admin SDK initialisé avec succès');
} catch (error) {
    console.error('Erreur lors de l\'initialisation de Firebase Admin:', error);
    process.exit(1);
}

// Récupérer l'ID utilisateur depuis les arguments de ligne de commande
const userId = process.argv[2];

if (!userId) {
    console.error('Erreur: Veuillez fournir un ID utilisateur');
    console.log('Usage: node scripts/deleteUser.js <userId>');
    process.exit(1);
}

/**
 * Supprime tous les fichiers dans un dossier de Storage
 * @param {string} path - Chemin du dossier dans Storage
 */
async function deleteStorageFolder(path) {
    const bucket = admin.storage().bucket();

    try {
        // Lister tous les fichiers dans le dossier
        const [files] = await bucket.getFiles({ prefix: path });

        if (files.length === 0) {
            console.log(`Aucun fichier trouvé dans ${path}`);
            return;
        }

        // Supprimer chaque fichier
        const deletePromises = files.map(file => file.delete());
        await Promise.all(deletePromises);

        console.log(`${files.length} fichiers supprimés de ${path}`);
    } catch (error) {
        console.warn(`Erreur lors de la suppression des fichiers dans ${path}:`, error.message);
    }
}

/**
 * Supprime complètement un utilisateur (Auth, Firestore, Storage)
 * @param {string} uid - ID de l'utilisateur à supprimer
 */
async function deleteUserCompletely(uid) {
    console.log(`Début de la suppression de l'utilisateur ${uid}...`);

    try {
        // 1. Vérifier si l'utilisateur existe dans Firebase Auth
        try {
            const userRecord = await admin.auth().getUser(uid);
            console.log(`Utilisateur trouvé dans Firebase Auth: ${userRecord.email || userRecord.uid}`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.warn(`Utilisateur ${uid} non trouvé dans Firebase Auth`);
            } else {
                throw error;
            }
        }

        // 2. Supprimer les fichiers de Storage
        console.log('Suppression des fichiers de Storage...');
        await deleteStorageFolder(`avatars/${uid}`);
        await deleteStorageFolder(`covers/${uid}`);

        // 3. Supprimer le document utilisateur dans Firestore
        console.log('Suppression du document utilisateur dans Firestore...');
        try {
            await admin.firestore().doc(`users/${uid}`).delete();
            console.log('Document utilisateur supprimé de Firestore');
        } catch (error) {
            console.warn('Erreur lors de la suppression du document Firestore:', error.message);
        }

        // 4. Supprimer l'utilisateur de Firebase Auth
        try {
            await admin.auth().deleteUser(uid);
            console.log('Utilisateur supprimé de Firebase Auth');
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.warn(`Utilisateur ${uid} déjà supprimé de Firebase Auth`);
            } else {
                throw error;
            }
        }

        console.log(`Utilisateur ${uid} supprimé avec succès !`);
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
        process.exit(1);
    }
}

// Exécuter la suppression
deleteUserCompletely(userId)
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Erreur non gérée:', error);
        process.exit(1);
    });
