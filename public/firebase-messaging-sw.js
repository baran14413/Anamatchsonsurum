// Firebase SDK'larını içe aktar
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

// Firebase proje yapılandırmanız
const firebaseConfig = {
  apiKey: "AIzaSyBTYHLORHg_HuLzAg74XCanqLE82e92NJI",
  authDomain: "bematch-new.firebaseapp.com",
  projectId: "bematch-new",
  storageBucket: "bematch-new.appspot.com",
  messagingSenderId: "108504362423",
  appId: "1:108504362423:web:3781383a547a09590d8c32",
  measurementId: "G-P6LCQY34GB"
};

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Arka planda gelen mesajları işlemek için handler
onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Bildirimi özelleştir ve göster
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // Bildirimlerde gösterilecek ikon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
