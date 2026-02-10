/* ===========================
   FEEDBACK
=========================== */
export interface Feedback {
  id: string;
  interviewId: string;
  userId: string;
  totalScore: number;
  categoryScores: Array<{
    name: string;
    score: number;
    comment: string;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
}

/* ===========================
   INTERVIEW (UPDATED)
   Matches Firestore + Zod schema
=========================== */
export interface Interview {
  id: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  questions: string[];
  userId: string;
  finalized: boolean;
  createdAt: string;

  // ✅ NEW FIELDS (AI interviews)
  coverImage: string;        // /covers/reddit.png
  isRealInterview: boolean;  // true
  questionCount: number;     // questions.length
  source: string;            // "gemini"
}

/* ===========================
   CREATE FEEDBACK PARAMS
=========================== */
export interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  feedbackId?: string;
}

/* ===========================
   USERS
=========================== */
export interface User {
  name: string;
  email: string;
  id: string;
}

/* ===========================
   INTERVIEW CARD PROPS
=========================== */
export interface InterviewCardProps {
  id?: string;
  userId?: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string;
  coverImage?: string;
}

/* ===========================
   AGENT PROPS
=========================== */
export interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
}

/* ===========================
   APP ROUTER PARAMS
=========================== */
export interface RouteParams {
  params: { id: string };
  searchParams?: Record<string, string>;
}

/* ===========================
   QUERY PARAMS
=========================== */
export interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}

export interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}

/* ===========================
   AUTH PARAMS
=========================== */
export interface SignInParams {
  email: string;
  idToken: string;
}

export interface SignUpParams {
  uid: string;
  name: string;
  email: string;
  password: string;
}

export type FormType = "sign-in" | "sign-up";

/* ===========================
   INTERVIEW FORM PROPS
=========================== */
export interface InterviewFormProps {
  interviewId: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  amount: number;
}

/* ===========================
   TECH ICON PROPS
=========================== */
export interface TechIconProps {
  techStack: string[];
}

/* ===========================
   VOICE TRANSCRIPT
=========================== */
export interface VoiceTranscriptEntry {
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

/* ===========================
   VOICE CONFIG
=========================== */
export interface VoiceServiceConfig {
  useWebSpeechAPI: boolean;
  language?: string;
  voiceName?: string;
}

/* ===========================
   GEMINI RESPONSE
=========================== */
export interface GeminiResponse {
  text: string;
  audioUrl?: string;
}