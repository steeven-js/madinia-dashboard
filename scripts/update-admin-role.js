import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Chargement du fichier de configuration
const serviceAccount = require(join(__dirname, '../madinia-dashboard-firebase-adminsdk-fbsvc-0bbf6e78a4.json'));

// Initialisation de Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

const USER_UID = '8bPWrBnQ6MMLP5e7Yw1y8F1EiwJ3';
const USER_ROLE = 'admin';
const USER_DISPLAY_NAME = 'Admin Test';
const USER_PHOTO_URL = 'https://assets.minimals.cc/public/assets/images/mock/avatar/avatar-25.webp';

async function updateAdminRole() {
  try {
    // Mise à jour dans Firestore
    await db.collection('users').doc(USER_UID).update({
      role: USER_ROLE,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Mise à jour des custom claims dans Auth
    await auth.setCustomUserClaims(USER_UID, {
      role: USER_ROLE,
      displayName: USER_DISPLAY_NAME,
    });

    // Mettre à jour photoURL dans FirebaseAuth
    await auth.updateUser(USER_UID, {
      displayName: USER_DISPLAY_NAME,
      photoURL: USER_PHOTO_URL,
    });

    // Récupération et affichage des informations
    const userAuth = await auth.getUser(USER_UID);
    const userDoc = await db.collection('users').doc(USER_UID).get();

    console.log('=== Auth User Info ===');
    console.log(userAuth);

    console.log('\n=== Firestore User Info ===');
    console.log(userDoc.data());

    console.log('\nMise à jour effectuée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    process.exit(1);
  }
}

updateAdminRole();
