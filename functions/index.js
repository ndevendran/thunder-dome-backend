const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp();


exports.addMessage = functions.https.onRequest((req, res) => {
  const message = req.body;
  admin.firestore().collection('messages').add({
    text: message.text,
    userId: message.userId,
    username: message.username,
    profile_picture: message.profile_picture,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }).then(function(writeResult) {
    res.json({
      result: `Message with ID: ${writeResult.id} added. `,
      messageId: writeResult.id,
    });
  });
});

exports.addComment = functions.https.onRequest((req, res) => {
  const comment = req.body;
  admin.firestore().collection('comments').add({
    text: comment.text,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    userId: comment.userId,
    username: comment.username,
    parentId: comment.parentId,
    profile_picture: comment.profile_picture,
  }).then(function(writeResult) {
    res.json({
      result: `Comment with ID: ${writeResult.id} added.`,
      commentId: writeResult.id,
    });
  });
});

exports.makeNotification = functions.firestore.document('/comments/{documentId}')
  .onCreate(async (snap, context) => {
    const comment = snap.data();
    const messageId = comment.parentId;
    const commentId = snap.key;

    functions.logger.log('This is our messageId: ', messageId);

    const messageExists = await admin.firestore().collection('messages').doc(messageId).get();
    let message = null;

    if(messageExists) {
      message = messageExists.data();
    } else {
      const commentExists = await admin.firestore().collection('comments').doc(messageId).get();
      if(commentExists) {
        message = commentExists.data();
      }
    }

    if(message) {
      functions.logger.log(`Creating notification for ${message.username}`, context.params.documentId);
      return await admin.firestore().collection(`notifications`).doc(message.username).set({
        title: `${comment.username} commented on your message`,
        messageLink: `messages/${comment.parentId}`,
        commentLink: `comments/${commentId}`,
      }, { merge: true });
    } else {
      functions.logger.log('Cant make notification for message or comment with id: ', messageId);
      functions.logger.log('Message or comment does not exist');
    }

    return null;
});
