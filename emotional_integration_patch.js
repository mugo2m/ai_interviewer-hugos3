// 🧠 EMOTIONAL MEMORY INTEGRATION PATCH
// Add these methods to your memoryService.ts

// 1. Add emotional state recording to interview completion
async function completeInterviewWithEmotion(userId: string, sessionId: string, results: any) {
  // Existing completion logic...
  
  // NEW: Record emotional state
  if (results.emotion) {
    await emotionalMemory.recordEmotionalState(userId, {
      emotion: results.emotion,
      intensity: results.emotionalIntensity || 5,
      context: `Interview completed: ${sessionId}`,
      metadata: {
        sessionId,
        score: results.score,
        difficulty: results.difficulty,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // NEW: Calculate wellness
  const wellness = await emotionalMemory.calculateEmotionalWellness(userId);
  console.log(`🧠 Post-interview wellness: ${wellness.overallScore}`);
  
  return { ...results, emotionalWellness: wellness };
}

// 2. Add emotional analysis to user progress
async function getUserProgressWithEmotion(userId: string) {
  const progress = await progressMemory.getUserProgress(userId);
  const emotionalState = await emotionalMemory.getCurrentEmotionalState(userId);
  const patterns = await emotionalMemory.analyzeEmotionalPatterns(userId);
  
  return {
    ...progress,
    emotionalState,
    emotionalPatterns: patterns,
    emotionalInsights: patterns.length > 0 ? patterns[0]?.insight : null
  };
}

// 3. Emotional feedback processing
async function processFeedbackWithEmotion(userId: string, feedback: any) {
  // Process feedback...
  
  // Record emotion from feedback
  if (feedback.userEmotion) {
    await emotionalMemory.recordEmotionalState(userId, {
      emotion: feedback.userEmotion,
      intensity: feedback.emotionalIntensity || 5,
      context: 'User feedback submission',
      metadata: {
        feedbackId: feedback.id,
        rating: feedback.rating,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  return feedback;
}

// 4. Emotional context for conversations
async function getConversationContextWithEmotion(userId: string) {
  const conversation = await conversationMemory.getRecentConversations(userId, 10);
  const emotionalTimeline = await emotionalMemory.getEmotionalTimeline(userId, 30); // Last 30 days
  
  return {
    conversationHistory: conversation,
    emotionalContext: {
      currentState: await emotionalMemory.getCurrentEmotionalState(userId),
      recentPatterns: await emotionalMemory.analyzeEmotionalPatterns(userId),
      timeline: emotionalTimeline
    }
  };
}
