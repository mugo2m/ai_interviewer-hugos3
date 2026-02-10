const fetch = require("node-fetch");

const testData = {
  interviewId: "test-cache-debug",
  userId: "test-user-debug",
  transcript: [
    {role: "assistant", content: "Test question"},
    {role: "user", content: "Test answer"}
  ]
};

async function test() {
  console.log("🚀 Testing API response structure...");
  
  const response = await fetch("http://localhost:3000/api/feedback", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(testData)
  });
  
  const data = await response.json();
  
  console.log("\n📦 FULL RESPONSE OBJECT:");
  console.log(JSON.stringify(data, null, 2));
  
  console.log("\n🔍 KEY FIELDS:");
  console.log("cached:", data.cached);
  console.log("feedbackId:", data.feedbackId);
  console.log("success:", data.success);
  console.log("All keys:", Object.keys(data));
}

test();
