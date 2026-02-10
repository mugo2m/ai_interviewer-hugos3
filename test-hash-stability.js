const crypto = require('crypto');

function simpleHash(text) {
  const normalized = text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .substring(0, 1000);
    
  return crypto.createHash('md5').update(normalized).digest('hex');
}

function hashTranscript(transcript) {
  const transcriptString = transcript
    .map(sentence => `${sentence.role}: ${sentence.content}`)
    .join('||');
  return simpleHash(transcriptString);
}

const testTranscript = [
  {"role":"assistant","content":"What are the basic types of wood joints?"},
  {"role":"user","content":"Butt joint, miter joint, lap joint"},
  {"role":"assistant","content":"Explain what a dovetail joint is"},
  {"role":"user","content":"A dovetail joint is a strong woodworking joint"},
  {"role":"assistant","content":"What tools are used in joinery?"},
  {"role":"user","content":"Saw, chisel, hammer, measuring tape"},
  {"role":"assistant","content":"How do you ensure joint strength?"},
  {"role":"user","content":"Precise cutting and proper glue application"},
  {"role":"assistant","content":"What wood is best for beginners?"},
  {"role":"user","content":"Pine or softwood is best for beginners"}
];

// Test 1: Same transcript twice
console.log("Test 1 - Same transcript:");
const hash1 = hashTranscript(testTranscript);
const hash2 = hashTranscript(testTranscript);
console.log("Hash 1:", hash1.substring(0, 10) + "...");
console.log("Hash 2:", hash2.substring(0, 10) + "...");
console.log("Same?", hash1 === hash2 ? "✅ YES" : "❌ NO");

// Test 2: Check transcript string
console.log("\nTest 2 - Transcript string:");
const transcriptString = testTranscript
  .map(sentence => `${sentence.role}: ${sentence.content}`)
  .join('||');
console.log("String length:", transcriptString.length);
console.log("First 100 chars:", transcriptString.substring(0, 100) + "...");
