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

const testData = {
  interviewId: 'carpenter-mid-level-mixed-5',
  userId: 'Rb1nPT2rS4OFDaVIsjESkn219sj2',
  transcript: testTranscript
};

console.log("🚀 Testing Cache System...");
console.log("Using transcript with", testTranscript.length, "messages");
console.log("\n📤 Test 1: First submission (should be cache miss)");
