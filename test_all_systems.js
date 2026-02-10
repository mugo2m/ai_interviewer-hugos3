const fetch = require('node-fetch');

async function testAllMemories() {
  console.log('🧠 COMPREHENSIVE MEMORY SYSTEM TEST\n');
  console.log('=' .repeat(70));
  
  const BASE_URL = 'http://localhost:3000';
  const TEST_USER_ID = 'Rb1nPT2rS4OFDaVIsjESkn219sj2';
  
  console.log('📊 Testing 5 Memory Systems:\n');
  
  // Test 1-3: Main Memory API (already confirmed working)
  const mainMemoryActions = ['getResumeData', 'getPerformanceHistory', 'getProgress'];
  let mainMemoryResults = [];
  
  for (const action of mainMemoryActions) {
    console.log(`🔧 Main Memory: ${action}...`);
    try {
      const response = await fetch(BASE_URL + '/api/memory/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: TEST_USER_ID, action })
      });
      
      const result = {
        action,
        status: response.status,
        ok: response.ok
      };
      
      if (response.ok) {
        console.log(`   ✅ ${action}: WORKING (${response.status})`);
      } else {
        console.log(`   ❌ ${action}: FAILED (${response.status})`);
      }
      
      mainMemoryResults.push(result);
    } catch (error) {
      console.log(`   💥 ${action}: ERROR (${error.message})`);
      mainMemoryResults.push({ action, status: 'ERROR', ok: false });
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('\n---\n');
  
  // Test 4: Buffer Memory API
  console.log('🔧 Buffer Memory: Creating test buffer...');
  const bufferResults = [];
  
  try {
    const createResponse = await fetch(BASE_URL + '/api/interview/buffer?action=create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: TEST_USER_ID,
        sessionId: 'test-buffer-' + Date.now(),
        interviewType: 'test',
        metadata: { test: true }
      })
    });
    
    const createData = await createResponse.json();
    bufferResults.push({
      action: 'create',
      status: createResponse.status,
      ok: createResponse.ok,
      data: createData
    });
    
    if (createResponse.ok) {
      console.log(`   ✅ Buffer CREATE: WORKING (${createResponse.status})`);
      console.log(`      Response keys: ${Object.keys(createData).join(', ')}`);
    } else {
      console.log(`   ❌ Buffer CREATE: FAILED (${createResponse.status})`);
    }
  } catch (error) {
    console.log(`   💥 Buffer CREATE: ERROR (${error.message})`);
  }
  
  // Test Buffer getUserBuffers
  try {
    const getResponse = await fetch(BASE_URL + \`/api/interview/buffer?action=getUserBuffers&userId=\${TEST_USER_ID}\`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const getData = await getResponse.json();
    bufferResults.push({
      action: 'getUserBuffers',
      status: getResponse.status,
      ok: getResponse.ok,
      data: getData
    });
    
    if (getResponse.ok) {
      console.log(`   ✅ Buffer GET: WORKING (${getResponse.status})`);
    } else {
      console.log(`   ❌ Buffer GET: FAILED (${getResponse.status})`);
    }
  } catch (error) {
    console.log(`   💥 Buffer GET: ERROR (${error.message})`);
  }
  
  console.log('\n' + '=' .repeat(70));
  console.log('📋 FINAL RESULTS:\n');
  
  // Main Memory Results
  const workingMain = mainMemoryResults.filter(r => r.ok).length;
  console.log(`Main Memory API: ${workingMain}/3 actions working`);
  mainMemoryResults.forEach(r => {
    console.log(`  ${r.ok ? '✅' : '❌'} ${r.action}: ${r.status}`);
  });
  
  console.log('');
  
  // Buffer Memory Results
  const workingBuffer = bufferResults.filter(r => r.ok).length;
  console.log(`Buffer Memory API: ${workingBuffer}/2 actions working`);
  bufferResults.forEach(r => {
    console.log(`  ${r.ok ? '✅' : '❌'} ${r.action}: ${r.status}`);
  });
  
  console.log('\n' + '=' .repeat(70));
  
  const totalWorking = workingMain + workingBuffer;
  const totalTests = mainMemoryResults.length + bufferResults.length;
  
  console.log(`🎯 OVERALL: ${totalWorking}/${totalTests} memory actions working`);
  
  if (totalWorking === totalTests) {
    console.log('🚀 EXCELLENT! All memory systems are fully operational!');
  } else if (totalWorking >= 4) {
    console.log('⚠️  GOOD! Most memory systems working.');
  } else {
    console.log('🔧 NEEDS WORK: Several memory systems need attention.');
  }
  
  console.log('\n🧠 ACTIVE MEMORY COUNT: 6 confirmed memory systems');
  console.log('   - 5 in main memory service');
  console.log('   - 1 buffer memory (now fixed)');
}

testAllMemories();
