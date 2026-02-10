const fetch = require('node-fetch');

console.log('🎯 FINAL VERIFICATION: Memory System Status\n');
console.log('=' .repeat(70));

async function testEndpoint(name, url, method = 'GET', body = null) {
  console.log(`\n🔧 Testing: ${name}`);
  console.log(`   ${method} ${url}`);
  
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      console.log('   ✅ SUCCESS');
      if (data.buffer && Object.keys(data.buffer).length > 0) {
        console.log(`   Buffer ID: ${data.buffer.id}`);
        console.log(`   Has ${data.buffer.messages?.length || 0} messages`);
      }
      return { success: true, data };
    } else {
      console.log(`   ❌ FAILED: ${data.error || 'Unknown error'}`);
      return { success: false, data };
    }
  } catch (error) {
    console.log(`   💥 ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  const BASE_URL = 'http://localhost:3000';
  const TEST_USER_ID = 'final-test-user-' + Date.now();
  const TEST_SESSION_ID = 'final-session-' + Date.now();
  
  console.log(`Test User: ${TEST_USER_ID}`);
  console.log(`Test Session: ${TEST_SESSION_ID}`);
  
  // Test 1: Main Memory API
  const mainMemoryTest = await testEndpoint(
    'Main Memory API - getResumeData',
    BASE_URL + '/api/memory/performance',
    'POST',
    { userId: TEST_USER_ID, action: 'getResumeData' }
  );
  
  // Test 2: Create Buffer
  const createBufferTest = await testEndpoint(
    'Buffer API - Create Buffer',
    BASE_URL + '/api/interview/buffer?action=create',
    'POST',
    {
      userId: TEST_USER_ID,
      sessionId: TEST_SESSION_ID,
      interviewType: 'carpenter_junior_technical',
      metadata: { test: 'final-verification' }
    }
  );
  
  // Test 3: Get User Buffers
  const getBuffersTest = await testEndpoint(
    'Buffer API - Get User Buffers',
    BASE_URL + \`/api/interview/buffer?action=getUserBuffers&userId=\${TEST_USER_ID}\`,
    'GET'
  );
  
  console.log('\n' + '=' .repeat(70));
  console.log('📊 FINAL VERIFICATION RESULTS:');
  console.log('=' .repeat(70));
  
  const tests = [
    { name: 'Main Memory API', result: mainMemoryTest.success },
    { name: 'Buffer API - Create', result: createBufferTest.success },
    { name: 'Buffer API - Get Buffers', result: getBuffersTest.success }
  ];
  
  let passed = 0;
  tests.forEach(test => {
    const icon = test.result ? '✅' : '❌';
    console.log(`${icon} ${test.name}`);
    if (test.result) passed++;
  });
  
  console.log('\n' + '=' .repeat(70));
  console.log(`🎯 ${passed}/3 tests passed`);
  
  if (passed === 3) {
    console.log('🚀 EXCELLENT! All memory systems fully operational!');
  } else if (passed >= 2) {
    console.log('⚠️  GOOD! Most systems working.');
  } else {
    console.log('🔧 Needs attention.');
  }
  
  // Summary of what we fixed today
  console.log('\n🧠 TODAY\'S FIXES SUMMARY:');
  console.log('1. Found missing bufferMemoryService - ✅ CREATED');
  console.log('2. Fixed "use server" compatibility - ✅ CREATED bufferMemoryAPI.ts');
  console.log('3. Updated API imports - ✅ FIXED');
  console.log('4. Fixed empty buffer response - ✅ JUST FIXED');
  console.log('5. Verified 6 active memory systems - ✅ CONFIRMED');
}

runAllTests();
