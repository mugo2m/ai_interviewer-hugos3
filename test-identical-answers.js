// Use this EXACT transcript to test cache
const testTranscript = [
  { "role": "assistant", "content": "What are the basic types of wood joints?" },
  { "role": "user", "content": "Butt joint, miter joint, dovetail joint, mortise and tenon" },
  { "role": "assistant", "content": "Explain what a dovetail joint is" },
  { "role": "user", "content": "A dovetail joint is a strong woodworking joint that resists pulling apart" },
  { "role": "assistant", "content": "What tools are essential for joinery?" },
  { "role": "user", "content": "Saw, chisel, hammer, measuring tape, square" },
  { "role": "assistant", "content": "How do you ensure a tight fit in joinery?" },
  { "role": "user", "content": "Accurate measuring, marking, and careful cutting with test fitting" },
  { "role": "assistant", "content": "What wood is best for beginners?" },
  { "role": "user", "content": "Pine or softwood because it's easy to work with" }
];

console.log("📝 Use this EXACT transcript to test cache:");
console.log(JSON.stringify(testTranscript, null, 2));
console.log("\n🔑 Key: Submit TWICE with this SAME transcript.");
console.log("✅ First time: Should see 'Cache miss' and store with hash");
console.log("✅ Second time: Should see 'Cache HIT' and NO Gemini API call");
