import admin from 'firebase-admin';

// Bu dosya, sunucu tarafında çalışan ve yönetici yetkileriyle Firebase'e erişen
// kodlar için merkezi bir Firebase Admin SDK kurulumu sağlar.

// Ortam değişkenlerinden Firebase servis hesabı bilgilerini al.
const projectId = process.env.FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

// Sadece tüm bilgiler mevcutsa SDK'yı başlat.
if (projectId && privateKey && clientEmail && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail,
      }),
    });
  } catch (error) {
    console.error("Firebase Admin SDK başlatılamadı:", error);
  }
}

// Başlatılmış bir uygulama varsa db ve auth'ı dışa aktar.
// Aksi takdirde, null veya undefined olabilecek boş nesneleri dışa aktar.
const db = admin.apps.length ? admin.firestore() : undefined;
const auth = admin.apps.length ? admin.auth() : undefined;

export { db, auth, admin };
