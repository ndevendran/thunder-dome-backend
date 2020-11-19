const test = require('firebase-functions-test')({
  projectId: process.env.GCLOUD_PROJECT,
});
const admin = require('firebase-admin');
const { assert } = require('chai');

const myFunctions = require('../index.js');
let parentId = null;

// before(async () => {
//   const req = {
//     body: {
//       text: "This is a test message",
//       userId: 'lilniro_userid',
//       username: 'lilniro',
//       profile_picture: 'message.profile_picture',
//       createdAt: "",
//     }
//   };
//
//   parentId = await firebase.firestore().collection('messages').add({
//     req.body,
//   });
// });

describe('Unit tests', function() {
  before(function() {
    admin.firestore().collection('messages').add({
      text: "This is a test message",
      userId: 'lilniro_userid',
      username: 'lilniro',
      profile_picture: 'message.profile_picture',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }).then(function(docRef) {
      if(docRef) {
        parentId = docRef.id;
      } else {
        console.log('Message setup failed!');
      }
    });
  });

  after(() => {
    test.cleanup();
  });

  it("tests addMessage", function(done) {
    const req = { body: {
      text: "This is a test comment",
      userId: 'lilniro_userid',
      username: 'lilniro',
      profile_picture: 'message.profile_picture',
    }};

    const res = {
      json: (response) => {
        assert.exists(response.messageId);
        done();
      }
    };

    myFunctions.addMessage(req, res);

  });

  it("tests addComment", function(done) {
    const req = { body: {
      text: "This is a test comment",
      userId: "lilniro_userid",
      username: "lilniro",
      parentId: parentId,
      profile_picture: "profile_picture",
    }};

    const res = {
      json: (response) => {
        assert.exists(response.commentId);
        done();
      }
    };

    myFunctions.addComment(req, res);

  });

  it("tests makeNotification", function(done) {
    const snap = {
      data: () => ({
        text: "This is a test comment",
        userId: 'lilniro_userid',
        username: 'lilniro',
        profile_picture: 'message.profile_picture',
        parentId: parentId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
      key: '11111'
    };

    const wrapped = test.wrap(myFunctions.makeNotification);
    const notificationPromise = wrapped(snap, { params: { documentId: '11111' }});
    notificationPromise.then(function(data) {
      admin.firestore().collection('notifications').doc(snap.data().username).get()
        .then(function(doc) {
          if(doc.exists) {
            data = doc.data();
            if(data) {
              assert.exists(data.messageLink);
              assert.exists(data.commentLink);
              assert.exists(title);
              done();
            }
          }
        });
    })
    .catch(function(error){
      console.log('There was an error: ', error);
      assert.isTrue(false);
      done();
    });
  });
});
