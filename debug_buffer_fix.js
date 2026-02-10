// Quick test to see what's happening
const fetch = require('node-fetch');

async function debugBufferResponse() {
  console.log('🔍 Debugging Buffer Response Structure\n');
  
  const BASE_URL = 'http://localhost:3000';
  const USER_ID = 'debug-fix-' + Date.now();
  const SESSION_ID = 'debug-session-fix-' + Date.now();
  
  console.log('Creating buffer with:');
  console.log('  User ID:', USER_ID);
  console.log('  Session ID:', SESSION_ID);
  
  const response = await fetch(BASE_URL + '/api/interview/buffer?action=create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: USER_ID,
      sessionId: SESSION_ID,
      interviewType: 'debug_fix',
      metadata: { debug: 'fix-test' }
    })
  });
  
  console.log('\nResponse Status:', response.status);
  
  const data = await response.json();
  console.log('\nFull Response:', JSON.stringify(data, null, 2));
  
  console.log('\n🔍 Analysis:');
  console.log('1. success:', data.success);
  console.log('2. Has buffer property?', 'buffer' in data);
  
  if (data.buffer) {
    console.log('3. Buffer keys:', Object.keys(data.buffer));
    console.log('4. Buffer ID:', data.buffer.id || 'UNDEFINED');
    console.log('5. Buffer object:', JSON.stringify(data.buffer, null, 2));
  } else {
    console.log('3. No buffer property in response');
  }
  
  // Also test the main memory API
  console.log('\n--- Testing Main Memory API ---');
  const memoryRes = await fetch(BASE_URL + '/api/memory/performance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: USER_ID, action: 'getResumeData' })
  });
  
  console.log('Main Memory Status:', memoryRes.status);
  console.log('Main Memory Working:', memoryRes.status === 200 ? '✅ YES' : '❌ NO');
}

debugBufferResponse();
