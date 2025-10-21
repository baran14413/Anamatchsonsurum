
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

// Generic function to send a notification
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
    console.log("Notifications sent successfully:", response.successCount);

    // Clean up invalid tokens
    const tokensToRemove: string[] = [];
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
          tokensToRemove.push(tokens[index]);
        }
      }
    });

    if (tokensToRemove.length > 0) {
      // Here you would typically find the user associated with these tokens
      // and remove the tokens from their profile. This requires a more complex
      // lookup (e.g., querying users collection for fcmTokens array containing the token).
      // For simplicity, we are just logging it here.
      console.log("Need to remove invalid tokens:", tokensToRemove);
    }
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
};


// Triggered when a new message is created in any chat
export const onNewMessage = functions.region("europe-west1").firestore
  .document("/matches/{matchId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    if (!message) {
      console.log("No message data found.");
      return null;
    }

    const {matchId} = context.params;
    const {senderId} = message;

    // Get the two user IDs from the matchId
    const [user1Id, user2Id] = matchId.split("_");
    const recipientId = senderId === user1Id ? user2Id : user1Id;

    // Get recipient and sender profiles
    const recipientDoc = await db.collection("users").doc(recipientId).get();
    const senderDoc = await db.collection("users").doc(senderId).get();

    if (!recipientDoc.exists || !senderDoc.exists) {
      console.log("Sender or recipient not found.");
      return null;
    }

    const recipient = recipientDoc.data();
    const sender = senderDoc.data();

    // Check if the recipient has any FCM tokens
    const fcmTokens = recipient?.fcmTokens;
    if (!fcmTokens || !Array.isArray(fcmTokens) || fcmTokens.length === 0) {
      console.log("Recipient has no FCM tokens.");
      return null;
    }

    let notificationBody = "Yeni bir mesajın var.";
    if (message.text) {
      notificationBody = message.text;
    } else if (message.imageUrl) {
      notificationBody = "📷 Bir fotoğraf gönderdi.";
    } else if (message.audioUrl) {
      notificationBody = "▶️ Bir sesli mesaj gönderdi.";
    }

    // Send the notification
    await sendNotification(
      fcmTokens,
      `${sender?.fullName}`, // Notification title
      notificationBody, // Notification body
      `/eslesmeler/${matchId}`  // Link to open on click
    );

    return null;
  });


// Triggered when a match status changes
export const onNewMatch = functions.region("europe-west1").firestore
  .document("/matches/{matchId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if the status has just changed to 'matched'
    if (before.status !== "matched" && after.status === "matched") {
      const {user1Id, user2Id} = after;
      const {matchId} = context.params;

      // Get both user profiles
      const user1Doc = await db.collection("users").doc(user1Id).get();
      const user2Doc = await db.collection("users").doc(user2Id).get();

      if (!user1Doc.exists || !user2Doc.exists) {
        console.log("One or both users in the match not found.");
        return null;
      }

      const user1 = user1Doc.data();
      const user2 = user2Doc.data();

      // Send notification to User 1
      if (user1 && user1.fcmTokens && user1.fcmTokens.length > 0) {
        await sendNotification(
          user1.fcmTokens,
          "Yeni bir eşleşmen var! 🎉",
          `${user2?.fullName} ile eşleştin.`,
          `/eslesmeler/${matchId}`
        );
      }

      // Send notification to User 2
      if (user2 && user2.fcmTokens && user2.fcmTokens.length > 0) {
        await sendNotification(
          user2.fcmTokens,
          "Yeni bir eşleşmen var! 🎉",
          `${user1?.fullName} ile eşleştin.`,
          `/eslesmeler/${matchId}`
        );
      }
    }
    return null;
  });
