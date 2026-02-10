const fetch = require("node-fetch");

const testData = {
  interviewId: "debug-response",
  userId: "debug-user",
  transcript: [
    {"role":"assistant","content":"What are the basic types of wood joints?"},
    {"role":"user","content":"Butt joint, miter joint, lap joint"}
  ]
};

async function test() {
  console.log("📤 Sending request...");
  const response = await fetch("http://localhost:3000/api/feedback", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(testData)
  });
  
  const data = await response.json();
  
  console.log("\n📦 FULL RESPONSE:");
  console.log(JSON.stringify(data, null, 2));
  
  console.log("\n🔍 Checking fields:");
  console.log("Top-level cached:", data.cached);
  console.log("data.cached:", data.data?.cached);
  console.log("All top-level keys:", Object.keys(data));
  
  // Check if cached is in data object instead
  if (data.data && "cached" in data.data) {
    console.log("\n⚠️  WARNING: 'cached' field is inside 'data' object, not at top level!");
  }
}

test();
