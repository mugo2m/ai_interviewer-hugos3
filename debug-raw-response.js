const fetch = require("node-fetch");

async function test() {
  console.log("📤 Sending request...");
  
  const testData = {
    interviewId: "debug-final",
    userId: "debug-user",
    transcript: [{role: "assistant", content: "Test"}, {role: "user", content: "Test"}]
  };
  
  const response = await fetch("http://localhost:3000/api/feedback", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(testData)
  });
  
  const text = await response.text();
  console.log("\n📦 RAW RESPONSE:");
  console.log(text);
  
  try {
    const data = JSON.parse(text);
    console.log("\n🔍 PARSED RESPONSE:");
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.log("\n❌ Response is not valid JSON!");
  }
}

test();
