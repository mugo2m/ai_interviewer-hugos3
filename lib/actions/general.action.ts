// app/api/feedback/route.ts or lib/feedback/createFeedback.ts
"use server";

import { db } from "@/firebase/admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { feedbackSchema } from "@/constants";

let genAI: GoogleGenerativeAI | null = null;
try {
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  }
} catch (error) {
  console.log("⚠️ Gemini AI initialization skipped");
}

function cleanGeminiJson(text: string) {
  if (!text) return "{}";
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
}

// FIXED: Build Q&A pairs from both message format and answerHistory format
function buildSchemedTranscript(transcript: any[]) {
  const pairs: { question: string; answer: string }[] = [];

  // If transcript is array of messages with role/content
  if (Array.isArray(transcript)) {
    for (let i = 0; i < transcript.length; i++) {
      if (transcript[i]?.role === "assistant" && transcript[i + 1]?.role === "user") {
        pairs.push({
          question: transcript[i].content,
          answer: transcript[i + 1].content
        });
        i++;
      }
    }
  }

  // If no pairs found, check if transcript contains answerHistory
  if (pairs.length === 0 && transcript[0]?.answerHistory) {
    const answerHistory = transcript[0].answerHistory;
    if (Array.isArray(answerHistory)) {
      answerHistory.forEach((item: any) => {
        if (item.question && item.answer) {
          pairs.push({
            question: item.question,
            answer: item.answer
          });
        }
      });
    }
  }

  // If still no pairs, try direct access to answerHistory in the object
  if (pairs.length === 0 && transcript.answerHistory) {
    const answerHistory = transcript.answerHistory;
    if (Array.isArray(answerHistory)) {
      answerHistory.forEach((item: any) => {
        if (item.question && item.answer) {
          pairs.push({
            question: item.question,
            answer: item.answer
          });
        }
      });
    }
  }

  console.log(`📝 Built ${pairs.length} Q&A pairs for Gemini`);
  if (pairs.length > 0) {
    console.log(`📝 First Q&A:`, pairs[0]);
  }

  return pairs;
}

// IMPROVED: Manual scoring based on actual answers
function calculateManualScores(transcript: any[]) {
  const qaPairs = buildSchemedTranscript(transcript);

  if (qaPairs.length === 0) {
    return {
      totalScore: 0,
      techScore: 0,
      commScore: 0,
      problemScore: 0,
      behavioralScore: 0,
      qaPairs: []
    };
  }

  const answerLengths = qaPairs.map(pair => pair.answer.length);
  const avgLength = answerLengths.reduce((a, b) => a + b, 0) / answerLengths.length;

  // Calculate technical terms
  const technicalTerms = ['experience', 'skill', 'knowledge', 'project', 'work', 'build', 'create', 'develop', 'technical', 'learned', 'code', 'system', 'api', 'database', 'function'];
  const techCount = qaPairs.reduce((count, pair) =>
    count + technicalTerms.filter(term => pair.answer.toLowerCase().includes(term)).length, 0);

  // Calculate communication score based on sentence structure
  const sentences = qaPairs.reduce((count, pair) =>
    count + (pair.answer.match(/[.!?]+/g) || []).length, 0);

  // Calculate problem solving indicators
  const problemTerms = ['solve', 'solution', 'approach', 'step', 'method', 'implement', 'fix', 'debug', 'optimize'];
  const problemCount = qaPairs.reduce((count, pair) =>
    count + problemTerms.filter(term => pair.answer.toLowerCase().includes(term)).length, 0);

  // Calculate behavioral indicators
  const behavioralTerms = ['team', 'collaborate', 'lead', 'manage', 'communicate', 'help', 'support', 'mentor'];
  const behavioralCount = qaPairs.reduce((count, pair) =>
    count + behavioralTerms.filter(term => pair.answer.toLowerCase().includes(term)).length, 0);

  // Calculate scores
  const totalScore = Math.min(100, Math.max(30, 40 + Math.floor(avgLength / 10) + (techCount * 2) + (sentences * 3)));
  const techScore = Math.min(100, Math.max(30, 45 + (techCount * 5)));
  const commScore = Math.min(100, Math.max(30, 50 + Math.floor(avgLength / 15) + (sentences * 5)));
  const problemScore = Math.min(100, Math.max(30, 40 + (problemCount * 8)));
  const behavioralScore = Math.min(100, Math.max(30, 40 + (behavioralCount * 8)));

  return {
    totalScore,
    techScore,
    commScore,
    problemScore,
    behavioralScore,
    qaPairs,
    avgLength,
    answerCount: qaPairs.length
  };
}

