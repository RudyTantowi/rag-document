import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, file_id } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Check if there's at least one file with 'ready' status
    const { data: readyFiles, error: filesError } = await supabaseAdmin
      .from("files")
      .select("file_id")
      .eq("status", "ready")
      .limit(1);

    if (filesError) {
      return NextResponse.json(
        { error: `Database error: ${filesError.message}` },
        { status: 500 },
      );
    }

    if (!readyFiles || readyFiles.length === 0) {
      return NextResponse.json(
        {
          error:
            "No processed files available. Please upload and process a file first.",
        },
        { status: 400 },
      );
    }

    // Use provided file_id or the first ready file
    const targetFileId = file_id || readyFiles[0].file_id;

    // Save user message to database
    const { error: userMsgError } = await supabaseAdmin
      .from("messages")
      .insert({
        file_id: targetFileId,
        message,
        role: "user",
      });

    if (userMsgError) {
      return NextResponse.json(
        { error: `Failed to save user message: ${userMsgError.message}` },
        { status: 500 },
      );
    }

    // Send message to n8n /chat endpoint
    const ngrokBaseUrl = process.env.NGROK_BASE_URL;
    if (!ngrokBaseUrl) {
      return NextResponse.json(
        { error: "NGROK_BASE_URL not configured" },
        { status: 500 },
      );
    }

    try {
      const n8nResponse = await fetch(`${ngrokBaseUrl}/webhook/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          file_id: targetFileId,
        }),
      });

      if (!n8nResponse.ok) {
        throw new Error(`n8n responded with status: ${n8nResponse.status}`);
      }

      const n8nData = await n8nResponse.json();
      const botMessage =
        n8nData.message || n8nData.response || "No response from bot";

      // Save bot response to database
      const { error: botMsgError } = await supabaseAdmin
        .from("messages")
        .insert({
          file_id: targetFileId,
          message: botMessage,
          role: "assistant",
        });

      if (botMsgError) {
        console.error("Failed to save bot message:", botMsgError);
      }

      return NextResponse.json({
        success: true,
        message: botMessage,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: `Failed to communicate with n8n: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      {
        error: `Chat failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const file_id = searchParams.get("file_id");

    if (!file_id) {
      return NextResponse.json(
        { error: "file_id parameter is required" },
        { status: 400 },
      );
    }

    // Get chat history for the file
    const { data: messages, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("file_id", file_id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch messages: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      messages: messages || [],
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      {
        error: `Failed to get messages: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}
