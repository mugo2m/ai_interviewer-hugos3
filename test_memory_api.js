const fetch = require('node-fetch');

async function testMemoryAPI() {
  const userId = 'Rb1nPT2rS4OFDaVIsjESkn219sj2';
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Memory API Endpoints...\n');
  
  const tests = [
    { action: 'getResumeData', expected: 'user data' },
    { action: 'getPerformanceHistory', expected: 'performance array' },
    { action: 'getProgress', expected: 'progress object' },
    { action: 'recordEmotion', body: { emotion: 'neutral', timestamp: new Date().toISOString() } },
  ];
  
  for (const test of tests) {
    try {
      console.log(`Testing: ${test.action}...`);
      const response = await fetch(`\${baseUrl}/api/memory/performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId, 
          action: test.action,
          ...(test.body || {})
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ \${test.action}: WORKING (Status: \${response.status})`);
      } else {
        console.log(`❌ \${test.action}: FAILED (Status: \${response.status})`);
      }
    } catch (error) {
      console.log(`❌ \${test.action}: ERROR (\${error.message})`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

testMemoryAPI();
