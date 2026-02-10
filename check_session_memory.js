// 🔍 Check session_memory Firestore Collection
// Run with: node check_session_memory.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Your Firebase config - you'll need to add your actual config here
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

async function checkSessionMemory() {
  try {
    console.log('🔍 Checking session_memory collection...\n');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Reference to session_memory collection
    const sessionMemoryRef = collection(db, 'session_memory');
    const snapshot = await getDocs(sessionMemoryRef);
    
    console.log(`📊 session_memory has ${snapshot.size} document(s)\n`);
    
    if (snapshot.size > 0) {
      console.log('✅ ACTIVE: Contains data\n');
      
      // Show first 3 documents
      snapshot.docs.slice(0, 3).forEach((doc, index) => {
        console.log(`📄 Document ${index + 1}:`);
        console.log(`   ID: ${doc.id}`);
        const data = doc.data();
        console.log(`   Created: ${data.createdAt || data.timestamp || 'Unknown'}`);
        console.log(`   User: ${data.userId || 'Unknown'}`);
        console.log(`   Type: ${data.sessionType || data.type || 'Unknown'}`);
        console.log(`   Status: ${data.status || 'Unknown'}`);
        console.log('   ---');
      });
      
      if (snapshot.size > 3) {
        console.log(`... and ${snapshot.size - 3} more documents`);
      }
    } else {
      console.log('❌ EMPTY: No documents found');
      console.log('This could mean:');
      console.log('   1. Collection exists but no active sessions');
      console.log('   2. Collection is legacy/unused');
      console.log('   3. Data is cleaned up automatically');
    }
    
    // Check other related collections
    console.log('\n🔍 Checking related collections...');
    
    const collectionsToCheck = ['interviews', 'interview_cache', 'user_emotions'];
    for (const collName of collectionsToCheck) {
      try {
        const collRef = collection(db, collName);
        const collSnapshot = await getDocs(collRef);
        console.log(`   ${collName}: ${collSnapshot.size} documents`);
      } catch (err) {
        console.log(`   ${collName}: ERROR - ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking session_memory:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Firebase is properly configured');
    console.log('   2. You have the correct project ID');
    console.log('   3. You have read permissions for Firestore');
  }
}

// Run the check
checkSessionMemory();
