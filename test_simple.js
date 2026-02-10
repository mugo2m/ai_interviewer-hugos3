const fetch = require('node-fetch');

async function test() {
  console.log('🧪 Testing Fixed Buffer API\n');
  
  const BASE_URL = 'http://localhost:3000';
  const USER_ID = 'test-user-' + Date.now();
  
  // Test 1: Create buffer
  console.log('1. Testing create buffer...');
  try {
    const createResponse = await fetch(BASE_URL + '/api/interview/buffer?action=create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: USER_ID,
        sessionId: 'test-session-' + Date.now(),
        interviewType: 'test_interview',
        metadata: { test: true }
      })
    });
    
    console.log(`   Status: ${createResponse.status}`);
    if (createResponse.ok) {
      const data = await createResponse.json();
      console.log('   ✅ SUCCESS - Buffer created');
      console.log(`   Buffer ID: ${data.buffer?.id}`);
      return data.buffer?.id;
    } else {
      const error = await createResponse.text();
      console.log('   ❌ ERROR:', error.slice(0, 100));
    }
  } catch (error) {
    console.log('   💥 NETWORK ERROR:', error.message);
  }
  
  // Test 2: Main memory API (should work)
  console.log('\n2. Testing main memory API...');
  try {
    const memoryResponse = await fetch(BASE_URL + '/api/memory/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'Rb1nPT2rS4OFDaVIsjESkn219sj2',
        action: 'getResumeData'
      })
    });
    
    console.log(`   Status: ${memoryResponse.status}`);
    if (memoryResponse.ok) {
      console.log('   ✅ SUCCESS - Memory API working');
    } else {
      console.log('   ❌ Memory API failed');
    }
  } catch (error) {
    console.log('   💥 NETWORK ERROR:', error.message);
  }
}

test();
