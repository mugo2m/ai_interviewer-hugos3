import { NextRequest, NextResponse } from "next/server";
import { memoryService } from "@/lib/memory/memoryService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const resumeData = await memoryService.getResumeInterviewData(userId);

    return NextResponse.json({
      success: true,
      data: resumeData
    });
  } catch (error) {
    console.error("❌ [API /memory/resume] Error:", error);
    return NextResponse.json(
      { error: "Failed to get resume data" },
      { status: 500 }
    );
  }
}