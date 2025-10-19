
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

// Bildirim gönderme fonksiyonu
const sendNotification = async (
  tokens: string[],
  title: string,
  body: string,
  link: string,
) => {
  if (tokens.length === 0) {
    console.log("No tokens to send notification to.");
    return;
  }

  const payload: admin.messaging.MulticastMessage = {
    tokens,
    notification: {
      title,
      body,
    },
    webpush: {
      fcmOptions: {
        link,
      },
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(payload);
    console.log("Notifications sent successfully:", response);

    // Başarısız olan token'ları temizle
    const tokensToRemove: Promise<any>[] = [];
    response.responses.forEach((result, index) => {
      if (!result.success) {
        const error = result.error;
        console.error(
          "Failed to send notification to",
          tokens[index],
          error,
        );
        if (
          error.code === "messaging/invalid-registration-token" ||
          error.code === "messaging/registration-token-not-registered"
        ) {
          // Bu token'ı kullanıcının profilinden sil
          // (Bu kısım için kullanıcı ID'sini bilmek gerekir,
          // bu yüzden genellikle token yönetimi daha karmaşıktır)
        }
      }
    });
    await Promise.all(tokensToRemove);
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
};


// Yeni bir mesaj gönderildiğinde tetiklenir
export const onNewMessage = functions
  .region("europe-west1")
  .firestore.document("/matches/{matchId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const matchId = context.params.matchId;
    const senderId = message.senderId;

    if (!message || !senderId) {
      console.log("Eksik mesaj verisi.");
      return null;
    }

    // Gönderen ve alan kişilerin ID'lerini bul
    const [user1Id, user2Id] = matchId.split("_");
    const recipientId = senderId === user1Id ? user2Id : user1Id;

    // Alan kullanıcının ve gönderen kullanıcının profilini al
    const recipientDoc = await db.collection("users").doc(recipientId).get();
    const senderDoc = await db.collection("users").doc(senderId).get();

    if (!recipientDoc.exists || !senderDoc.exists) {
      console.log("Kullanıcı bulunamadı.");
      return null;
    }

    const recipient = recipientDoc.data();
    const sender = senderDoc.data();
    const fcmTokens = recipient?.fcmTokens;

    if (!fcmTokens || fcmTokens.length === 0) {
      console.log("Alıcının bildirim token'ı yok.");
      return null;
    }

    let notificationBody = "";
    if (message.text) {
      notificationBody = message.text;
    } else if (message.imageUrl) {
      notificationBody = "📷 Bir fotoğraf gönderdi.";
    } else if (message.audioUrl) {
      notificationBody = "▶️ Bir sesli mesaj gönderdi.";
    } else {
      notificationBody = "Yeni bir mesajın var.";
    }

    // Bildirimi gönder
    await sendNotification(
      fcmTokens,
      `${sender?.fullName}`, // Bildirim başlığı
      notificationBody,
      `/eslesmeler/${matchId}`, // Tıklanınca açılacak link
    );

    return null;
  });


// Yeni bir eşleşme olduğunda tetiklenir
export const onNewMatch = functions
  .region("europe-west1")
  .firestore.document("/matches/{matchId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Sadece status 'pending' veya 'superlike_pending' den 'matched'e değiştiğinde çalışır
    if (
      (before.status === "pending" || before.status === "superlike_pending") &&
       after.status === "matched"
    ) {
      const user1Id = after.user1Id;
      const user2Id = after.user2Id;
      const matchId = context.params.matchId;

      // Her iki kullanıcının da profilini al
      const user1Doc = await db.collection("users").doc(user1Id).get();
      const user2Doc = await db.collection("users").doc(user2Id).get();

      if (!user1Doc.exists || !user2Doc.exists) {
        console.log("Eşleşen kullanıcılardan biri bulunamadı.");
        return null;
      }

      const user1 = user1Doc.data();
      const user2 = user2Doc.data();

      // Kullanıcı 1'e bildirim gönder
      if (user1 && user1.fcmTokens && user1.fcmTokens.length > 0) {
        await sendNotification(
          user1.fcmTokens,
          "Yeni bir eşleşmen var! 🎉",
          `${user2?.fullName} ile eşleştin.`,
          `/eslesmeler/${matchId}`,
        );
      }

      // Kullanıcı 2'ye bildirim gönder
      if (user2 && user2.fcmTokens && user2.fcmTokens.length > 0) {
        await sendNotification(
          user2.fcmTokens,
          "Yeni bir eşleşmen var! 🎉",
          `${user1?.fullName} ile eşleştin.`,
          `/eslesmeler/${matchId}`,
        );
      }
    }
    return null;
  });
