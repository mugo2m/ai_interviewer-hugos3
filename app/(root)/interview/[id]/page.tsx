// app/(root)/interview/[id]/page.tsx
import Image from "next/image";
import { redirect } from "next/navigation";

import Agent from "@/components/Agent";
import { getRandomInterviewCover } from "@/lib/utils";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";
import DisplayTechIcons from "@/components/DisplayTechIcons";

const InterviewDetails = async ({ params }: RouteParams) => {
  const { id } = await params;

  console.log("🔴🔴🔴 INTERVIEW PAGE LOADED 🔴🔴🔴");
  console.log("Interview ID:", id);

  const user = await getCurrentUser();
  console.log("Current user:", user?.id);

  let interview = await getInterviewById(id);
  console.log("Interview data:", {
    exists: !!interview,
    role: interview?.role,
    type: interview?.type,
    questionsCount: interview?.questions?.length,
    questions: interview?.questions,
    techstack: interview?.techstack
  });

  if (!interview) {
    console.log("❌ Interview not found, redirecting...");
    redirect("/");
  }

  // 🔥 FIX: If interview has no questions, create default ones
  if (!interview.questions || interview.questions.length === 0) {
    console.log("⚠️⚠️⚠️ No questions found in interview! Using default questions ⚠️⚠️⚠️");

    // Create a copy of interview with default questions
    interview = {
      ...interview,
      questions: [
        "Tell me about your experience in this role.",
        "What are your greatest strengths and weaknesses?",
        "Describe a challenging project you worked on.",
        "How do you handle stressful situations?",
        "Where do you see yourself in 5 years?"
      ]
    };

    console.log("✅ Added 5 default questions to interview");
  }

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id!,
  });

  console.log("Feedback exists:", !!feedback);
  console.log("✅ Passing questions to Agent:", interview.questions.length);

  return (
    <>
      <div className="flex flex-row gap-4 justify-between">
        <div className="flex flex-row gap-4 items-center max-sm:flex-col">
          <div className="flex flex-row gap-4 items-center">
            <Image
              src={getRandomInterviewCover()}
              alt="cover-image"
              width={40}
              height={40}
              className="rounded-full object-cover size-[40px]"
            />
            <h3 className="capitalize">{interview.role} Interview</h3>
          </div>

          <DisplayTechIcons techStack={interview.techstack} />
        </div>

        <p className="bg-dark-200 px-4 py-2 rounded-lg h-fit">
          {interview.type}
        </p>
      </div>

      <Agent
        userName={user?.name!}
        userId={user?.id}
        interviewId={id}
        questions={interview.questions}  // Now guaranteed to have questions!
        profileImage={user?.profileURL}
      />
    </>
  );
};

export default InterviewDetails;