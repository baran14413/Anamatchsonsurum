
importScripts("https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyBTYHLORHg_HuLzAg74XCanqLE82e92NJI",
  authDomain: "bematch-new.firebaseapp.com",
  projectId: "bematch-new",
  storageBucket: "bematch-new.appspot.com",
  messagingSenderId: "108504362423",
  appId: "1:108504362423:web:3781383a547a09590d8c32",
  measurementId: "G-P6LCQY34GB"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/logo.png' 
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
