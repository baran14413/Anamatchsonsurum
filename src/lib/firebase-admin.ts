
import admin from 'firebase-admin';

// Bu dosya, sunucu tarafında çalışan ve yönetici yetkileriyle Firebase'e erişen
// kodlar için merkezi bir Firebase Admin SDK kurulumu sağlar.

// Ortam değişkenlerinden Firebase servis hesabı bilgilerini al.
// Bu bilgiler genellikle Vercel, Google Cloud Run gibi hosting platformlarında güvenli bir şekilde saklanır.
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Satır sonu karakterlerini düzelt
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// Eğer daha önce bir Firebase uygulaması başlatılmamışsa, yeni bir tane başlat.
// Bu, kodun birden çok kez çalıştırıldığı (hot-reload gibi) durumlarda hata almayı önler.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Firestore veritabanı örneğini dışa aktar.
// Diğer sunucu tarafı dosyalar (API rotaları, webhook'lar vb.) bu örneği kullanarak
// veritabanı işlemleri yapabilir.
const db = admin.firestore();
const auth = admin.auth();

export { db, auth, admin };
