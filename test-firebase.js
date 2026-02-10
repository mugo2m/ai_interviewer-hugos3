const admin = require('firebase-admin');

// Initialize Firebase
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testFirebase() {
  try {
    console.log('Testing Firebase connection...');
    
    // Test getting a document
    const doc = await db.collection('feedback').doc('test').get();
    console.log('Firebase connection successful!');
    
    // List collections
    const collections = await db.listCollections();
    console.log('Collections:', collections.map(c => c.id));
    
  } catch (error) {
    console.error('Firebase error:', error.message);
  }
}

testFirebase();
