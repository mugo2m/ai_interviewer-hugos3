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

function buildSchemedTranscript(transcript: any[]) {
  const pairs: { question: string; answer: string }[] = [];
  for (let i = 0; i < transcript.length; i++) {
    if (transcript[i].role === "assistant" && transcript[i + 1] && transcript[i + 1].role === "user") {
      pairs.push({ question: transcript[i].content, answer: transcript[i + 1].content });
      i++;
    }
  }
  return pairs;
}

function calculateManualScores(transcript: any[]) {
  const qaPairs = buildSchemedTranscript(transcript);
  if (qaPairs.length === 0) return { totalScore: 50, techScore: 50, commScore: 50, qaPairs: [] };

  const answerLengths = qaPairs.map(pair => pair.answer.length);
  const avgLength = answerLengths.reduce((a, b) => a + b, 0) / answerLengths.length;

  const technicalTerms = ['experience', 'skill', 'knowledge', 'project', 'work', 'build', 'create', 'develop', 'technical', 'learned'];
  const techCount = qaPairs.reduce((count, pair) =>
    count + technicalTerms.filter(term => pair.answer.toLowerCase().includes(term)).length, 0);

  const totalScore = Math.min(100, Math.max(50, 60 + Math.floor(avgLength / 5) + (techCount * 3)));
  const techScore = Math.min(100, Math.max(40, 65 + (techCount * 8)));
  const commScore = Math.min(100, Math.max(50, 70 + Math.floor(avgLength / 8)));

  return { totalScore, techScore, commScore, qaPairs };
}

function generateFallbackFeedback(transcript: any[], interviewId: string, userId: string) {
  const { totalScore, techScore, commScore, qaPairs } = calculateManualScores(transcript);

  return {
    id: db.collection("feedback").doc().id,
    interviewId,
    userId,
    totalScore,
    categoryScores: [
      { name: "Technical Knowledge", score: techScore, comment: "Basic technical understanding demonstrated" },
      { name: "Communication", score: commScore, comment: qaPairs.length > 0 ? "Clear expression of thoughts" : "Minimal responses provided" },
      { name: "Problem Solving", score: Math.floor((techScore + commScore) / 2), comment: "Shows logical thinking approach" }
    ],
    strengths: qaPairs.length > 2
      ? ["Good response depth", "Relevant examples provided", "Clear communication"]
      : qaPairs.length > 0
        ? ["Responded to questions", "Completed interview"]
        : ["Interview attempted"],
    areasForImprovement: [
      "Could provide more specific examples",
      "Expand on technical details",
      "Structure responses more clearly"
    ],
    finalAssessment: qaPairs.length > 0
      ? `Candidate completed interview with ${qaPairs.length} questions answered. ${totalScore >= 80 ? 'Shows strong potential.' : 'Demonstrates basic competency.'}`
      : "Minimal interview data available for assessment.",
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

    if (genAI) {
      try {
        const qaPairs = buildSchemedTranscript(transcript);
        const formattedTranscript = qaPairs
          .map((pair) => `Q: ${pair.question}\nA: ${pair.answer}\n`)
          .join("");

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const prompt = `
Analyze this interview transcript and return STRICT JSON ONLY
matching this schema:

${JSON.stringify(feedbackSchema, null, 2)}

Transcript:
${formattedTranscript}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = cleanGeminiJson(response?.text());
        const object = JSON.parse(text);

        feedback = {
          id: feedbackId || db.collection("feedback").doc().id,
          interviewId,
          userId,
          totalScore: Number(object.totalScore) || 0,
          categoryScores: Array.isArray(object.categoryScores)
            ? object.categoryScores.map((cat: any) => ({
                name: cat.name || '',
                score: Number(cat.score) || 0,
                comment: cat.comment || ''
              }))
            : [],
          strengths: Array.isArray(object.strengths) ? object.strengths : [],
          areasForImprovement: Array.isArray(object.areasForImprovement)
            ? object.areasForImprovement
            : [],
          finalAssessment: object.finalAssessment || '',
          createdAt: new Date().toISOString(),
        };
        source = "gemini";
      } catch (geminiError) {
        console.log("⚠️ Gemini failed, using fallback:", geminiError.message);
        feedback = generateFallbackFeedback(transcript, interviewId, userId);
        source = "fallback-after-gemini";
      }
    } else {
      feedback = generateFallbackFeedback(transcript, interviewId, userId);
      source = "fallback-no-api";
    }

    feedback.source = source;

    const docRef = feedbackId
      ? db.collection("feedback").doc(feedbackId)
      : db.collection("feedback").doc(feedback.id);

    await docRef.set(feedback, { merge: true });

    console.log(`✅ Feedback created (${source}):`, feedback.id);
    return { success: true, feedbackId: docRef.id, source };

  } catch (error: any) {
    console.error("❌ FEEDBACK ERROR:", error.message || error);
    return { success: false, error: error.message };
  }
}

export async function getInterviewById(id: string): Promise<any> {
  // ADD VALIDATION
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

  const querySnapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (querySnapshot.empty) return null;

  const feedbackDoc = querySnapshot.docs[0];
  return { id: feedbackDoc.id, ...feedbackDoc.data() };
}

export async function getLatestInterviews(params: {
  userId: string;
  limit?: number;
}): Promise<any[]> {
  const { userId, limit = 20 } = params;

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
}

export async function getInterviewsByUserId(userId: string): Promise<any[]> {
  const interviews = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}