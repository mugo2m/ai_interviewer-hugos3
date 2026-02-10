// 🧠 PROPER EMOTIONAL MEMORY INTEGRATION
// Add to your memoryService.ts

// 1. FIRST: Add import at the top (with other imports)
import { emotionalMemory } from './emotionalMemory';

// 2. THEN: Add emotional memory functions to your memoryService class/object

// Example: Add emotional tracking to existing methods
async function recordInterviewSession(userId: string, sessionData: any) {
  // Existing logic...
  
  // NEW: Record emotional state if provided
  if (sessionData.emotionalState) {
    await emotionalMemory.recordEmotionalState(userId, {
      emotion: sessionData.emotionalState.emotion,
      intensity: sessionData.emotionalState.intensity || 5,
      context: 'Interview session',
      metadata: {
        sessionId: sessionData.sessionId,
        interviewType: sessionData.interviewType,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  return sessionData;
}

// Example: Add emotional wellness to user profile
async function getUserProfile(userId: string) {
  const profile = {
    // Existing profile data...
  };
  
  // NEW: Add emotional data
  try {
    const emotionalState = await emotionalMemory.getCurrentEmotionalState(userId);
    const wellness = await emotionalMemory.calculateEmotionalWellness(userId);
    
    return {
      ...profile,
      emotionalState,
      emotionalWellness: wellness,
      hasEmotionalData: true
    };
  } catch (error) {
    console.log('No emotional data available');
    return {
      ...profile,
      hasEmotionalData: false
    };
  }
}

// Example: Emotional analysis for insights
async function getUserInsights(userId: string) {
  const insights = {
    // Existing insights...
  };
  
  // NEW: Add emotional insights
  try {
    const patterns = await emotionalMemory.analyzeEmotionalPatterns(userId);
    const timeline = await emotionalMemory.getEmotionalTimeline(userId, 7); // Last 7 days
    
    return {
      ...insights,
      emotionalInsights: {
        patterns,
        timeline,
        hasPatterns: patterns.length > 0
      }
    };
  } catch (error) {
    return insights;
  }
}

// 3. Make sure to export these enhanced functions
export {
  recordInterviewSession,
  getUserProfile,
  getUserInsights
};
