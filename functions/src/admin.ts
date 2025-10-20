import * as admin from 'firebase-admin';

// Proje daha önce başlatılmamışsa başlat
if (!admin.apps.length) {
    // Önemli: process.env, Firebase Functions ortamında otomatik olarak ayarlanır.
    // Proje ayarlarınızdan servis hesabı anahtarınızı manuel olarak eklemenize gerek yoktur.
    admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();
