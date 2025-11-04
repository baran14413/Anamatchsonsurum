
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Ensure app is initialized. This is idempotent.
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

// Generic function to send a data-only notification
const sendDataNotification = async (
  tokens: string[],
  data: { [key: string]: string }
) => {
  if (tokens.length === 0) {
    console.log("No tokens to send notification to.");
    return;
  }

  // Construct a data-only message
  const payload: admin.messaging.MulticastMessage = {
    tokens,
    data,
    apns: {
      payload: {
        aps: {
          "content-available": 1,
        },
      },
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(payload);
    console.log("Data messages sent successfully:", response.successCount);

    // Clean up invalid tokens
    if (response.failureCount > 0) {
        const tokensToRemove: string[] = [];
        response.responses.forEach((result, index) => {
            if (!result.success) {
                const error = result.error;
                console.error(
                    "Failure sending notification to",
                    tokens[index],
                    error
                );
                if (
                    error.code === "messaging/invalid-registration-token" ||
                    error.code === "messaging/registration-token-not-registered"
                ) {
                    tokensToRemove.push(tokens[index]);
                }
            }
        });
        
        // This is a simplified cleanup. A real app might need a more robust
        // way to find the user document based on the token to remove it.
        console.log("Need to remove invalid tokens:", tokensToRemove);
    }

  } catch (error) {
    console.error("Error sending data messages:", error);
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

    const { matchId } = context.params;
    const { senderId } = message;

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

    // Send the data notification
    await sendDataNotification(
      fcmTokens,
      {
        title: `${sender?.fullName}`,
        body: notificationBody,
        link: `/eslesmeler/${matchId}`
      }
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
      const { user1Id, user2Id } = after;
      const { matchId } = context.params;

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
        await sendDataNotification(
          user1.fcmTokens,
          {
            title: "Yeni bir eşleşmen var! 🎉",
            body: `${user2?.fullName} ile eşleştin.`,
            link: `/eslesmeler/${matchId}`
          }
        );
      }

      // Send notification to User 2
      if (user2 && user2.fcmTokens && user2.fcmTokens.length > 0) {
        await sendDataNotification(
          user2.fcmTokens,
          {
             title: "Yeni bir eşleşmen var! 🎉",
             body: `${user1?.fullName} ile eşleştin.`,
             link: `/eslesmeler/${matchId}`
          }
        );
      }
    }
    return null;
  });
