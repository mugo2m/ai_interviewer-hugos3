// 🔍 CHECK user_preferences LEGACY COLLECTION
// Run with: node check_legacy_user_preferences.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Your Firebase config - copy from firebase/client.ts
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

async function checkLegacyUserPreferences() {
  try {
    console.log('🔍 Checking legacy user_preferences collection...\n');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Check legacy user_preferences collection
    const legacyPrefsRef = collection(db, 'user_preferences');
    const snapshot = await getDocs(legacyPrefsRef);
    
    console.log(`📊 user_preferences collection: ${snapshot.size} document(s)\n`);
    
    if (snapshot.size > 0) {
      console.log('⚠️  WARNING: user_preferences HAS DATA!');
      console.log('   This legacy collection has documents that might need migration.\n');
      
      // Analyze the documents
      console.log('📋 DOCUMENT ANALYSIS:');
      snapshot.docs.forEach((doc, index) => {
        console.log(`\n📄 Document ${index + 1}:`);
        console.log(`   ID: ${doc.id}`);
        
        const data = doc.data();
        const keys = Object.keys(data);
        console.log(`   Fields: ${keys.join(', ')}`);
        
        // Check for userId field (important for migration)
        if (data.userId) {
          console.log(`   ✅ Has userId: ${data.userId}`);
        } else {
          console.log(`   ⚠️  No userId field (might use doc.id as userId)`);
        }
        
        // Show sample data
        console.log(`   Sample data:`);
        keys.slice(0, 3).forEach(key => {
          console.log(`     ${key}: ${JSON.stringify(data[key])}`);
        });
        if (keys.length > 3) {
          console.log(`     ... and ${keys.length - 3} more fields`);
        }
      });
      
      console.log('\n🔍 MIGRATION ANALYSIS:');
      console.log('Current structure (ACTIVE): users/[userId]/preferences/current');
      console.log('Legacy structure: user_preferences/[documentId]');
      console.log('\n🎯 MIGRATION NEEDED: YES');
      console.log('   You have data in the legacy collection that should be moved.');
      
    } else {
      console.log('✅ GOOD: user_preferences is EMPTY');
      console.log('   No migration needed - collection can be safely deleted.');
      console.log('   Your active data is in: users/[userId]/preferences/current');
    }
    
    // Also check the active structure for comparison
    console.log('\n🔍 CHECKING ACTIVE STRUCTURE (for comparison):');
    
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      let usersWithPreferences = 0;
      const users = [];
      
      // Check each user for preferences subcollection
      for (const userDoc of usersSnapshot.docs.slice(0, 5)) { // Check first 5 users
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        // Note: We can't directly check subcollections without reading them
        // But we can check if user document exists
        console.log(`   User: ${userId} (exists)`);
        users.push(userId);
      }
      
      console.log(`\n📊 Found ${usersSnapshot.size} user(s) in users collection`);
      console.log(`   Check Firebase Console manually to see preferences subcollections`);
      
    } catch (err) {
      console.log(`   Could not check users collection: ${err.message}`);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Firebase config is correct');
    console.log('   2. You have read permissions');
    console.log('   3. Firestore is enabled');
  }
}

// Run the check
checkLegacyUserPreferences();
