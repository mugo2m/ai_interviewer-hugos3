// 🔍 CHECK user_preferences LEGACY COLLECTION
// WITH YOUR FIREBASE CONFIG PRE-INSERTED

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// YOUR FIREBASE CONFIG FROM firebase/client.ts
const firebaseConfig = {
 // apiKey: "AIzaSyCvmPHp2kHbLQbSqW73TxS9NmSCARDqhfM",
  //authDomain: "mugoai-3c70b.firebaseapp.com",
  //projectId: "mugoai-3c70b",
 // storageBucket: "mugoai-3c70b.firebasestorage.app",
 // messagingSenderId: "1044600296070",
 // appId: "1:1044600296070:web:558fde4ad9da314f2d3707",
  //measurementId: "G-PTTHK4M8KR"
//};

async function checkLegacyUserPreferences() {
  try {
    console.log('🔍 Checking legacy user_preferences collection...\n');
    console.log('📊 Project:', firebaseConfig.projectId || 'Unknown');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Check legacy user_preferences collection
    const legacyPrefsRef = collection(db, 'user_preferences');
    const snapshot = await getDocs(legacyPrefsRef);
    
    console.log(\📊 user_preferences collection: \ document(s)\n\);
    
    if (snapshot.size > 0) {
      console.log('⚠️  WARNING: user_preferences HAS DATA!');
      console.log('   This legacy collection has documents that might need migration.\n');
      
      // Analyze the documents
      console.log('📋 DOCUMENT ANALYSIS:');
      snapshot.docs.slice(0, 5).forEach((doc, index) => {
        console.log(\\n📄 Document \:\);
        console.log(\   ID: \\);
        
        const data = doc.data();
        const keys = Object.keys(data);
        console.log(\   Fields: \\\);
        
        // Check for userId field
        if (data.userId) {
          console.log(\   ✅ Has userId: \\);
        } else {
          console.log(\   ⚠️  No userId field (doc.id might be userId: \)\);
        }
        
        // Show sample data
        if (keys.length > 0) {
          const sampleKey = keys[0];
          console.log(\   Sample: \: \\);
        }
      });
      
      if (snapshot.size > 5) {
        console.log(\\n... and \ more documents\);
      }
      
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
    
    // Quick check for users collection
    console.log('\n🔍 QUICK CHECK: Users collection (for comparison)');
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      console.log(\   Found \ user(s) in users collection\);
      
      if (usersSnapshot.size > 0) {
        console.log('   Check Firebase Console for preferences subcollections');
      }
    } catch (err) {
      console.log(\   Could not check users: \\);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check if Firebase project exists');
    console.log('   2. Verify Firestore is enabled');
    console.log('   3. Check internet connection');
    console.log('   4. Verify API key permissions');
  }
}

// Run the check
checkLegacyUserPreferences();
