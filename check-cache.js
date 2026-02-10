const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkCache() {
  console.log("🔍 Checking interview_cache collection...");
  const snapshot = await db.collection("interview_cache").get();
  
  console.log(`📊 Found ${snapshot.size} cached items:`);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log("Key:", doc.id);
    console.log("Hash:", data.key?.split(":")[2]?.substring(0, 10) || "N/A");
    console.log("Hits:", data.hits || 0);
    console.log("---");
  });
}

checkCache().catch(console.error);
