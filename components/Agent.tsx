// components/Agent.tsx - COMPLETE FINAL VERSION WITH FIXED REDIRECT
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import VoiceService from "@/lib/voice/VoiceService";
console.log("📦 VoiceService imported from: @/lib/voice/VoiceService");
import { VoiceToggle } from "@/components/VoiceToggle";
import { MPESAPaymentModal } from "@/components/Payment/MPESAPaymentModal";
import { checkPaymentStatus } from "@/lib/payment/clientCheck";
import { useMemory } from "@/lib/hooks/useMemory";
import { ResumeInterviewModal } from "@/components/Memory/ResumeInterviewModal";
import { PerformanceAnalysis } from "@/components/Memory/PerformanceAnalysis";
import { EmotionalSupport } from "@/components/Memory/EmotionalSupport";
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  Target,
  CheckCircle,
  Heart,
  Brain,
  Zap
} from "lucide-react";

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  questions?: string[];
  profileImage?: string;
}

interface AnswerHistory {
  question: string;
  answer: string;
  questionNumber: number;
  timestamp: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  questions = [],
  profileImage
}: AgentProps) => {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [answerHistory, setAnswerHistory] = useState<AnswerHistory[]>([]);
  const [currentQuestionText, setCurrentQuestionText] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [paymentChecked, setPaymentChecked] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [paymentUsed, setPaymentUsed] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [showPerformanceAnalysis, setShowPerformanceAnalysis] = useState(false);
  const [questionStartTimes, setQuestionStartTimes] = useState<{[key: number]: number}>({});
  const [performanceSaved, setPerformanceSaved] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
  const [emotionalIntensity, setEmotionalIntensity] = useState(5);
  const [showEmotionalSupport, setShowEmotionalSupport] = useState(false);
  const [feedbackCalled, setFeedbackCalled] = useState(false);

  const [debugInfo, setDebugInfo] = useState({
    callStatus: "INACTIVE",
    currentQuestion: 0,
    totalQuestions: questions.length || 0,
    messages: 0,
    collectedAnswers: 0,
    isListening: false,
    isSpeaking: false,
    userId: userId || "MISSING",
    voiceMode: "SIMULATED" as "REAL" | "SIMULATED",
    serviceStatus: "NOT_INITIALIZED"
  });

  // ============ FIX: Use ref to persist answers across renders ============
  const answersRef = useRef<AnswerHistory[]>([]);

  // Initialize memory system
  const {
    resumeData,
    saveInterviewProgress,
    markInterviewCompleted,
    checkResumeInterview,
    saveUserPerformance,
    performanceHistory,
    weakAreas,
    performanceTrends,
    loadPerformanceData,
    recordEmotionalState,
    getEmotionalSupport
  } = useMemory(userId);

  const voiceServiceRef = useRef<VoiceService | null>(null);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const saveProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const emotionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ============ FIX: PREVENT DUPLICATE PAYMENT CHECKS ============
  const paymentCheckRan = useRef(false);
  const paymentCheckId = useRef(`payment-check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // ============ DEBUG: MONITOR TRANSCRIPT ============
  useEffect(() => {
    if (userTranscript) {
      console.log("📝 Agent received transcript:", {
        length: userTranscript.length,
        preview: userTranscript.substring(0, 50),
        hasContent: !!userTranscript.trim()
      });
    }
  }, [userTranscript]);

  // ============ MICROPHONE DIAGNOSTIC ============
  useEffect(() => {
    if (voiceEnabled && debugInfo.callStatus === "ACTIVE") {
      console.log("🎤 Running microphone diagnostic...");

      navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
        .then(stream => {
          console.log("✅ Microphone is working and accessible!");
          stream.getTracks().forEach(track => track.stop());
          toast.success("🎤 Microphone connected successfully");
        })
        .catch(err => {
          console.error("❌ Microphone error:", err.name, err.message);

          let errorMessage = "Microphone access failed";
          if (err.name === 'NotAllowedError') {
            errorMessage = "Microphone permission denied. Please allow access in browser settings.";
          } else if (err.name === 'NotFoundError') {
            errorMessage = "No microphone found. Please connect a microphone.";
          } else if (err.name === 'NotReadableError') {
            errorMessage = "Microphone is in use by another application.";
          }

          toast.error(errorMessage);
        });
    }
  }, [voiceEnabled, debugInfo.callStatus]);

  // ============ PERFORMANCE HELPER FUNCTIONS ============
  const calculateScores = useCallback((answerHistory: AnswerHistory[]) => {
    if (answerHistory.length === 0) {
      return { overall: 75, technical: 70, behavioral: 75, communication: 80, problemSolving: 70 };
    }

    let totalScore = 0;
    let technicalScore = 0;
    let behavioralScore = 0;
    let communicationScore = 0;
    let problemSolvingScore = 0;

    let technicalCount = 0;
    let behavioralCount = 0;
    let communicationCount = 0;
    let problemSolvingCount = 0;

    answerHistory.forEach(item => {
      const category = categorizeQuestion(item.question);
      const answerScore = evaluateAnswerQuality(item.answer);

      totalScore += answerScore;

      switch(category) {
        case 'React':
        case 'JavaScript':
        case 'TypeScript':
        case 'System Design':
        case 'Algorithms':
        case 'APIs':
        case 'Database':
          technicalScore += answerScore;
          technicalCount++;
          break;
        case 'Behavioral':
          behavioralScore += answerScore;
          behavioralCount++;
          break;
        default:
          technicalScore += answerScore * 0.3;
          behavioralScore += answerScore * 0.3;
          communicationScore += answerScore * 0.2;
          problemSolvingScore += answerScore * 0.2;
          technicalCount += 0.3;
          behavioralCount += 0.3;
          communicationCount += 0.2;
          problemSolvingCount += 0.2;
      }

      communicationScore += evaluateCommunication(item.answer);
      communicationCount++;
      problemSolvingScore += evaluateProblemSolving(item.answer, item.question);
      problemSolvingCount++;
    });

    const scores = {
      technical: technicalCount > 0 ? Math.round(technicalScore / technicalCount) : 70,
      behavioral: behavioralCount > 0 ? Math.round(behavioralScore / behavioralCount) : 75,
      communication: communicationCount > 0 ? Math.round(communicationScore / communicationCount) : 80,
      problemSolving: problemSolvingCount > 0 ? Math.round(problemSolvingScore / problemSolvingCount) : 70
    };

    const overall = Math.round(
      (scores.technical * 0.3) +
      (scores.behavioral * 0.2) +
      (scores.communication * 0.25) +
      (scores.problemSolving * 0.25)
    );

    return {
      overall,
      ...scores
    };
  }, []);

  const categorizeQuestion = (question: string): string => {
    const q = question.toLowerCase();

    if (q.includes('react') || q.includes('component') || q.includes('hook') || q.includes('state')) {
      return 'React';
    }
    if (q.includes('javascript') || q.includes('js ') || q.includes('ecmascript')) {
      return 'JavaScript';
    }
    if (q.includes('typescript') || q.includes('ts ') || q.includes('type ')) {
      return 'TypeScript';
    }
    if (q.includes('system design') || q.includes('scalability') || q.includes('architecture')) {
      return 'System Design';
    }
    if (q.includes('algorithm') || q.includes('data structure') || q.includes('complexity')) {
      return 'Algorithms';
    }
    if (q.includes('experience') || q.includes('team') || q.includes('conflict') || q.includes('challenge')) {
      return 'Behavioral';
    }
    if (q.includes('api') || q.includes('rest') || q.includes('graphql') || q.includes('endpoint')) {
      return 'APIs';
    }
    if (q.includes('database') || q.includes('sql') || q.includes('mongodb') || q.includes('redis')) {
      return 'Database';
    }

    return 'General';
  };

  const evaluateAnswerQuality = (answer: string): number => {
    if (!answer || answer.trim().length === 0) return 0;

    const trimmed = answer.trim();
    const words = trimmed.split(/\s+/).length;
    const sentences = trimmed.split(/[.!?]+/).length - 1;

    let score = 50;

    if (words < 20) score -= 20;
    else if (words < 50) score -= 10;
    else if (words < 100) score += 10;
    else if (words < 200) score += 20;
    else score += 25;

    if (sentences >= 3) score += 10;

    const indicators = ['because', 'example', 'therefore', 'however', 'specifically'];
    indicators.forEach(indicator => {
      if (trimmed.toLowerCase().includes(indicator)) score += 2;
    });

    const technicalIndicators = ['function', 'component', 'api', 'database', 'algorithm'];
    technicalIndicators.forEach(indicator => {
      if (trimmed.toLowerCase().includes(indicator)) score += 3;
    });

    return Math.min(100, Math.max(0, score));
  };

  const evaluateCommunication = (answer: string): number => {
    if (!answer) return 50;

    let score = 60;
    const trimmed = answer.toLowerCase();

    if (trimmed.includes('clear')) score += 10;
    if (trimmed.includes('explain')) score += 5;

    const structureWords = ['firstly', 'secondly', 'finally', 'in summary'];
    structureWords.forEach(word => {
      if (trimmed.includes(word)) score += 3;
    });

    if (trimmed.split(/[.!?]+/).length > 3) score += 5;

    return Math.min(100, score);
  };

  const evaluateProblemSolving = (answer: string, question: string): number => {
    let score = 65;

    const approachIndicators = ['approach', 'solution', 'solve', 'handle', 'implement'];
    approachIndicators.forEach(indicator => {
      if (answer.toLowerCase().includes(indicator)) score += 5;
    });

    if (answer.toLowerCase().includes('step') || answer.includes('1.') || answer.includes('2.')) {
      score += 10;
    }

    return Math.min(100, score);
  };

  const identifyWeakAreas = (answerHistory: AnswerHistory[]): string[] => {
    const weakAreas = new Set<string>();

    if (answerHistory.length === 0) {
      return ["Complete interview to identify weak areas"];
    }

    const categoryScores: Record<string, { total: number; count: number }> = {};

    answerHistory.forEach(item => {
      const category = categorizeQuestion(item.question);
      const score = evaluateAnswerQuality(item.answer);

      if (!categoryScores[category]) {
        categoryScores[category] = { total: 0, count: 0 };
      }

      categoryScores[category].total += score;
      categoryScores[category].count += 1;
    });

    Object.entries(categoryScores).forEach(([category, data]) => {
      const average = data.total / data.count;
      if (average < 70) {
        weakAreas.add(category);
      }
    });

    const result = Array.from(weakAreas);
    return result.length > 0 ? result.slice(0, 3) : ["No major weak areas identified"];
  };

  const identifyStrongAreas = (answerHistory: AnswerHistory[]): string[] => {
    const strongAreas = new Set<string>();

    if (answerHistory.length === 0) {
      return ["Complete interview to identify strengths"];
    }

    const categoryScores: Record<string, { total: number; count: number }> = {};

    answerHistory.forEach(item => {
      const category = categorizeQuestion(item.question);
      const score = evaluateAnswerQuality(item.answer);

      if (!categoryScores[category]) {
        categoryScores[category] = { total: 0, count: 0 };
      }

      categoryScores[category].total += score;
      categoryScores[category].count += 1;
    });

    Object.entries(categoryScores).forEach(([category, data]) => {
      const average = data.total / data.count;
      if (average > 85) {
        strongAreas.add(category);
      }
    });

    const scores = calculateScores(answerHistory);
    if (scores.communication > 85) strongAreas.add("Communication Skills");
    if (scores.problemSolving > 85) strongAreas.add("Problem Solving");

    const result = Array.from(strongAreas);
    return result.length > 0 ? result.slice(0, 3) : ["Keep practicing to identify strengths"];
  };

  const generateInterviewRecommendations = (answerHistory: AnswerHistory[]): string[] => {
    const recommendations: string[] = [];

    if (answerHistory.length === 0) {
      return ["Complete an interview to get personalized recommendations"];
    }

    const scores = calculateScores(answerHistory);
    const weakAreasList = identifyWeakAreas(answerHistory);

    if (scores.overall < 70) {
      recommendations.push("Focus on fundamentals before attempting advanced questions");
    }

    if (scores.technical < 70) {
      recommendations.push("Practice technical coding questions regularly");
    }

    if (scores.behavioral < 70) {
      recommendations.push("Prepare STAR method stories for behavioral questions");
    }

    if (scores.communication < 70) {
      recommendations.push("Work on clear and structured communication");
    }

    if (scores.problemSolving < 70) {
      recommendations.push("Practice explaining your thought process step-by-step");
    }

    weakAreasList.forEach(area => {
      if (area.includes('React')) {
        recommendations.push("Build small React projects to practice hooks and state management");
      } else if (area.includes('JavaScript')) {
        recommendations.push("Study JavaScript fundamentals: closures, promises, and ES6 features");
      } else if (area.includes('System Design')) {
        recommendations.push("Study common system design patterns and scalability principles");
      } else if (area.includes('Algorithms')) {
        recommendations.push("Practice algorithm problems on platforms like LeetCode");
      }
    });

    const avgWords = answerHistory.reduce((sum, item) =>
      sum + item.answer.split(/\s+/).length, 0) / answerHistory.length;

    if (avgWords < 50) {
      recommendations.push("Aim for more detailed answers (50-100 words minimum)");
    }

    if (recommendations.length === 0) {
      recommendations.push("Practice consistently to maintain your skills");
      recommendations.push("Try different question types to broaden your experience");
    }

    return recommendations.slice(0, 4);
  };

  // ============ EMOTION DETECTION ============
  const detectEmotionFromText = useCallback((text: string): any => {
    const lowerText = text.toLowerCase();
    let emotion: string = 'neutral';
    let confidence = 0.5;
    const triggers: string[] = [];

    if (text.includes('?') && text.length < 50) {
      emotion = 'confused';
      confidence = 0.7;
      triggers.push('short questioning response');
    } else if (lowerText.includes('sorry') || lowerText.includes('not sure')) {
      emotion = 'anxious';
      confidence = 0.6;
      triggers.push('apologetic language', 'uncertainty');
    } else if (lowerText.includes('excited') || lowerText.includes('love') || lowerText.includes('great')) {
      emotion = 'excited';
      confidence = 0.8;
      triggers.push('positive language');
    } else if (lowerText.includes('frustrat') || lowerText.includes('hard') || lowerText.includes('difficult')) {
      emotion = 'frustrated';
      confidence = 0.7;
      triggers.push('negative language about difficulty');
    } else if (lowerText.includes('understand') || lowerText.includes('clear') || lowerText.includes('know')) {
      emotion = 'confident';
      confidence = 0.75;
      triggers.push('certainty language');
    }

    return { emotion, confidence, triggers };
  }, []);

  const detectEmotionFromBehavior = useCallback((behavior: {
    responseTime: number;
    answerLength: number;
    edits: number;
    pauses: number;
  }): any => {
    let emotion = 'neutral';
    let confidence = 0.5;
    const triggers: string[] = [];

    if (behavior.responseTime > 60000) {
      emotion = 'anxious';
      confidence = 0.6;
      triggers.push('long response time');
    } else if (behavior.edits > 5) {
      emotion = 'frustrated';
      confidence = 0.65;
      triggers.push('many edits');
    } else if (behavior.pauses > 10) {
      emotion = 'confused';
      confidence = 0.7;
      triggers.push('frequent pauses');
    } else if (behavior.responseTime < 10000 && behavior.answerLength > 200) {
      emotion = 'confident';
      confidence = 0.8;
      triggers.push('quick, detailed response');
    }

    return { emotion, confidence, triggers };
  }, []);

  const analyzeUserEmotion = useCallback(async (answer: string, context: any) => {
    if (!userId || !answer.trim()) return;

    try {
      const emotionResult = detectEmotionFromText(answer);
      const behaviorResult = detectEmotionFromBehavior({
        responseTime: context.responseTime || 30000,
        answerLength: answer.length,
        edits: 0,
        pauses: Math.floor(answer.length / 100)
      });

      const combinedEmotion = emotionResult.confidence > behaviorResult.confidence
        ? emotionResult.emotion
        : behaviorResult.emotion;

      const intensity = Math.max(emotionResult.confidence, behaviorResult.confidence) * 10;

      setCurrentEmotion(combinedEmotion);
      setEmotionalIntensity(Math.round(intensity));

      await recordEmotionalState({
        userId,
        emotion: combinedEmotion,
        intensity: Math.round(intensity),
        triggers: [...emotionResult.triggers, ...behaviorResult.triggers],
        context: {
          interviewId,
          questionId: context.questionId,
          questionDifficulty: context.questionDifficulty || 'medium',
          timeIntoSession: context.timeIntoSession || 0,
          currentScore: context.currentScore || 0,
          previousEmotion: currentEmotion || 'neutral'
        }
      });

      if (intensity > 7 && combinedEmotion !== 'confident' && combinedEmotion !== 'calm') {
        setShowEmotionalSupport(true);
      }

    } catch (error) {
      console.error("Error analyzing emotion:", error);
    }
  }, [userId, interviewId, currentEmotion, detectEmotionFromText, detectEmotionFromBehavior, recordEmotionalState]);

  // ============ PAYMENT CHECK - READ ONLY, NO MARKING ============
  useEffect(() => {
    if (paymentCheckRan.current) {
      console.log(`⏩ [${paymentCheckId.current}] Payment check already ran, skipping`);
      return;
    }

    const checkPayment = async () => {
      paymentCheckRan.current = true;

      console.log(`🔄 [${paymentCheckId.current}] Starting ONE-TIME payment check...`);

      if (!userId) {
        console.log(`👤 [${paymentCheckId.current}] No user ID, allowing demo access`);
        setHasPaid(true);
        setPaymentChecked(true);
        return;
      }

      if (!interviewId) {
        console.log(`📝 [${paymentCheckId.current}] No interview ID, allowing access`);
        setHasPaid(true);
        setPaymentChecked(true);
        return;
      }

      try {
        console.log(`🔍 [${paymentCheckId.current}] Checking payment for:`, {
          interviewId: interviewId.substring(0, 15),
          userId: userId.substring(0, 8)
        });

        const paid = await checkPaymentStatus(interviewId, userId);
        console.log(`💰 [${paymentCheckId.current}] Payment status result:`, paid ? "PAID ✅" : "NOT PAID ❌");
        setHasPaid(paid);
        setPaymentUsed(false);
      } catch (error) {
        console.error(`❌ [${paymentCheckId.current}] Payment check error:`, error);
        setHasPaid(false);
      } finally {
        setPaymentChecked(true);
        console.log(`✅ [${paymentCheckId.current}] Payment check completed (ONE-TIME ONLY)`);
      }
    };

    checkPayment();
  }, [interviewId, userId]);

  const checkPaymentWithDetails = async () => {
    if (!interviewId || !userId) return null;

    try {
      const response = await fetch('/api/payment/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId, userId })
      });

      if (!response.ok) return null;

      const data = await response.json();
      setPaymentInfo(data);

      if (data.paymentExistsButUsed) {
        setPaymentUsed(true);
        setHasPaid(false);
      } else {
        setPaymentUsed(false);
        setHasPaid(data.hasPaid || false);
      }

      return data;
    } catch (error) {
      console.error("Detailed payment check error:", error);
      return null;
    }
  };

  // ============ MEMORY SYSTEM: CHECK FOR RESUME ============
  useEffect(() => {
    if (userId && voiceEnabled && interviewId) {
      const timer = setTimeout(() => {
        checkResumeInterview().then(data => {
          if (data.canResume &&
              !debugInfo.callStatus.startsWith('COMPLETED') &&
              data.interviewId === interviewId) {
            setShowResumeModal(true);
          }
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [userId, voiceEnabled, interviewId, checkResumeInterview, debugInfo.callStatus]);

  // ============ MEMORY SYSTEM: AUTO-SAVE PROGRESS ============
  useEffect(() => {
    const saveProgress = () => {
      if (voiceEnabled &&
          debugInfo.callStatus === 'ACTIVE' &&
          userTranscript &&
          interviewId &&
          userId) {
        saveInterviewProgress(
          interviewId,
          debugInfo.currentQuestion,
          userTranscript,
          answerHistory.map(item => ({
            questionNumber: item.questionNumber,
            question: item.question,
            answer: item.answer,
            timestamp: item.timestamp
          }))
        );
      }
    };

    if (voiceEnabled && debugInfo.callStatus === 'ACTIVE') {
      saveProgressIntervalRef.current = setInterval(saveProgress, 30000);
    }

    return () => {
      if (saveProgressIntervalRef.current) {
        clearInterval(saveProgressIntervalRef.current);
      }
    };
  }, [
    voiceEnabled,
    debugInfo.callStatus,
    debugInfo.currentQuestion,
    userTranscript,
    answerHistory,
    interviewId,
    userId,
    saveInterviewProgress
  ]);

  useEffect(() => {
    return () => {
      if (voiceEnabled &&
          debugInfo.callStatus === 'ACTIVE' &&
          userTranscript &&
          interviewId &&
          userId) {
        saveInterviewProgress(
          interviewId,
          debugInfo.currentQuestion,
          userTranscript,
          answerHistory.map(item => ({
            questionNumber: item.questionNumber,
            question: item.question,
            answer: item.answer,
            timestamp: item.timestamp
          }))
        );
      }
    };
  }, [
    voiceEnabled,
    debugInfo.callStatus,
    debugInfo.currentQuestion,
    userTranscript,
    answerHistory,
    interviewId,
    userId,
    saveInterviewProgress
  ]);

  // ============ EMOTION DETECTION INTERVAL ============
  useEffect(() => {
    const checkEmotion = () => {
      if (userTranscript && debugInfo.callStatus === 'ACTIVE' && userId) {
        const context = {
          interviewId,
          questionId: `q${debugInfo.currentQuestion}`,
          questionDifficulty: 'medium',
          timeIntoSession: 0,
          currentScore: calculateScores(answerHistory).overall,
          responseTime: 30000
        };
        analyzeUserEmotion(userTranscript, context);
      }
    };

    if (debugInfo.callStatus === 'ACTIVE' && userTranscript) {
      emotionCheckIntervalRef.current = setInterval(checkEmotion, 15000);
    }

    return () => {
      if (emotionCheckIntervalRef.current) {
        clearInterval(emotionCheckIntervalRef.current);
      }
    };
  }, [debugInfo.callStatus, userTranscript, userId, interviewId, answerHistory, analyzeUserEmotion, calculateScores]);

  // ============ VOICE SERVICE INITIALIZATION ============
  useEffect(() => {
    if (!voiceEnabled) {
      voiceServiceRef.current?.destroy();
      voiceServiceRef.current = null;
      setDebugInfo(prev => ({ ...prev, serviceStatus: "DISABLED" }));
      return;
    }

    if (questions.length === 0) {
      toast.warning("No questions available for practice");
      return;
    }

    let currentUserId = userId;
    if (!currentUserId) {
      currentUserId = localStorage.getItem('userId') || `user-${Date.now()}`;
      localStorage.setItem('userId', currentUserId);
    }

    try {
      // ============ VOICE SERVICE CREATION WITH LOUD DEBUG ============
      console.log("🔴🔴🔴 CREATING NEW VOICE SERVICE INSTANCE 🔴🔴🔴");
      console.log("   Interview ID:", interviewId || `demo-${Date.now()}`);
      console.log("   User ID:", currentUserId);
      console.log("   Questions count:", questions.length);

      voiceServiceRef.current = new VoiceService({
        interviewId: interviewId || `demo-${Date.now()}`,
        userId: currentUserId,
        type: "practice",
        speechRate: 1.0,
        speechVolume: 0.8
      });

      console.log("✅ VoiceService instance created successfully");
      console.log("   Constructor type:", voiceServiceRef.current.constructor.name);
      console.log("   Available methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(voiceServiceRef.current)));

      voiceServiceRef.current.setInterviewQuestions(questions);

      voiceServiceRef.current.onStateChange((state) => {
        if (state.transcript !== userTranscript) {
          setUserTranscript(state.transcript);
        }

        setDebugInfo(prev => ({
          ...prev,
          isListening: state.isListening,
          isSpeaking: state.isSpeaking,
          isProcessing: state.isProcessing,
          callStatus: state.isListening ? "LISTENING" :
                     state.isSpeaking ? "SPEAKING" :
                     state.isProcessing ? "PROCESSING" :
                     prev.callStatus === "STARTING" ? "ACTIVE" : prev.callStatus,
          serviceStatus: "ACTIVE"
        }));
      });

      // ============ FIXED ONUPDATE CALLBACK - REBUILDS ANSWER HISTORY ============
      voiceServiceRef.current.onUpdate((messages) => {
        const userMessages = messages.filter(m => m.role === "user");
        const assistantMessages = messages.filter(m => m.role === "assistant");

        const currentQ = Math.max(0, Math.min(assistantMessages.length, questions.length));

        if (assistantMessages.length > 0 && currentQ > 0) {
          const latestQuestion = assistantMessages[assistantMessages.length - 1].content;
          const questionText = latestQuestion.replace(`Question ${currentQ}: `, '');
          setCurrentQuestionText(questionText);

          if (!questionStartTimes[currentQ]) {
            setQuestionStartTimes(prev => ({
              ...prev,
              [currentQ]: Date.now()
            }));
          }
        }

        // 🔥 FIXED: ALWAYS rebuild answer history from messages
        const newAnswerHistory: AnswerHistory[] = [];

        for (let i = 0; i < userMessages.length; i++) {
          const msg = userMessages[i];
          const questionMsg = assistantMessages[i];

          if (questionMsg) {
            const questionNumber = i + 1;
            let questionText = questionMsg.content;

            // Clean up question text
            questionText = questionText.replace(`Question ${questionNumber}: `, '');
            questionText = questionText.replace(`Question ${questionNumber}. `, '');

            newAnswerHistory.push({
              question: questionText,
              answer: msg.content,
              questionNumber: questionNumber,
              timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })
            });
          }
        }

        // Log for debugging
        console.log("📊 onUpdate - Building answer history:", {
          userMessages: userMessages.length,
          assistantMessages: assistantMessages.length,
          newAnswerHistory: newAnswerHistory.length,
          currentQ
        });

        // 🔴🔴🔴 ADDED: Detailed answer history debug
        console.log("🔴🔴🔴 ANSWER HISTORY DETAILS:", {
          newAnswerHistoryLength: newAnswerHistory.length,
          userMessagesLength: userMessages.length,
          assistantMessagesLength: assistantMessages.length,
          firstQuestion: newAnswerHistory[0]?.question || 'none',
          firstAnswer: newAnswerHistory[0]?.answer?.substring(0, 30) || 'none',
          allQuestions: newAnswerHistory.map(a => a.questionNumber)
        });

        // Update state with complete answer history
        if (newAnswerHistory.length > 0) {
          setAnswerHistory(newAnswerHistory);
          // 🔥 FIX: Also update the ref to persist answers
          answersRef.current = newAnswerHistory;
          console.log("✅ Answer history updated:", newAnswerHistory.length, "answers");
          console.log("   Current answerHistory state after update:", newAnswerHistory.length);
          console.log("   Answers ref now has:", answersRef.current.length, "answers");
        } else {
          console.warn("⚠️ No answers in newAnswerHistory despite having", userMessages.length, "user messages");
        }

        setDebugInfo(prev => ({
          ...prev,
          messages: messages.length,
          collectedAnswers: userMessages.length,
          currentQuestion: currentQ
        }));

        if (userId && userMessages.length > 0) {
          const latestAnswer = userMessages[userMessages.length - 1];
          const context = {
            interviewId,
            questionId: `q${currentQ}`,
            questionDifficulty: 'medium',
            timeIntoSession: 0,
            currentScore: calculateScores(newAnswerHistory).overall,
            responseTime: 30000
          };
          analyzeUserEmotion(latestAnswer.content, context);
        }
      });

      // ============ FIXED ONCOMPLETE CALLBACK WITH ANSWER REF ============
      voiceServiceRef.current.onComplete((data) => {
        console.log("🎉🎉🎉 VOICE SERVICE ONCOMPLETE FIRED! 🎉🎉🎉");
        console.log("📦 Completion data:", data);
        console.log("🔴🔴🔴 ANSWER HISTORY REF AT COMPLETION:", {
          length: answersRef.current.length,
          answers: answersRef.current
        });

        // 🔥 FIX: Use ref instead of state - this NEVER gets cleared
        const capturedAnswers = [...answersRef.current];
        console.log("📝 Captured answers for feedback:", capturedAnswers.length);

        setIsLoading(false);

        setDebugInfo(prev => ({
          ...prev,
          callStatus: "COMPLETED",
          currentQuestion: questions.length,
          collectedAnswers: data.answersGiven || 0,
          serviceStatus: "COMPLETED"
        }));

        // Pass both data and captured answers
        handleInterviewCompletion(data, capturedAnswers);
      });

      setDebugInfo(prev => ({ ...prev, serviceStatus: "READY" }));
      toast.success("🎤 Voice service ready! Click 'Start Practice'.");

    } catch (error: any) {
      console.error("❌ Failed to initialize VoiceService:", error);
      toast.error("Failed to initialize voice service: " + error.message);
      setDebugInfo(prev => ({ ...prev, serviceStatus: "ERROR" }));
    }

    return () => {
      voiceServiceRef.current?.destroy();
    };
  }, [voiceEnabled, interviewId, userId, questions]);

  // ============ HELPER FUNCTIONS ============
  const autoScrollTranscript = () => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    autoScrollTranscript();
  }, [userTranscript, answerHistory]);

  useEffect(() => {
    return () => {
      voiceServiceRef.current?.destroy();
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
      if (saveProgressIntervalRef.current) {
        clearInterval(saveProgressIntervalRef.current);
      }
      if (questionTimerRef.current) {
        clearTimeout(questionTimerRef.current);
      }
      if (emotionCheckIntervalRef.current) {
        clearInterval(emotionCheckIntervalRef.current);
      }
    };
  }, []);

  // ============ FIXED FEEDBACK API CALL WITH FEEDBACK ID CAPTURE ============
  const callFeedbackAPI = async (interviewId: string, userId: string, answers: AnswerHistory[]) => {
    if (!interviewId || !userId || answers.length === 0) {
      console.log("⚠️ Cannot call feedback API - missing data");
      return false;
    }

    try {
      // 🔥 FIX: Format answers to match what the API expects
      const formattedTranscript = answers.flatMap(a => [
        { role: "assistant", content: `Question ${a.questionNumber}: ${a.question}` },
        { role: "user", content: a.answer }
      ]);

      console.log("📤 Calling feedback API with", answers.length, "answers");
      console.log("📤 Formatted transcript:", formattedTranscript);

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          userId,
          transcript: formattedTranscript // 🔥 Send formatted version
        })
      });

      if (!response.ok) {
        throw new Error(`Feedback API returned ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Feedback API called successfully:", data);

      // 🔥 NEW: Store the feedbackId for redirect
      if (data.feedbackId) {
        localStorage.setItem('lastFeedbackId', data.feedbackId);
        console.log("💾 Stored feedbackId in localStorage:", data.feedbackId);
      }

      return data.feedbackId;
    } catch (error) {
      console.error("❌ Feedback API call failed:", error);
      return false;
    }
  };

  // ============ INTERVIEW COMPLETION HANDLER - WITH FIXED REDIRECT ============
  const handleInterviewCompletion = async (data: any, capturedAnswers?: AnswerHistory[]) => {
    // Use captured answers if provided, otherwise fall back to state
    const answersToUse = capturedAnswers || answerHistory;

    console.log("🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥");
    console.log("🔥 handleInterviewCompletion FIRED! 🔥");
    console.log("🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥");
    console.log("📊 Data:", {
      hasAnswers: answersToUse.length,
      interviewId,
      userId,
      dataInterviewId: data?.interviewId,
      dataUserId: data?.userId
    });

    console.log("🔍 FEEDBACK CONDITION CHECK:", {
      userId: !!userId,
      interviewIdExists: !!(data.interviewId || interviewId),
      hasAnswers: answersToUse.length > 0,
      answerCount: answersToUse.length,
      dataInterviewId: data?.interviewId,
      propInterviewId: interviewId,
      willCallAPI: !!(userId && (data.interviewId || interviewId) && answersToUse.length > 0)
    });

    console.log("🎉 Interview completion data received:", data);
    console.log("📝 Answer history (captured):", answersToUse);

    try {
      const scores = calculateScores(answersToUse);
      const weakAreasList = identifyWeakAreas(answersToUse);
      const strongAreasList = identifyStrongAreas(answersToUse);
      const recommendations = generateInterviewRecommendations(answersToUse);

      const questionPerformance = answersToUse.map((item, index) => {
        const startTime = questionStartTimes[item.questionNumber] || Date.now() - 60000;
        const timeSpent = Math.round((Date.now() - startTime) / 1000);

        return {
          questionId: `q${index + 1}`,
          category: categorizeQuestion(item.question),
          difficulty: "medium",
          score: evaluateAnswerQuality(item.answer),
          timeSpent: timeSpent,
          hadDifficulty: evaluateAnswerQuality(item.answer) < 70,
          neededHint: false
        };
      });

      const performanceData = {
        interviewId: data.interviewId || interviewId || `interview_${Date.now()}`,
        userId: userId,
        scores: scores,
        questionPerformance: questionPerformance,
        weakAreas: weakAreasList,
        strongAreas: strongAreasList,
        emotionalState: {
          finalEmotion: currentEmotion || 'neutral',
          emotionalIntensity: emotionalIntensity,
          emotionalStability: emotionalIntensity < 7 ? 'stable' : 'volatile'
        },
        aiFeedback: {
          strengths: ["Good communication", "Clear explanations"],
          improvements: ["Add more technical detail", "Include specific examples"],
          sentiment: "positive"
        },
        recommendations: recommendations,
        metadata: {
          totalQuestions: questions.length,
          answeredQuestions: answersToUse.length,
          completionRate: Math.round((answersToUse.length / questions.length) * 100),
          interviewType: "practice",
          timestamp: new Date().toISOString()
        }
      };

      if (userId) {
        console.log("💾 Saving performance data...");
        const saved = await saveUserPerformance(performanceData);
        if (saved) {
          console.log("✅ Performance data saved");
          setPerformanceSaved(true);
          setTimeout(() => {
            setShowPerformanceAnalysis(true);
          }, 2000);
        } else {
          console.log("⚠️ Failed to save performance data");
        }
      }

      let feedbackId = null;
      if (userId && (data.interviewId || interviewId) && answersToUse.length > 0) {
        console.log("🤖🤖🤖 CALLING FEEDBACK API WITH ANSWERS! 🤖🤖🤖");
        console.log("📤 Sending:", {
          interviewId: data.interviewId || interviewId,
          userId,
          answerCount: answersToUse.length
        });

        feedbackId = await callFeedbackAPI(
          data.interviewId || interviewId,
          userId,
          answersToUse
        );
        setFeedbackCalled(true);
      } else {
        console.log("❌❌❌ FEEDBACK CONDITION FAILED - NOT CALLING API ❌❌❌");
        console.log("🔍 Failure reasons:", {
          noUserId: !userId,
          noInterviewId: !(data.interviewId || interviewId),
          noAnswers: answersToUse.length === 0
        });
      }

      if (userId && (data.interviewId || interviewId)) {
        await markInterviewCompleted(data.interviewId || interviewId);
      }

    } catch (error) {
      console.error("❌ Error in performance analysis:", error);
    }

    const completionData = {
      interviewId: data.interviewId || interviewId,
      timestamp: new Date().toISOString(),
      totalQuestions: data.questionsAsked || questions.length,
      answeredQuestions: data.answersGiven || 0,
      userId: data.userId || userId || debugInfo.userId,
      feedbackId: data.feedbackId,
      success: data.success,
      fallback: data.fallback
    };

    localStorage.setItem('interviewCompletion', JSON.stringify(completionData));
    console.log("💾 Saved to localStorage:", completionData);

    toast.success("✅ Interview completed! Redirecting to feedback...");

    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
    }

    // 🔥 FIXED REDIRECT - Always use interview ID
    redirectTimerRef.current = setTimeout(() => {
      const targetInterviewId = data.interviewId || interviewId;

      if (targetInterviewId) {
        console.log("🚀 Redirecting to feedback page for interview:", targetInterviewId);
        window.location.href = `/interview/${targetInterviewId}/feedback`;
      } else {
        console.error("No interview ID available for redirect");
        window.location.href = '/';
      }
    }, 5000);
  };

  // ============ RESUME FUNCTIONALITY ============
  const handleResumeInterview = async () => {
    if (!resumeData.canResume || !userId) {
      toast.error("Cannot resume interview");
      return;
    }

    setShowResumeModal(false);

    if (resumeData.partialAnswer) {
      setUserTranscript(resumeData.partialAnswer);
    }

    if (resumeData.answerHistory) {
      const history = resumeData.answerHistory.map((item: any) => ({
        question: item.question,
        answer: item.answer,
        questionNumber: item.questionNumber,
        timestamp: item.timestamp
      }));
      setAnswerHistory(history);
      answersRef.current = history; // 🔥 Also update ref on resume
    }

    if (resumeData.currentQuestion) {
      setDebugInfo(prev => ({
        ...prev,
        currentQuestion: resumeData.currentQuestion || 0,
        collectedAnswers: resumeData.answerHistory?.length || 0
      }));
    }

    toast.success(`✅ Resumed from question ${resumeData.currentQuestion || 1}`);

    if (voiceServiceRef.current && questions.length > 0) {
      try {
        setIsLoading(true);
        await voiceServiceRef.current.startInterview();
        setDebugInfo(prev => ({ ...prev, callStatus: "ACTIVE" }));
        toast.success("🎤 Interview resumed! Continue where you left off.");
      } catch (error: any) {
        console.error("❌ Failed to resume interview:", error);
        toast.error("Failed to resume: " + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleStartNewInterview = () => {
    setShowResumeModal(false);
    if (interviewId && userId) {
      localStorage.removeItem(`resume_interview_${userId}`);
    }
    toast.info("Starting new interview");
  };

  // ============ INTERVIEW CONTROL FUNCTIONS ============
  const startVoiceInterview = async () => {
    if (interviewId && userId) {
      if (paymentUsed) {
        console.log("💳 Payment already used, requiring new payment");
        toast.info("💳 Previous payment used. New payment required for this attempt.");
        setShowPaymentModal(true);
        return;
      }

      if (!hasPaid) {
        console.log("💳 No payment found, showing modal");
        toast.info("💳 Payment required to start interview");
        setShowPaymentModal(true);
        return;
      }
    }

    if (!voiceServiceRef.current) {
      toast.error("Voice service not ready. Please enable voice first.");
      return;
    }

    if (questions.length === 0) {
      toast.error("No questions available");
      return;
    }

    if (!showResumeModal) {
      setAnswerHistory([]);
      answersRef.current = []; // 🔥 Clear ref on new interview
      setUserTranscript("");
      setCurrentQuestionText("");
      setQuestionStartTimes({});
      setPerformanceSaved(false);
      setCurrentEmotion(null);
      setEmotionalIntensity(5);
      setFeedbackCalled(false);
    }

    setIsLoading(true);
    setDebugInfo(prev => ({
      ...prev,
      callStatus: "STARTING",
      currentQuestion: resumeData.currentQuestion || 0,
      collectedAnswers: resumeData.answerHistory?.length || 0
    }));

    try {
      await voiceServiceRef.current.startInterview();
      setDebugInfo(prev => ({ ...prev, callStatus: "ACTIVE" }));
      toast.success("🎤 Interview started! Speak your answers clearly.");
    } catch (error: any) {
      console.error("❌ Failed to start interview:", error);
      toast.error("Failed to start: " + error.message);
      setDebugInfo(prev => ({ ...prev, callStatus: "ERROR" }));
      setIsLoading(false);
    }
  };

  const stopInterview = () => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.stop();
      setIsLoading(false);
      setDebugInfo(prev => ({
        ...prev,
        callStatus: "STOPPED",
        isListening: false,
        isSpeaking: false
      }));
      toast.info("🛑 Interview stopped");
    }
  };

  const submitAnswer = async () => {
    if (voiceServiceRef.current) {
      try {
        await voiceServiceRef.current.submitAnswer();
      } catch (error) {
        console.error("❌ Failed to submit answer:", error);
        toast.error("Failed to submit answer");
      }
    } else {
      toast.error("Submit function not available");
    }
  };

  const skipQuestion = async () => {
    if (voiceServiceRef.current) {
      try {
        await voiceServiceRef.current.skipQuestion();
      } catch (error) {
        console.error("❌ Failed to skip question:", error);
        toast.error("Failed to skip question");
      }
    } else {
      toast.error("Skip function not available");
    }
  };

  const handleVoiceToggle = (enabled: boolean) => {
    setVoiceEnabled(enabled);
    if (enabled) {
      toast.success("Voice mode activated!");
      setDebugInfo(prev => ({
        ...prev,
        callStatus: "READY",
        serviceStatus: "INITIALIZING"
      }));
    } else {
      toast.info("Voice mode disabled");
      setDebugInfo(prev => ({
        ...prev,
        callStatus: "INACTIVE",
        isListening: false,
        isSpeaking: false,
        serviceStatus: "DISABLED"
      }));
    }
  };

  // ============ UI RENDER ============
  const displayName = userName || "User";
  const userAltText = `${displayName}'s profile picture`;
  const aiAltText = "AI Interviewer avatar";

  const isStartButtonDisabled =
    isLoading ||
    !voiceEnabled ||
    debugInfo.callStatus === "COMPLETED" ||
    questions.length === 0 ||
    !paymentChecked ||
    (interviewId && userId && !hasPaid) ||
    (interviewId && userId && paymentUsed);

  const getStartButtonText = () => {
    if (isLoading) return "Starting...";
    if (debugInfo.callStatus === "COMPLETED") return "✅ Completed";
    if (questions.length === 0) return "No Questions";
    if (!paymentChecked) return "Checking...";
    if (paymentUsed) return "Payment Used - Pay Again";
    if (interviewId && userId && !hasPaid) return "Pay KES 3 to Start";
    return "Start Practice";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-4">
          <Image
            src={profileImage || "/beautiful-avatar.png"}
            alt={userAltText}
            width={40}
            height={40}
            className="rounded-full object-cover size-10"
          />
          <div>
            <h4 className="font-semibold">{displayName}</h4>
            <p className="text-sm text-gray-500">Interview Practice</p>
            <p className="text-xs text-gray-400">ID: {debugInfo.userId.substring(0, 8)}...</p>

            {resumeData.canResume && (
              <div className="mt-1">
                <span className="text-xs text-blue-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  Resume available
                </span>
              </div>
            )}

            {performanceHistory && performanceHistory.length > 0 && (
              <div className="mt-1">
                <span className="text-xs text-purple-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  {performanceHistory.length} interviews analyzed
                </span>
              </div>
            )}

            {currentEmotion && (
              <div className="mt-1">
                <span className="text-xs flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${
                    currentEmotion === 'confident' ? 'bg-green-500' :
                    currentEmotion === 'anxious' ? 'bg-red-500' :
                    currentEmotion === 'calm' ? 'bg-blue-500' :
                    'bg-yellow-500'
                  }`}></span>
                  <span className={
                    currentEmotion === 'confident' ? 'text-green-600' :
                    currentEmotion === 'anxious' ? 'text-red-600' :
                    currentEmotion === 'calm' ? 'text-blue-600' :
                    'text-yellow-600'
                  }>
                    {currentEmotion.charAt(0).toUpperCase() + currentEmotion.slice(1)}
                  </span>
                </span>
              </div>
            )}

            {interviewId && userId && (
              <div className="mt-1">
                {!paymentChecked ? (
                  <span className="text-xs text-yellow-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                    Checking payment...
                  </span>
                ) : paymentUsed ? (
                  <span className="text-xs text-amber-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                    🔒 Payment used - New payment required
                  </span>
                ) : hasPaid ? (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    ✅ Paid - Ready to start
                  </span>
                ) : (
                  <span className="text-xs text-amber-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                    🔒 Payment required (KES 3)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {currentEmotion && emotionalIntensity > 6 && (
            <button
              onClick={() => setShowEmotionalSupport(!showEmotionalSupport)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                showEmotionalSupport
                  ? 'bg-pink-500 text-white'
                  : 'bg-gradient-to-r from-pink-400 to-rose-400 text-white hover:from-pink-500 hover:to-rose-500'
              } shadow-md hover:shadow-lg`}
            >
              <Heart className="w-4 h-4" />
              Support
            </button>
          )}

          {performanceHistory && performanceHistory.length > 0 && (
            <button
              onClick={() => setShowPerformanceAnalysis(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <BarChart3 className="w-4 h-4" />
              Performance
            </button>
          )}

          <button
            onClick={startVoiceInterview}
            disabled={isStartButtonDisabled}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              !isStartButtonDisabled
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            } ${isLoading ? 'animate-pulse' : ''}`}
          >
            <span className="flex items-center gap-2">
              {isLoading && <span className="animate-spin">⏳</span>}
              {getStartButtonText()}
            </span>
          </button>
        </div>
      </div>

      {/* Emotional Support Panel */}
      {showEmotionalSupport && userId && (
        <div className="animate-fade-in">
          <EmotionalSupport
            userId={userId}
            currentEmotion={currentEmotion}
            emotionIntensity={emotionalIntensity}
          />
        </div>
      )}

      {/* Voice Toggle */}
      <div className="border border-gray-300 rounded-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold">Voice Practice</h4>
          <span className={`text-sm font-medium px-2 py-1 rounded ${
            debugInfo.callStatus === "COMPLETED" ? 'bg-green-100 text-green-800' :
            debugInfo.callStatus === "ACTIVE" ? 'bg-blue-100 text-blue-800' :
            debugInfo.callStatus === "LISTENING" ? 'bg-yellow-100 text-yellow-800' :
            debugInfo.callStatus === "SPEAKING" ? 'bg-purple-100 text-purple-800' :
            debugInfo.callStatus === "STARTING" ? 'bg-orange-100 text-orange-800' :
            debugInfo.callStatus === "STOPPED" ? 'bg-gray-100 text-gray-800' :
            debugInfo.callStatus === "ERROR" ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {debugInfo.callStatus}
          </span>
        </div>

        <VoiceToggle
          onVoiceToggle={handleVoiceToggle}
          initialEnabled={voiceEnabled}
        />

        <div className="mt-4 text-sm text-gray-600 space-y-1">
          <p>• Speak your answer after each question</p>
          <p>• Click "Submit Answer" to move forward</p>
          <p>• Your answers are saved below</p>

          {voiceEnabled && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-blue-700">
              <p className="font-medium">💾 Auto-save Enabled</p>
              <p className="text-xs">Progress saved every 30 seconds. You can resume if interrupted.</p>
            </div>
          )}

          <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded text-purple-700">
            <p className="font-medium">📊 Performance Tracking</p>
            <p className="text-xs">Your answers are analyzed to identify strengths and weak areas</p>
          </div>

          <div className="mt-3 p-2 bg-pink-50 border border-pink-200 rounded text-pink-700">
            <p className="font-medium">😊 Emotional Awareness</p>
            <p className="text-xs">Your emotional state is monitored for personalized support</p>
          </div>

          {interviewId && userId && (
            <div className="mt-3 p-2 rounded text-sm">
              {paymentUsed ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 p-2 rounded">
                  <p className="font-medium">💳 Payment Used</p>
                  <p className="text-xs">Previous payment consumed. Pay KES 3 for this attempt.</p>
                </div>
              ) : !hasPaid && paymentChecked ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 p-2 rounded">
                  <p className="font-medium">💳 Payment Required</p>
                  <p className="text-xs">Pay KES 3 with MPESA to unlock this interview</p>
                  <p className="text-xs mt-1 font-medium">💰 KES 3 per attempt - each retake requires new payment</p>
                </div>
              ) : hasPaid ? (
                <div className="bg-green-50 border border-green-200 text-green-700 p-2 rounded">
                  <p className="font-medium">✅ Payment Verified</p>
                  <p className="text-xs">KES 3 payment ready for this interview attempt</p>
                  <p className="text-xs mt-1">Payment will be consumed when you start</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Current Question Display */}
      {debugInfo.currentQuestion > 0 && currentQuestionText && (
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {debugInfo.currentQuestion}
            </div>
            <h4 className="font-bold text-blue-800">Current Question</h4>
            <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {categorizeQuestion(currentQuestionText)}
            </span>
          </div>
          <p className="text-blue-900">{currentQuestionText}</p>
          {debugInfo.isListening && (
            <div className="mt-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-red-600">🎤 Listening...</span>
            </div>
          )}
        </div>
      )}

      {/* Real-time Transcript Display */}
      {debugInfo.isListening && (
        <div className="border border-green-200 bg-green-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center">
                <span className="text-sm">🎤</span>
              </div>
              <h4 className="font-bold text-green-800">Live Transcription</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                {userTranscript.length} chars
              </span>
              <button
                onClick={() => setUserTranscript("")}
                className="text-sm text-green-600 hover:text-green-800 hover:bg-green-100 px-2 py-1 rounded"
              >
                Clear
              </button>
            </div>
          </div>

          <div
            ref={transcriptRef}
            className="min-h-[100px] max-h-[200px] overflow-y-auto bg-white border border-green-100 rounded-lg p-3"
          >
            {userTranscript ? (
              <p className="text-gray-800 leading-relaxed">{userTranscript}</p>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <span className="text-2xl mb-2">🎤</span>
                <p>Start speaking to see your words here...</p>
                <p className="text-xs mt-1">Your speech will appear in real-time</p>
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-xs text-gray-500">Words</div>
              <div className="font-bold text-gray-700">
                {userTranscript.split(/\s+/).filter(w => w.length > 0).length}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Characters</div>
              <div className="font-bold text-gray-700">
                {userTranscript.length}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Status</div>
              <div className={`font-bold ${debugInfo.isListening ? 'text-green-600' : 'text-gray-600'}`}>
                {debugInfo.isListening ? 'Listening' : 'Idle'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Answer History */}
      {answerHistory.length > 0 && (
        <div className="border border-purple-200 bg-purple-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center">
              <span className="text-sm">📝</span>
            </div>
            <h4 className="font-bold text-purple-800">Your Answers</h4>
            <span className="ml-auto text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">
              {answerHistory.length} answered
            </span>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {answerHistory.map((item, index) => {
              const score = evaluateAnswerQuality(item.answer);
              const category = categorizeQuestion(item.question);

              return (
                <div key={index} className="bg-white border border-purple-100 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {item.questionNumber}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-purple-800">Question {item.questionNumber}</h5>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {item.timestamp}
                          </span>
                          <div className={`text-xs px-2 py-1 rounded ${
                            score >= 85 ? 'bg-green-100 text-green-700' :
                            score >= 70 ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {score}%
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm mb-3">{item.question}</p>
                      <div className="border-t pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                            score >= 70 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {score >= 70 ? '✓' : '!'}
                          </div>
                          <h6 className="font-semibold text-green-700">Your Answer</h6>
                        </div>
                        <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                          <p className="text-gray-800 whitespace-pre-wrap">{item.answer}</p>
                          <div className="mt-2 text-xs text-gray-500 flex justify-between">
                            <span>{item.answer.length} characters</span>
                            <span>{item.answer.split(/\s+/).filter(w => w.length > 0).length} words</span>
                            <span>Score: {score}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status Panel */}
      <div className="border border-gray-300 rounded-xl p-4">
        <h4 className="font-bold text-lg mb-4">📊 Interview Status</h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Questions</div>
            <div className="font-bold text-gray-800">
              {debugInfo.currentQuestion}/{debugInfo.totalQuestions}
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Answers</div>
            <div className="font-bold text-gray-800">
              {debugInfo.collectedAnswers}
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Voice</div>
            <div className={`font-bold ${voiceEnabled ? 'text-green-600' : 'text-red-600'}`}>
              {voiceEnabled ? "ON" : "OFF"}
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Payment</div>
            <div className={`font-bold ${
              paymentUsed ? 'text-amber-600' :
              hasPaid ? 'text-green-600' :
              'text-red-600'
            }`}>
              {paymentUsed ? "Used" : hasPaid ? "Paid" : "Required"}
            </div>
          </div>
        </div>

        {answerHistory.length > 0 && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-blue-800 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Performance Preview
              </h4>
              <button
                onClick={() => setShowPerformanceAnalysis(true)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                View Details →
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <div className="text-xs text-gray-500">Avg Score</div>
                <div className="font-bold text-blue-700">
                  {Math.round(answerHistory.reduce((sum, item) => sum + evaluateAnswerQuality(item.answer), 0) / answerHistory.length)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Weak Areas</div>
                <div className="font-bold text-amber-600">
                  {identifyWeakAreas(answerHistory).length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Strong Areas</div>
                <div className="font-bold text-green-600">
                  {identifyStrongAreas(answerHistory).length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Words Avg</div>
                <div className="font-bold text-gray-700">
                  {Math.round(answerHistory.reduce((sum, item) => sum + item.answer.split(/\s+/).length, 0) / answerHistory.length)}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentEmotion && (
          <div className="mb-4 p-3 bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-pink-800 text-sm flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Emotional State
              </h4>
              <span className={`text-xs px-2 py-1 rounded-full ${
                currentEmotion === 'confident' ? 'bg-green-100 text-green-700' :
                currentEmotion === 'anxious' ? 'bg-red-100 text-red-700' :
                currentEmotion === 'calm' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {currentEmotion.charAt(0).toUpperCase() + currentEmotion.slice(1)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Intensity</span>
                  <span className="text-xs font-bold">{emotionalIntensity}/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      emotionalIntensity < 4 ? 'bg-green-500' :
                      emotionalIntensity < 7 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${emotionalIntensity * 10}%` }}
                  ></div>
                </div>
              </div>
              <button
                onClick={() => setShowEmotionalSupport(true)}
                className="text-xs text-pink-600 hover:text-pink-800 hover:bg-pink-50 px-2 py-1 rounded"
              >
                Get Support
              </button>
            </div>
          </div>
        )}

        {questions.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-bold text-gray-800">
                {Math.round((debugInfo.currentQuestion / debugInfo.totalQuestions) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (debugInfo.currentQuestion / debugInfo.totalQuestions) * 100)}%`
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Question {debugInfo.currentQuestion} of {debugInfo.totalQuestions}</span>
              <span>{debugInfo.collectedAnswers} answered</span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={startVoiceInterview}
            disabled={isStartButtonDisabled}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              !isStartButtonDisabled
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <span>🎤</span>
            {getStartButtonText()}
          </button>

          {(debugInfo.callStatus === "ACTIVE" || debugInfo.callStatus === "LISTENING" || debugInfo.callStatus === "SPEAKING") && (
            <button
              onClick={stopInterview}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <span>🛑</span>
              Stop
            </button>
          )}

          {resumeData.canResume && !showResumeModal && debugInfo.callStatus === "INACTIVE" && (
            <button
              onClick={() => setShowResumeModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <span>⏯️</span>
              Resume
            </button>
          )}

          {currentEmotion && emotionalIntensity > 6 && (
            <button
              onClick={() => setShowEmotionalSupport(!showEmotionalSupport)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                showEmotionalSupport
                  ? 'bg-pink-500 text-white'
                  : 'bg-gradient-to-r from-pink-400 to-rose-400 text-white hover:from-pink-500 hover:to-rose-500'
              } shadow-md hover:shadow-lg`}
            >
              <Heart className="w-4 h-4" />
              Support
            </button>
          )}

          {performanceHistory && performanceHistory.length > 0 && (
            <button
              onClick={() => setShowPerformanceAnalysis(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <BarChart3 className="w-4 h-4" />
              Performance
            </button>
          )}

          {(debugInfo.callStatus === "ACTIVE" || debugInfo.callStatus === "LISTENING") && (
            <>
              <button
                onClick={submitAnswer}
                disabled={!userTranscript.trim()}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  userTranscript.trim()
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span>✅</span>
                Submit Answer
              </button>

              <button
                onClick={skipQuestion}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <span>⏭️</span>
                Skip Question
              </button>
            </>
          )}

          {interviewId && userId && paymentChecked && (paymentUsed || !hasPaid) && (
            <button
              onClick={() => {
                if (!interviewId || !userId) {
                  toast.error("Cannot process payment: Missing information");
                  return;
                }
                setShowPaymentModal(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <span>💳</span>
              {paymentUsed ? "Pay Again KES 3" : "Pay KES 3"}
            </button>
          )}
        </div>

        {debugInfo.callStatus === "COMPLETED" && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-green-800">✅ Interview Completed!</h4>
                <p className="text-green-700 text-sm">
                  {performanceSaved ? "Performance data saved!" : "Saving performance data..."}
                </p>
                <p className="text-green-600 text-xs mt-1">
                  {feedbackCalled ? "Feedback generated!" : "Generating feedback..."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {performanceSaved ? (
                  <button
                    onClick={() => setShowPerformanceAnalysis(true)}
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                  >
                    View Analysis
                  </button>
                ) : (
                  <div className="animate-pulse">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {interviewId && userId && (
          <div className="mt-4 p-3 rounded-lg border">
            {paymentUsed ? (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded">
                <h4 className="font-medium text-amber-800 text-sm">💳 Payment Status: Used</h4>
                <p className="text-amber-700 text-xs">
                  Previous payment consumed for interview attempt
                </p>
                <p className="text-amber-600 text-xs mt-1">
                  Pay KES 3 for new attempt
                </p>
              </div>
            ) : hasPaid ? (
              <div className="bg-green-50 border border-green-200 p-3 rounded">
                <h4 className="font-medium text-green-800 text-sm">✅ Payment Status: Ready</h4>
                <p className="text-green-700 text-xs">
                  KES 3 payment verified and ready for use
                </p>
                <p className="text-green-600 text-xs mt-1">
                  Payment will be consumed when interview starts
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                <h4 className="font-medium text-blue-800 text-sm">🔒 Payment Required</h4>
                <p className="text-blue-700 text-xs">
                  KES 3 per interview attempt
                </p>
                <p className="text-blue-600 text-xs mt-1">
                  Each retake requires new payment
                </p>
              </div>
            )}
          </div>
        )}

        {voiceEnabled && debugInfo.callStatus === "ACTIVE" && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-800 text-sm">💾 Auto-save Active</h4>
                <p className="text-blue-700 text-xs">
                  Progress saved every 30 seconds. You can resume if interrupted.
                </p>
              </div>
              <div className="animate-pulse">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </div>
        )}

        {answerHistory.length > 0 && (
          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-purple-800 text-sm">📊 Performance Tracking</h4>
                <p className="text-purple-700 text-xs">
                  Your answers are being analyzed for strengths and improvements
                </p>
              </div>
              <div className="animate-pulse">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              </div>
            </div>
          </div>
        )}

        {currentEmotion && (
          <div className="mt-4 p-3 bg-pink-50 border border-pink-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-pink-800 text-sm">😊 Emotional Tracking</h4>
                <p className="text-pink-700 text-xs">
                  Your emotional state is being monitored for personalized support
                </p>
              </div>
              <div className="animate-pulse">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Interviewer */}
      <div className="border border-gray-300 rounded-xl p-4">
        <div className="flex flex-row items-center gap-4">
          <Image
            src="/interview-panel.jpg"
            alt={aiAltText}
            width={40}
            height={40}
            className="rounded-full object-cover size-10"
          />
          <div className="flex-1">
            <h4 className="font-semibold">AI Interviewer</h4>
            <p className="text-gray-600">
              {debugInfo.callStatus === "COMPLETED"
                ? "Interview completed!"
                : debugInfo.currentQuestion > 0
                ? `Question ${debugInfo.currentQuestion} of ${debugInfo.totalQuestions}`
                : `Ready with ${debugInfo.totalQuestions} questions`
              }
            </p>
            {debugInfo.isListening && (
              <p className="text-sm text-blue-600 mt-1 animate-pulse">
                🎤 I'm listening to your answer...
              </p>
            )}
            {debugInfo.isSpeaking && (
              <p className="text-sm text-purple-600 mt-1 animate-pulse">
                🔊 Asking question...
              </p>
            )}
            {debugInfo.callStatus === "ACTIVE" && !debugInfo.isListening && !debugInfo.isSpeaking && (
              <p className="text-sm text-green-600 mt-1">
                ⏳ Ready for your answer
              </p>
            )}
            {resumeData.canResume && !showResumeModal && (
              <p className="text-sm text-blue-600 mt-1">
                ⏯️ You can resume from question {resumeData.currentQuestion}
              </p>
            )}
            {performanceHistory && performanceHistory.length > 0 && (
              <p className="text-sm text-purple-600 mt-1">
                📊 You have {performanceHistory.length} previous interviews analyzed
              </p>
            )}
            {currentEmotion && emotionalIntensity > 6 && (
              <p className="text-sm text-pink-600 mt-1">
                😊 I notice you're feeling {currentEmotion}. Click "Support" for help.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Resume Interview Modal */}
      {showResumeModal && resumeData.canResume && (
        <ResumeInterviewModal
          isOpen={showResumeModal}
          onClose={() => setShowResumeModal(false)}
          onResume={handleResumeInterview}
          onStartNew={handleStartNewInterview}
          resumeData={resumeData}
        />
      )}

      {/* MPESA Payment Modal - SINGLE SOURCE OF TRUTH */}
      <MPESAPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setShowPaymentModal(false);
          setHasPaid(true);
          setPaymentUsed(false);
          toast.success("✅ Payment confirmed! Starting interview...");
          setTimeout(() => {
            startVoiceInterview();
          }, 1500);
        }}
        cost={3}
        interviewId={interviewId || ""}
        userId={userId || ""}
      />

      {/* Performance Analysis Modal */}
      {showPerformanceAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-auto">
            <PerformanceAnalysis
              userId={userId}
              interviewId={interviewId}
              onClose={() => setShowPerformanceAnalysis(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Agent;