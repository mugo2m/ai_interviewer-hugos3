// 🧠 Emotional Memory Activation Code
// Add this to your memoryService.ts to start using emotionalMemory

// Assuming emotionalMemory is already imported, here's how to use it:

// Example 1: Record emotional state during an interview
async function recordInterviewEmotion(userId: string, sessionId: string, emotionData: any) {
  try {
    await emotionalMemory.recordEmotionalState(userId, {
      emotion: emotionData.emotion,
      intensity: emotionData.intensity || 5,
      context: `Interview session: ${sessionId}`,
      metadata: {
        sessionId,
        interviewType: emotionData.interviewType || 'general',
        timestamp: new Date().toISOString()
      }
    });
    console.log(`✅ Recorded emotion for user ${userId}: ${emotionData.emotion}`);
  } catch (error) {
    console.error('❌ Failed to record emotion:', error);
  }
}

// Example 2: Get emotional wellness score
async function getUserWellness(userId: string) {
  try {
    const wellness = await emotionalMemory.calculateEmotionalWellness(userId);
    console.log(`🧠 User ${userId} wellness score: ${wellness.overallScore}`);
    return wellness;
  } catch (error) {
    console.error('❌ Failed to get wellness:', error);
    return null;
  }
}

// Example 3: Analyze emotional patterns
async function analyzeUserPatterns(userId: string) {
  try {
    const patterns = await emotionalMemory.analyzeEmotionalPatterns(userId);
    console.log(`📊 Found ${patterns.length} emotional patterns for user ${userId}`);
    return patterns;
  } catch (error) {
    console.error('❌ Failed to analyze patterns:', error);
    return [];
  }
}

// Example 4: Get current emotional state
async function getCurrentEmotion(userId: string) {
  try {
    const currentState = await emotionalMemory.getCurrentEmotionalState(userId);
    if (currentState) {
      console.log(`😊 User ${userId} current emotion: ${currentState.emotion} (intensity: ${currentState.intensity})`);
    }
    return currentState;
  } catch (error) {
    console.error('❌ Failed to get current emotion:', error);
    return null;
  }
}

// Export these functions for use
export {
  recordInterviewEmotion,
  getUserWellness,
  analyzeUserPatterns,
  getCurrentEmotion
};
