const fetch = require('node-fetch');

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

async function testCache() {
  console.log("🚀 Testing Cache System on http://localhost:3000");
  console.log("Using transcript with", testTranscript.length, "messages\n");

  try {
    // Test 1: First submission (should be cache miss)
    console.log("📤 Test 1: First submission (should be cache miss)...");
    const response1 = await fetch('http://localhost:3000/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const result1 = await response1.json();
    console.log("   Status:", response1.status);
    console.log("   Cached:", result1.cached ? "✅ YES" : "❌ NO (expected)");
    console.log("   Feedback ID:", result1.feedbackId);
    console.log("   Message:", result1.message || "No message");
    
    // Wait 3 seconds for cache to be stored
    console.log("\n⏳ Waiting 3 seconds for cache to store...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Second submission (should be CACHE HIT!)
    console.log("\n📤 Test 2: Second submission (should be CACHE HIT!)...");
    const response2 = await fetch('http://localhost:3000/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const result2 = await response2.json();
    console.log("   Status:", response2.status);
    console.log("   Cached:", result2.cached ? "✅ YES (CACHE HIT!)" : "❌ NO (PROBLEM!)");
    console.log("   Feedback ID:", result2.feedbackId);
    console.log("   Message:", result2.message || "No message");
    
    // Check cache stats
    console.log("\n📊 Checking cache stats...");
    const statsResponse = await fetch('http://localhost:3000/api/cache/stats');
    const stats = await statsResponse.json();
    console.log("   Hits:", stats.stats?.hits || 0);
    console.log("   Misses:", stats.stats?.misses || 0);
    console.log("   Hit Rate:", stats.stats?.hitRate || "0%");
    console.log("   Savings:", stats.stats?.estimatedSavings || "$0.00");
    
    // Summary
    console.log("\n🎯 TEST SUMMARY:");
    if (result1.cached === false && result2.cached === true) {
      console.log("✅ SUCCESS! Cache is working!");
      console.log("💰 You saved $0.01 on the second submission!");
    } else if (result1.cached === false && result2.cached === false) {
      console.log("❌ FAILURE! Cache is NOT working!");
      console.log("⚠️  Both submissions were cache misses - wasting money!");
    } else {
      console.log("⚠️  Unexpected result - check manually.");
    }
    
  } catch (error) {
    console.error("❌ Error testing cache:", error.message);
    console.log("\n💡 Make sure your server is running on http://localhost:3000");
  }
}

testCache();

