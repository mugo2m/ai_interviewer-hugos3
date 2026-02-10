const admin = require('firebase-admin');

async function scanCollections() {
  console.log('🔍 Scanning Firestore via Admin SDK...\n');
  
  try {
    // Try to initialize with environment variables (from your logs)
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: 'https://hugos-aeebf.firebaseio.com'
    });
    
    const db = admin.firestore();
    
    console.log('✅ Firebase initialized successfully\n');
    
    // List all collections
    const collections = await db.listCollections();
    console.log(`📊 Found ${collections.length} total collections:\n`);
    
    // Categorize them
    const memoryCollections = [];
    const otherCollections = [];
    
    for (const col of collections) {
      const colName = col.id;
      const snapshot = await col.count().get();
      const count = snapshot.data().count;
      
      const collectionInfo = {
        name: colName,
        count: count,
        lastUpdated: await getLastUpdate(col)
      };
      
      // Check if it's a memory collection
      if (colName.includes('memory') || 
          colName.includes('buffer') || 
          colName.includes('conversation') ||
          colName.includes('emotion') ||
          colName.includes('performance') ||
          colName.includes('progress') ||
          colName.includes('cache')) {
        memoryCollections.push(collectionInfo);
      } else {
        otherCollections.push(collectionInfo);
      }
    }
    
    // Display memory collections
    console.log('🧠 MEMORY COLLECTIONS:');
    console.log('=' .repeat(50));
    memoryCollections.forEach((col, index) => {
      console.log(`${index + 1}. ${col.name}`);
      console.log(`   📄 Documents: ${col.count}`);
      console.log(`   ⏰ Last activity: ${col.lastUpdated}`);
      console.log('');
    });
    
    console.log(`\n🎯 Total memory collections: ${memoryCollections.length}`);
    console.log(`📈 Total memory documents: ${memoryCollections.reduce((sum, col) => sum + col.count, 0)}`);
    
    // Check for buffer/conversation specifically
    console.log('\n🔎 Looking for buffer/conversation collections:');
    const bufferCollections = collections.filter(c => 
      c.id.toLowerCase().includes('buffer') || 
      c.id.toLowerCase().includes('conversation')
    );
    
    if (bufferCollections.length > 0) {
      console.log('✅ Found buffer/conversation collections:');
      bufferCollections.forEach(col => {
        console.log(`   - ${col.id}`);
      });
    } else {
      console.log('❌ No buffer/conversation collections found in Firestore');
      console.log('   They might be implemented differently (in-memory, localStorage, etc.)');
    }
    
    admin.app().delete();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Try initializing with environment variables instead:');
    console.log('   Make sure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY are set');
  }
}

async function getLastUpdate(collectionRef) {
  try {
    const latest = await collectionRef.orderBy('createdAt', 'desc').limit(1).get();
    if (!latest.empty) {
      const data = latest.docs[0].data();
      return data.createdAt || data.updatedAt || data.timestamp || 'Unknown';
    }
    return 'No documents';
  } catch {
    return 'Unknown';
  }
}

scanCollections();