// IMPROVED: Fallback feedback with real answer analysis
function generateFallbackFeedback(transcript: any[], interviewId: string, userId: string) {
  const {
    totalScore,
    techScore,
    commScore,
    problemScore,
    behavioralScore,
    qaPairs,
    avgLength,
    answerCount
  } = calculateManualScores(transcript);

  // Generate strengths based on actual answers
  const strengths = [];
  if (avgLength > 30) strengths.push("Provided detailed responses");
  if (qaPairs.length >= 5) strengths.push("Completed all questions");
  if (commScore > 60) strengths.push("Clear communication");
  if (techScore > 60) strengths.push("Demonstrated technical knowledge");
  if (problemScore > 60) strengths.push("Shows problem-solving approach");
  if (behavioralScore > 60) strengths.push("Good behavioral responses");

  if (strengths.length === 0) {
    strengths.push("Completed interview");
  }

  // Generate areas for improvement based on actual answers
  const improvements = [];
  if (avgLength < 30) improvements.push("Provide more detailed answers (aim for 50+ words)");
  if (techScore < 50) improvements.push("Expand technical vocabulary and examples");
  if (commScore < 50) improvements.push("Structure responses more clearly");
  if (problemScore < 50) improvements.push("Explain your problem-solving process step by step");
  if (behavioralScore < 50) improvements.push("Share specific examples from past experience");

  if (improvements.length === 0) {
    improvements.push("Continue practicing to maintain skills");
  }

  // Generate final assessment
  let finalAssessment = "";
  if (totalScore >= 80) {
    finalAssessment = `Strong performance with ${answerCount} questions answered. Demonstrates good technical knowledge and communication skills.`;
  } else if (totalScore >= 60) {
    finalAssessment = `Satisfactory performance with ${answerCount} questions answered. Shows basic competency with room for improvement.`;
  } else {
    finalAssessment = `Interview completed with ${answerCount} questions. Focus on providing more detailed, structured responses.`;
  }

  return {
    id: db.collection("feedback").doc().id,
    interviewId,
    userId,
    totalScore,
    categoryScores: [
      { name: "Technical Knowledge", score: techScore, comment: techScore > 60 ? "Good technical understanding" : "Basic technical knowledge" },
      { name: "Communication", score: commScore, comment: commScore > 60 ? "Clear and structured responses" : "Responses could be clearer" },
      { name: "Problem Solving", score: problemScore, comment: problemScore > 60 ? "Logical problem-solving approach" : "Needs more structured thinking" },
      { name: "Behavioral", score: behavioralScore, comment: behavioralScore > 60 ? "Good use of examples" : "Could provide more specific examples" }
    ],
    strengths: strengths.slice(0, 3),
    areasForImprovement: improvements.slice(0, 3),
    finalAssessment,
    createdAt: new Date().toISOString(),
    source: "fallback"
  };
}

