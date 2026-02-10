// Simple check without Firebase credentials
const fs = require('fs');
const path = require('path');

// Read your firebaseCache.ts to see if it's properly set up
const firebaseCachePath = path.join(__dirname, 'lib', 'cache', 'firebaseCache.ts');
const generalActionPath = path.join(__dirname, 'lib', 'actions', 'general.action.ts');

console.log("🔍 Checking cache files...\n");

// Check firebaseCache.ts
if (fs.existsSync(firebaseCachePath)) {
  const content = fs.readFileSync(firebaseCachePath, 'utf8');
  const hasFieldValueImport = content.includes("import { FieldValue }");
  const hasIncrementError = content.includes("(db as any).FieldValue.increment");
  
  console.log("📁 firebaseCache.ts:");
  console.log("   FieldValue import:", hasFieldValueImport ? "✅ YES" : "❌ NO");
  console.log("   db.FieldValue.increment error:", hasIncrementError ? "❌ YES - NEEDS FIX" : "✅ NO");
} else {
  console.log("❌ firebaseCache.ts not found!");
}

console.log("\n");

// Check general.action.ts  
if (fs.existsSync(generalActionPath)) {
  const content = fs.readFileSync(generalActionPath, 'utf8');
  const hasFieldValueImport = content.includes('import { FieldValue } from "firebase-admin/firestore"');
  const hasDbFieldValue = content.includes('db.FieldValue.increment');
  
  console.log("📁 general.action.ts:");
  console.log("   FieldValue import:", hasFieldValueImport ? "✅ YES" : "❌ NO");
  console.log("   db.FieldValue.increment usage:", hasDbFieldValue ? "❌ YES - NEEDS FIX" : "✅ NO");
} else {
  console.log("❌ general.action.ts not found!");
}

console.log("\n🎯 To fix:");
console.log("1. Make sure FieldValue is imported at the TOP of general.action.ts");
console.log("2. Change ALL 'db.FieldValue.increment' to 'FieldValue.increment'");
console.log("3. Restart your server: npm run dev");
