const fetch = require("node-fetch");

console.log("🎯 ULTIMATE CACHE VERIFICATION");
console.log("===============================\n");

// First, let's see the current stats
const statsResponse = await fetch("http://localhost:3000/api/cache/stats");
const stats = await statsResponse.json();
console.log("📊 BEFORE TEST - Current Stats:");
console.log(`   Hits: ${stats.stats?.hits || 0}`);
console.log(`   Misses: ${stats.stats?.misses || 0}`);
console.log(`   Hit Rate: ${stats.stats?.hitRate || "0%"}`);
console.log(`   Savings: ${stats.stats?.estimatedSavings || "$0.00"}\n`);

const testData = {
  interviewId: "ultimate-test-" + Date.now(),
  userId: "ultimate-user-" + Date.now(),
  transcript: [
    {role: "assistant", content: "What is 2+2?"},
    {role: "user", content: "4"}
  ]
};

console.log("1️⃣  FIRST REQUEST (should be cache miss):");
const r1 = await fetch("http://localhost:3000/api/feedback", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify(testData)
});
const d1 = await r1.json();
console.log(`   Status: ${r1.status}`);
console.log(`   Cached: ${d1.cached}`);
console.log(`   Message: ${d1.message}`);
console.log(`   Expected: cached=false ✓\n`);

await new Promise(r => setTimeout(r, 3000));

console.log("2️⃣  SECOND REQUEST (SHOULD BE CACHE HIT!):");
const r2 = await fetch("http://localhost:3000/api/feedback", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify(testData)
});
const d2 = await r2.json();
console.log(`   Status: ${r2.status}`);
console.log(`   Cached: ${d2.cached}`);
console.log(`   Message: ${d2.message}`);
console.log(`   Expected: cached=true (if fixed) ✓\n`);

console.log("3️⃣  CHECK UPDATED STATS:");
const statsResponse2 = await fetch("http://localhost:3000/api/cache/stats");
const stats2 = await statsResponse2.json();
console.log(`   Hits: ${stats2.stats?.hits || 0} (should increase)`);
console.log(`   Misses: ${stats2.stats?.misses || 0}`);
console.log(`   Hit Rate: ${stats2.stats?.hitRate || "0%"}`);
console.log(`   Savings: ${stats2.stats?.estimatedSavings || "$0.00"}\n`);

console.log("🎉 CONCLUSION:");
if (d1.cached === false && d2.cached === true) {
  console.log("✅ PERFECT! Cache is working AND API response is correct!");
  console.log("💰 You're saving money on every duplicate request!");
} else if (stats2.stats?.hits > stats.stats?.hits) {
  console.log("✅ Cache IS working (hits increased), but API response has bug.");
  console.log("💰 You're STILL saving money - fix API response when you can.");
} else {
  console.log("❌ Something is wrong - check server logs.");
}
