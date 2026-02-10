const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-admin-key.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function auditUserPreferences() {
  console.log('🔍 AUDITING USER_PREFERENCES COLLECTION\n');
  console.log('='.repeat(60));
  
  try {
    // Get the user_preferences collection
    const preferencesRef = db.collection('user_preferences');
    const snapshot = await preferencesRef.limit(10).get();
    
    console.log(`📊 Collection: user_preferences`);
    console.log(`📈 Document count (sampled): ${snapshot.size}`);
    
    if (snapshot.empty) {
      console.log('📭 Collection is EMPTY - no user preferences stored yet');
      console.log('💡 This could mean:');
      console.log('   1. Preferences are stored in a different collection');
      console.log('   2. No users have set preferences yet');
      console.log('   3. Preferences are stored locally (cookies/localStorage)');
      return;
    }
    
    console.log('\n📋 Sample Documents:');
    console.log('-'.repeat(40));
    
    let userCount = 0;
    let totalFields = 0;
    const fieldTypes = {};
    
    snapshot.forEach(doc => {
      userCount++;
      const data = doc.data();
      const fields = Object.keys(data);
      
      console.log(`\n👤 User: ${doc.id}`);
      console.log(`   Fields (${fields.length}): ${fields.join(', ')}`);
      
      // Analyze field types
      fields.forEach(field => {
        totalFields++;
        const type = typeof data[field];
        if (!fieldTypes[type]) fieldTypes[type] = 0;
        fieldTypes[type]++;
        
        // Show sample values for key fields
        if (field.includes('theme') || field.includes('language') || field.includes('notification')) {
          console.log(`   ${field}: ${JSON.stringify(data[field])} (${type})`);
        }
      });
    });
    
    console.log('\n📊 STATISTICS:');
    console.log('-'.repeat(40));
    console.log(`Total users with preferences: ${userCount}`);
    console.log(`Average fields per user: ${(totalFields / userCount).toFixed(1)}`);
    console.log(`Field types: ${Object.keys(fieldTypes).join(', ')}`);
    
    // Check for common preference patterns
    const allDocs = await preferencesRef.get();
    const preferenceTypes = {
      theme: 0,
      language: 0,
      notification: 0,
      difficulty: 0,
      layout: 0,
      other: 0
    };
    
    allDocs.forEach(doc => {
      const data = doc.data();
      Object.keys(data).forEach(field => {
        if (field.includes('theme')) preferenceTypes.theme++;
        else if (field.includes('language')) preferenceTypes.language++;
        else if (field.includes('notification')) preferenceTypes.notification++;
        else if (field.includes('difficulty')) preferenceTypes.difficulty++;
        else if (field.includes('layout')) preferenceTypes.layout++;
        else preferenceTypes.other++;
      });
    });
    
    console.log('\n🎯 PREFERENCE CATEGORIES:');
    Object.entries(preferenceTypes).forEach(([category, count]) => {
      if (count > 0) {
        console.log(`   ${category}: ${count} fields`);
      }
    });
    
    // Check if there's a structure/schema
    console.log('\n🔍 STRUCTURE ANALYSIS:');
    const firstDoc = snapshot.docs[0];
    if (firstDoc) {
      console.log('Sample structure:');
      console.log(JSON.stringify(firstDoc.data(), null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error auditing user_preferences:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 RECOMMENDATIONS:');
  console.log('1. Check personalizationMemory.ts for data structure');
  console.log('2. Verify user preferences are being saved correctly');
  console.log('3. Ensure preferences are loaded on user login');
  console.log('4. Consider adding default preferences for new users');
}

auditUserPreferences();
