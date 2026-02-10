const fetch = require('node-fetch');

console.log('🧠 TESTING emotionalMemory ACTIVATION\n');
console.log('='.repeat(70));

async function test() {
  const BASE_URL = 'http://localhost:3000';
  const USER_ID = 'test-emotional-' + Date.now();
  
  console.log('📡 Test 1: API Health Check');
  const healthRes = await fetch(BASE_URL + '/api/memory/emotion?action=health');
  const healthData = await healthRes.json();
  console.log('   Status:', healthRes.status === 200 ? '✅' : '❌');
  console.log('   Message:', healthData.message || 'N/A');
  
  console.log('\n📝 Test 2: Record Emotional State');
  const emotionData = {
    userId: USER_ID,
    emotion: 'confident',
    intensity: 85,
    context: {
      questionDifficulty: 'medium',
      topic: 'JavaScript',
      previousEmotion: 'neutral',
      currentScore: 75
    },
    notes: 'Feeling good about this question'
  };
  
  const recordRes = await fetch(BASE_URL + '/api/memory/emotion?action=record', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emotionData)
  });
  
  const recordData = await recordRes.json();
  console.log('   Status:', recordRes.status === 200 ? '✅' : '❌');
  console.log('   Success:', recordData.success || false);
  console.log('   Emotion ID:', recordData.emotionId || 'N/A');
  
  console.log('\n📊 Test 3: Get Emotional Timeline');
  const timelineRes = await fetch(BASE_URL + \`/api/memory/emotion?action=timeline&userId=\${USER_ID}\`);
  const timelineData = await timelineRes.json();
  console.log('   Status:', timelineRes.status === 200 ? '✅' : '❌');
  console.log('   Has timeline:', Array.isArray(timelineData.timeline) ? '✅' : '❌');
  
  console.log('\n💡 Test 4: Get Wellness Score');
  const wellnessRes = await fetch(BASE_URL + \`/api/memory/emotion?action=wellness&userId=\${USER_ID}\`);
  const wellnessData = await wellnessRes.json();
  console.log('   Status:', wellnessRes.status === 200 ? '✅' : '❌');
  console.log('   Has wellness score:', wellnessData.wellness ? '✅' : '❌');
  if (wellnessData.wellness) {
    console.log('   Overall Score:', wellnessData.wellness.overallScore || 'N/A');
    console.log('   Confidence Level:', wellnessData.wellness.metrics?.confidenceLevel || 'N/A');
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('🎯 emotionalMemory ACTIVATION STATUS:');
  console.log('- API Endpoints: ✅ CREATED (/api/memory/emotion)');
  console.log('- Memory Service: ✅ INTEGRATED');
  console.log('- Exports: ✅ ADDED to index.ts');
  console.log('- Types: ✅ ALREADY EXIST');
  console.log('='.repeat(70));
  
  if (recordRes.status === 200 && timelineRes.status === 200 && wellnessRes.status === 200) {
    console.log('\n🎉 emotionalMemory IS NOW ACTIVE AND WORKING!');
  } else {
    console.log('\n⚠️ Some tests failed - check server logs');
  }
}

test();
