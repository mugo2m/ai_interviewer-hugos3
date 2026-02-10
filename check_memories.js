const admin = require('firebase-admin');

async function scanCollections() {
  console.log('🔍 Scanning ALL Firestore collections...\n');
  
  try {
    // Initialize Firebase
    const serviceAccount = require('./serviceAccountKey.json');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://hugos-aeebf.firebaseio.com'
    });
    
    const db = admin.firestore();
    const collections = await db.listCollections();
    
    console.log(`✅ Found ${collections.length} active collections:\n`);
    
    // Count documents in each
    for (const collectionRef of collections) {
      try {
        const snapshot = await collectionRef.count().get();
        const count = snapshot.data().count;
        
        console.log(`📁 ${collectionRef.id}:`);
        console.log(`   📄 Documents: ${count}`);
        
        // Check for buffer/conversational memory patterns
        if (collectionRef.id.toLowerCase().includes('buffer') || 
            collectionRef.id.toLowerCase().includes('conversation')) {
          console.log(`   🎯 MATCHES OLD MEMORY TYPE!`);
        }
        
        // Show sample document
        if (count > 0) {
          const sampleDoc = await collectionRef.limit(1).get();
          if (!sampleDoc.empty) {
            const docData = sampleDoc.docs[0].data();
            const keys = Object.keys(docData);
            console.log(`   📝 Sample fields: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`);
          }
        }
        console.log('');
        
      } catch (err) {
        console.log(`📁 ${collectionRef.id}: Error reading - ${err.message}`);
      }
    }
    
    console.log('\n🔎 Checking for specific memory collections:');
    const foundCollections = collections.map(c => c.id);
    
    const memoryTypes = {
      'buffer_memory': 'Buffer Memory (old)',
      'conversational_memory': 'Conversational Memory (old)', 
      'session_memory': 'Session Memory',
      'user_emotions': 'Emotion Memory',
      'user_performance': 'Performance Memory',
      'user_progress': 'Progress Memory',
      'user_preferences': 'Preference Memory',
      'cache_stats': 'Cache Memory',
      'interviews': 'Interview Memory'
    };
    
    for (const [collection, description] of Object.entries(memoryTypes)) {
      if (foundCollections.includes(collection)) {
        console.log(`✅ ${description}: FOUND (${collection})`);
      } else {
        console.log(`❌ ${description}: NOT FOUND`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (admin.apps.length > 0) {
      admin.app().delete();
    }
  }
}

scanCollections();
