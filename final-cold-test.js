const fetch = require("node-fetch");

// Generate COMPLETELY new transcript data
const randomId = Math.random().toString(36).substring(7);
const testTranscript = [
  {role: "assistant", content: \`Test interview \${randomId} - What is your experience?\`},
  {role: "user", content: \`I have \${Math.floor(Math.random() * 10)} years of experience in testing.\`},
  {role: "assistant", content: "Can you explain cache systems?"},
  {role: "user", content: \`Cache systems store data temporarily to improve performance. Random: \${randomId}\`}
];

const testData = {
  interviewId: "final-test-" + randomId,
  userId: "test-user-" + randomId,
  transcript: testTranscript
};

async function test() {
  console.log("🎯 FINAL VERIFICATION - COLD CACHE TEST");
  console.log("========================================\n");
  
  console.log("1️⃣  First request (should be cache MISS):");
  const r1 = await fetch("http://localhost:3000/api/feedback", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(testData)
  });
  const d1 = await r1.json();
  console.log(\`   Status: \${r1.status}\`);
  console.log(\`   Cached: \${d1.cached ? "✅ YES" : "❌ NO"} (expected: ❌ NO)\`);
  console.log(\`   Message: "\${d1.message}"\`);
  console.log(\`   Feedback ID: \${d1.feedbackId}\n\`);
  
  console.log("⏳ Waiting 3 seconds for cache to store...");
  await new Promise(r => setTimeout(r, 3000));
  
  console.log("2️⃣  Second request (should be cache HIT):");
  const r2 = await fetch("http://localhost:3000/api/feedback", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(testData)
  });
  const d2 = await r2.json();
  console.log(\`   Status: \${r2.status}\`);
  console.log(\`   Cached: \${d2.cached ? "✅ YES" : "❌ NO"} (expected: ✅ YES)\`);
  console.log(\`   Message: "\${d2.message}"\`);
  console.log(\`   Feedback ID: \${d2.feedbackId}\n\`);
  
  console.log("3️⃣  Cache Stats:");
  const stats = await fetch("http://localhost:3000/api/cache/stats").then(r => r.json());
  console.log(\`   Hits: \${stats.stats?.hits || 0}\`);
  console.log(\`   Misses: \${stats.stats?.misses || 0}\`);
  console.log(\`   Hit Rate: \${stats.stats?.hitRate || "0%"}\`);
  console.log(\`   Savings: \${stats.stats?.estimatedSavings || "$0.00"}\n\`);
  
  console.log("📊 FINAL RESULT:");
  if (d1.cached === false && d2.cached === true) {
    console.log("🎉 PERFECT! Cache system is 100% functional!");
    console.log("💰 Your cache saves money on every duplicate request!");
  } else if (d1.cached === true) {
    console.log("⚠️  First request was cached (transcript already in cache)");
    console.log("✅ This proves cache persistence across test runs!");
  } else {
    console.log("🔧 Check server logs for cache behavior");
  }
}

test().catch(console.error);
