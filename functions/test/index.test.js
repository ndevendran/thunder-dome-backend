const test = require('firebase-functions-test')({
  projectId: process.env.GCLOUD_PROJECT,
});
const admin = require('firebase-admin');
const { assert } = require('chai');

const myFunctions = require('../index.js');
let parentId = null;
let commentId = null;

describe('Unit tests', function() {
  before(function(done) {
    admin.firestore().collection('messages').add({
      text: "This is a test message",
      userId: 'lilniro_userid',
      username: 'lilniro',
      profile_picture: 'message.profile_picture',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }).then(function(docRef) {
      if(docRef) {
        parentId = docRef.id;
        console.log("THIS IS THE PARENT ID ", parentId);
        admin.firestore().collection('comments').add({
          text: "This is a test comment",
          userId: 'lilniro_userid',
          username: 'lilniro',
          profile_picture: 'message.profile_picture',
          parentId: parentId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }).then(function(docRef) {
          if(docRef) {
            commentId = docRef.id;
            console.log("THIS IS THE COMMENT ID ", commentId);
          } else {
            console.log('Comment setup failed!');
          }
          done();
        });
      } else {
        console.log('Message setup failed!');
        done();
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

  it("tests makeNotification when user comments on a message", function(done) {
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
              assert.exists(data.title);
              done();
            }
          }
        })
        .catch(function(error) {
          console.log('There was an error: ', error);
          assert.isTrue(false);
          done();
        });
    })
    .catch(function(error){
      console.log('There was an error: ', error);
      assert.isTrue(false);
      done();
    });
  });

  it('tests makeNotification for when user comments on a comment', function(done) {
    const snap = {
      data: () => ({
        text: "This is a test comment",
        userId: 'lilniro_userid',
        username: 'lilniro',
        profile_picture: 'message.profile_picture',
        parentId: commentId,
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
              assert.exists(data.title);
              done();
            }
          }
        })
        .catch(function(error) {
          console.log('There was an error: ', error);
          assert.isTrue(false);
          done();
        });
    })
    .catch(function(error){
      console.log('There was an error: ', error);
      assert.isTrue(false);
      done();
    });
  });
});
