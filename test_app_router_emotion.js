const fetch = require("node-fetch");

async function test() {
  console.log("🧠 Testing emotionalMemory via App Router\n");
  
  try {
    // Test the App Router endpoint
    const res = await fetch("http://localhost:3000/api/memory/emotion");
    const data = await res.text(); // Use text() first to see what we get
    
    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers.get("content-type"));
    
    // Try to parse as JSON if possible
    if (res.headers.get("content-type")?.includes("application/json")) {
      const jsonData = JSON.parse(data);
      console.log("Response:", JSON.stringify(jsonData, null, 2));
    } else {
      console.log("Response (text):", data.substring(0, 200) + "...");
    }
    
    // Also test with query parameter
    console.log("\n--- Testing with action parameter ---");
    const res2 = await fetch("http://localhost:3000/api/memory/emotion?action=health");
    const data2 = await res2.text();
    console.log("Status:", res2.status);
    console.log("Response:", data2.substring(0, 200) + "...");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

test();
