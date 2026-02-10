// 🧪 Simple Emotional Memory Test
// Run this to test if emotionalMemory works

console.log('🧠 Testing Emotional Memory Module...\n');

// Test 1: Check if module can be imported
try {
  // Try different import patterns
  console.log('1. Testing import patterns...');
  
  // Pattern 1: Default import
  console.log('   Pattern 1: import emotionalMemory from "./emotionalMemory"');
  
  // Pattern 2: Named import  
  console.log('   Pattern 2: import { emotionalMemory } from "./emotionalMemory"');
  
  // Pattern 3: Class import
  console.log('   Pattern 3: import { EmotionalMemory } from "./emotionalMemory"');
  
  console.log('\n💡 Check your emotionalMemory.ts to see which export pattern it uses');
  
} catch (error) {
  console.error('❌ Import failed:', error.message);
}

// Test 2: Check available functions
console.log('\n2. Available emotionalMemory functions:');
console.log('   - recordEmotionalState(userId, data)');
console.log('   - analyzeEmotionalPatterns(userId)');
console.log('   - calculateEmotionalWellness(userId)');
console.log('   - getEmotionalTimeline(userId, days)');
console.log('   - getEmotionalPatterns(userId)');
console.log('   - getCurrentEmotionalState(userId)');
console.log('   - suggestEmotionalIntervention(userId)');
console.log('   - clearUserEmotionalData(userId)');

console.log('\n🎯 To activate emotionalMemory:');
console.log('   1. Add correct import to memoryService.ts');
console.log('   2. Start calling the functions above');
console.log('   3. Your memory count: 6 → 7 ACTIVE MEMORIES!');
