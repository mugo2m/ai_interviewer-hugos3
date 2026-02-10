// 🔍 CHECK session_memory COLLECTION WITH YOUR CONFIG
// Run with: node check_session_memory_updated.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// YOUR FIREBASE CONFIG FROM firebase/client.ts
// Replace these values with your actual config from the file above
const firebaseConfig = {
  // ⚠️ REPLACE THESE WITH YOUR ACTUAL VALUES ⚠️
  // Copy from firebase/client.ts lines 20-30
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_AUTH_DOMAIN_HERE",
  projectId: "YOUR_PROJECT_ID_HERE",
  storageBucket: "YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "YOUR_APP_ID_HERE"
};

async function checkSessionMemory() {
  try {
    console.log('🔍 Checking session_memory collection...\n');
    console.log('📊 Project ID:', firebaseConfig.projectId || 'Not set');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Check session_memory
    const sessionMemoryRef = collection(db, 'session_memory');
    const snapshot = await getDocs(sessionMemoryRef);
    
    console.log(`📊 session_memory collection: ${snapshot.size} document(s)\n`);
    
    if (snapshot.size > 0) {
      console.log('✅ ACTIVE: Contains data\n');
      
      // Show document details
      snapshot.docs.slice(0, 3).forEach((doc, index) => {
        console.log(`📄 Document ${index + 1}:`);
        console.log(`   ID: ${doc.id}`);
        const data = doc.data();
        
        // Show common fields
        const fields = [
          'userId', 'sessionId', 'createdAt', 'updatedAt', 
          'timestamp', 'status', 'type', 'sessionType'
        ];
        
        fields.forEach(field => {
          if (data[field]) {
            console.log(`   ${field}: ${data[field]}`);
          }
        });
        
        // Show data structure
        const keys = Object.keys(data);
        if (keys.length > 0) {
          console.log(`   Fields: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`);
        }
        
        console.log('   ---');
      });
      
      if (snapshot.size > 3) {
        console.log(`... and ${snapshot.size - 3} more documents`);
      }
    } else {
      console.log('❌ EMPTY: No documents found');
      console.log('\n💡 Possible reasons:');
      console.log('   1. No active interview sessions');
      console.log('   2. Sessions are cleaned up immediately');
      console.log('   3. Collection is not being used');
      console.log('   4. Wrong project/database');
    }
    
    // Check related collections
    console.log('\n🔍 Checking related collections:');
    
    const relatedCollections = [
      'interviews',
      'interview_cache', 
      'user_emotions',
      'user_performance',
      'user_preferences',
      'users'
    ];
    
    for (const collName of relatedCollections) {
      try {
        const collRef = collection(db, collName);
        const collSnapshot = await getDocs(collRef);
        console.log(`   ${collName.padEnd(20)}: ${collSnapshot.size.toString().padEnd(4)} documents`);
      } catch (err) {
        console.log(`   ${collName.padEnd(20)}: ERROR - ${err.message}`);
      }
    }
    
    console.log('\n🎯 VERDICT:');
    if (snapshot.size > 0) {
      console.log('✅ session_memory is ACTIVE and storing data');
      console.log('   It supports your interview memory systems');
    } else {
      console.log('⚠️  session_memory is EMPTY');
      console.log('   Check if interview sessions create data');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('\n💡 TROUBLESHOOTING:');
    console.log('1. Check firebaseConfig values are correct');
    console.log('2. Ensure Firebase project exists');
    console.log('3. Check Firestore database is enabled');
    console.log('4. Verify read permissions');
    console.log('5. Check internet connection');
    
    // Show config hints
    console.log('\n🔧 CONFIG HINTS:');
    console.log('   • apiKey should start with "AIza"');
    console.log('   • projectId is your Firebase project name');
    console.log('   • Check firebase/client.ts for actual values');
  }
}

// Run the check
checkSessionMemory();
