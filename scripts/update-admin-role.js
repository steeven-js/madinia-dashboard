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

const USER_UID = 'sONcdNjvlOgyMdJ8LyRJCFgCt4e2';

async function updateAdminRole() {
  try {
    // Mise à jour dans Firestore
    await db.collection('users').doc(USER_UID).update({
      role: 'super_admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Mise à jour des custom claims dans Auth
    await auth.setCustomUserClaims(USER_UID, {
      role: 'super_admin'
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
