// app/api/memory/emotion/route.ts
import { NextRequest, NextResponse } from "next/server";
import { emotionalMemory } from "@/lib/memory/emotionalMemory";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, emotion, intensity, triggers, context } = body;

    if (!userId || !emotion) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const timestamp = await emotionalMemory.recordEmotionalState({
      userId,
      emotion,
      intensity,
      triggers: triggers || [],
      context: context || {}
    });

    return NextResponse.json({
      success: true,
      timestamp,
      message: "Emotion recorded successfully"
    });
  } catch (error) {
    console.error("Error recording emotion:", error);
    return NextResponse.json(
      { error: "Failed to record emotion" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const timeline = await emotionalMemory.getEmotionalTimeline(userId, limit);
    const patterns = await emotionalMemory.getEmotionalPatterns(userId);
    const wellness = await emotionalMemory.calculateEmotionalWellness(userId);
    const progress = await emotionalMemory.getEmotionalProgress(userId);

    return NextResponse.json({
      success: true,
      timeline,
      patterns,
      wellness,
      progress
    });
  } catch (error) {
    console.error("Error getting emotional data:", error);
    return NextResponse.json(
      { error: "Failed to get emotional data" },
      { status: 500 }
    );
  }
}