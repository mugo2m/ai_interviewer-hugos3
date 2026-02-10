const fetch = require('node-fetch');

async function debugResponse() {
  console.log('🔍 Debugging Buffer API Response\n');
  
  const BASE_URL = 'http://localhost:3000';
  const USER_ID = 'debug-user-' + Date.now();
  const SESSION_ID = 'debug-session-' + Date.now();
  
  console.log('1. Creating buffer...');
  const response = await fetch(BASE_URL + '/api/interview/buffer?action=create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: USER_ID,
      sessionId: SESSION_ID,
      interviewType: 'debug_interview',
      metadata: { debug: true, timestamp: new Date().toISOString() }
    })
  });
  
  console.log(`Status: ${response.status}`);
  console.log(`Status Text: ${response.statusText}`);
  
  const responseText = await response.text();
  console.log('\n📄 Raw Response:');
  console.log(responseText);
  
  console.log('\n🔍 Trying to parse as JSON...');
  try {
    const data = JSON.parse(responseText);
    console.log('✅ Valid JSON');
    console.log('Parsed Data:', JSON.stringify(data, null, 2));
    
    if (data.buffer) {
      console.log(`\n🎯 Buffer Object Properties:`);
      Object.keys(data.buffer).forEach(key => {
        console.log(`  ${key}: ${typeof data.buffer[key]} = ${JSON.stringify(data.buffer[key]).slice(0, 50)}`);
      });
    } else {
      console.log('\n❌ No "buffer" property in response');
      console.log('Available properties:', Object.keys(data));
    }
  } catch (error) {
    console.log('❌ Not valid JSON:', error.message);
  }
}

debugResponse();
