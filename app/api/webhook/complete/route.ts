import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { file_id, filename, total_chunks, status } = body;

    console.log("✅ Webhook received:", {
      file_id,
      filename,
      total_chunks,
      status,
    });

    // Update file status in database
    const { error } = await supabaseAdmin
      .from("files")
      .update({
        status: status || "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("file_id", file_id);

    if (error) {
      console.error("Database update error:", error);
      // Don't fail - just log it
    }

    return NextResponse.json({
      success: true,
      message: `Processing complete for file ${file_id}`,
      data: {
        file_id,
        filename,
        total_chunks,
        status: status || "ready",
      },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 },
    );
  }
}