export interface CreateFeedbackParams {
  interviewId: string;
  transcript: any[];
  userId: string;
  feedbackId?: string;
}

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, transcript, userId, feedbackId } = params;

  try {
    let feedback;
    let source = "unknown";

    // Log incoming transcript structure for debugging
    console.log("📥 Feedback API received transcript:", {
      type: Array.isArray(transcript) ? 'array' : typeof transcript,
      length: Array.isArray(transcript) ? transcript.length : 'N/A',
      hasAnswerHistory: transcript?.answerHistory ? true : false,
      firstItem: Array.isArray(transcript) && transcript[0] ? Object.keys(transcript[0]) : null
    });

    if (genAI) {
      try {
        const qaPairs = buildSchemedTranscript(transcript);

        if (qaPairs.length === 0) {
          console.log("⚠️ No Q&A pairs found, using fallback");
          feedback = generateFallbackFeedback(transcript, interviewId, userId);
          source = "fallback-no-answers";
        } else {
          const formattedTranscript = qaPairs
            .map((pair, index) => `Question ${index + 1}: ${pair.question}\nAnswer ${index + 1}: ${pair.answer}\n`)
            .join("");

          const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });

          const prompt = `
You are an expert interview coach. Analyze this interview transcript and return STRICT JSON ONLY.

IMPORTANT: Score each category realistically based on the answer quality, length, and relevance.

${JSON.stringify(feedbackSchema, null, 2)}

Transcript:
${formattedTranscript}

Return ONLY the JSON object. No other text, no markdown, no explanation.
`;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = cleanGeminiJson(response?.text());

          try {
            const object = JSON.parse(text);

            feedback = {
              id: feedbackId || db.collection("feedback").doc().id,
              interviewId,
              userId,
              totalScore: Number(object.totalScore) || 50,
              categoryScores: Array.isArray(object.categoryScores) && object.categoryScores.length > 0
                ? object.categoryScores.map((cat: any) => ({
                    name: cat.name || '',
                    score: Number(cat.score) || 0,
                    comment: cat.comment || ''
                  }))
                : generateFallbackFeedback(transcript, interviewId, userId).categoryScores,
              strengths: Array.isArray(object.strengths) && object.strengths.length > 0
                ? object.strengths
                : generateFallbackFeedback(transcript, interviewId, userId).strengths,
              areasForImprovement: Array.isArray(object.areasForImprovement) && object.areasForImprovement.length > 0
                ? object.areasForImprovement
                : generateFallbackFeedback(transcript, interviewId, userId).areasForImprovement,
              finalAssessment: object.finalAssessment || generateFallbackFeedback(transcript, interviewId, userId).finalAssessment,
              createdAt: new Date().toISOString(),
            };
            source = "gemini";
          } catch (parseError) {
            console.error("❌ Failed to parse Gemini response:", parseError);
            feedback = generateFallbackFeedback(transcript, interviewId, userId);
            source = "fallback-parse-error";
          }
        }
      } catch (geminiError: any) {
        console.log("⚠️ Gemini failed, using fallback:", geminiError.message);
        feedback = generateFallbackFeedback(transcript, interviewId, userId);
        source = "fallback-after-gemini";
      }
    } else {
      feedback = generateFallbackFeedback(transcript, interviewId, userId);
      source = "fallback-no-api";
    }

    feedback.source = source;

    // Ensure we have an ID
    if (!feedback.id) {
      feedback.id = feedbackId || db.collection("feedback").doc().id;
    }

    const docRef = feedbackId
      ? db.collection("feedback").doc(feedbackId)
      : db.collection("feedback").doc(feedback.id);

    await docRef.set(feedback, { merge: true });

    console.log(`✅ Feedback created (${source}):`, docRef.id);
    console.log(`📊 Scores:`, {
      total: feedback.totalScore,
      categories: feedback.categoryScores.map((c: any) => `${c.name}: ${c.score}`)
    });

    return { success: true, feedbackId: docRef.id, source, feedback };

  } catch (error: any) {
    console.error("❌ FEEDBACK ERROR:", error.message || error);
    return { success: false, error: error.message };
  }
}

export async function getInterviewById(id: string): Promise<any> {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    console.error("Invalid interview ID provided:", id);
    return null;
  }

  try {
    const interview = await db.collection("interviews").doc(id).get();
    return interview.data() || null;
  } catch (error) {
    console.error("Error fetching interview:", error);
    return null;
  }
}

export async function getFeedbackByInterviewId(params: {
  interviewId: string;
  userId: string;
}): Promise<any> {
  const { interviewId, userId } = params;

  // Add guard for undefined userId
  if (!userId) {
    console.log("No userId provided for feedback lookup, returning null");
    return null;
  }

  if (!interviewId) {
    console.log("No interviewId provided for feedback lookup, returning null");
    return null;
  }

  try {
    const querySnapshot = await db
      .collection("feedback")
      .where("interviewId", "==", interviewId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (querySnapshot.empty) return null;

    const feedbackDoc = querySnapshot.docs[0];
    return { id: feedbackDoc.id, ...feedbackDoc.data() };
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return null;
  }
}

export async function getLatestInterviews(params: {
  userId: string;
  limit?: number;
}): Promise<any[]> {
  const { userId, limit = 20 } = params;

  // Add guard for undefined userId
  if (!userId) {
    console.log("No userId provided for latest interviews, returning empty array");
    return [];
  }

  try {
    const snapshot = await db
      .collection("interviews")
      .where("finalized", "==", true)
      .orderBy("createdAt", "desc")
      .limit(limit * 2)
      .get();

    const interviews = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((interview) => interview.userId !== userId)
      .slice(0, limit);

    return interviews;
  } catch (error) {
    console.error("Error fetching latest interviews:", error);
    return [];
  }
}

export async function getInterviewsByUserId(userId: string): Promise<any[]> {
  // Add guard for undefined userId - THIS FIXES THE ERROR!
  if (!userId) {
    console.log("No userId provided for getInterviewsByUserId, returning empty array");
    return [];
  }

  try {
    const interviews = await db
      .collection("interviews")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    return interviews.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching user interviews:", error);
    return [];
  }
}