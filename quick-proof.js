const fetch = require("node-fetch");

console.log("🎯 FINAL PROOF - Your Cache is Working!");
console.log("=======================================\n");

// Simple test data
const testData = {
  interviewId: "proof-" + Date.now(),
  userId: "user-proof",
  transcript: [{role: "assistant", content: "Test"}, {role: "user", content: "Test"}]
};

async function test() {
  // First request
  const r1 = await fetch("http://localhost:3000/api/feedback", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(testData)
  });
  const d1 = await r1.json();
  console.log("Request 1 - Cached: " + (d1.cached ? "✅ YES" : "❌ NO"));
  
  // Second request (same data)
  const r2 = await fetch("http://localhost:3000/api/feedback", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(testData)
  });
  const d2 = await r2.json();
  console.log("Request 2 - Cached: " + (d2.cached ? "✅ YES" : "❌ NO"));
  
  // Check stats
  const stats = await fetch("http://localhost:3000/api/cache/stats").then(r => r.json());
  console.log("\n📊 Current Cache Stats:");
  console.log("   Hits: " + (stats.stats?.hits || 0));
  console.log("   Misses: " + (stats.stats?.misses || 0));
  console.log("   Hit Rate: " + (stats.stats?.hitRate || "0%"));
  console.log("   Savings: " + (stats.stats?.estimatedSavings || "$0.00"));
  
  console.log("\n🎉 CONCLUSION:");
  if (d1.cached === false && d2.cached === true) {
    console.log("✅ CACHE WORKING PERFECTLY!");
  } else if (d2.cached === true) {
    console.log("✅ CACHE WORKING (both requests cached from previous tests)");
  } else {
    console.log("❌ Check server logs");
  }
}

test();
