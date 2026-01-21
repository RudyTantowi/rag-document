import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import formidable, { IncomingForm } from "formidable";
import { supabaseAdmin } from "@/lib/supabase";
import {
  extractText,
  isValidFileType,
  MAX_FILE_SIZE,
  SUPPORTED_FILE_TYPES,
} from "@/lib/textExtractor";

// Helper function to parse form data
async function parseForm(req: any): Promise<{ fields: any; files: any }> {
  const form = new IncomingForm({
    maxFileSize: MAX_FILE_SIZE,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 },
      );
    }

    // Validate file type
    if (!isValidFileType(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type",
          supportedTypes: Object.keys(SUPPORTED_FILE_TYPES),
        },
        { status: 400 },
      );
    }

    // Generate unique file ID
    const fileId = uuidv4();
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file to disk
    const filePath = path.join(uploadsDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Extract and clean text
    let extractedText: string;
    try {
      extractedText = await extractText(buffer, file.type);
    } catch (error) {
      return NextResponse.json(
        {
          error: `Text extraction failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
        { status: 500 },
      );
    }

    // Save file metadata to Supabase
    const { error: dbError } = await supabaseAdmin.from("files").insert({
      filename: file.name,
      file_path: filePath,
      file_id: fileId,
      status: "processing",
    });

    if (dbError) {
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 },
      );
    }

    // Send extracted text to n8n /upload endpoint
    const ngrokBaseUrl = process.env.NGROK_BASE_URL;
    if (!ngrokBaseUrl) {
      return NextResponse.json(
        { error: "NGROK_BASE_URL not configured" },
        { status: 500 },
      );
    }

    // Send to n8n asynchronously (fire and forget)
    fetch(`${ngrokBaseUrl}/webhook/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file_id: fileId,
        filename: file.name,
        text: extractedText,
      }),
    }).catch((error) => {
      console.error("n8n webhook error (non-blocking):", error);
      // Update file status to error in background
      supabaseAdmin
        .from("files")
        .update({ status: "error" })
        .eq("file_id", fileId)
        .then(() => console.log(`File ${fileId} marked as error`));
    });

    // Return immediately to client
    return NextResponse.json({
      success: true,
      file_id: fileId,
      filename: file.name,
      status: "processing",
      message: "File uploaded successfully, processing in background",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: `Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 },
    );
  }
}
