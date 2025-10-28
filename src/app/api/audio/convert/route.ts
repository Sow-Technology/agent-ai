import { NextRequest, NextResponse } from "next/server";
import { getAuthHeaders } from "@/lib/authUtils";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;
let ffmpegLoaded = false;

async function getFFmpeg() {
  if (ffmpegLoaded && ffmpeg) {
    return ffmpeg;
  }

  ffmpeg = new FFmpeg();

  const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";

  try {
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });
    ffmpegLoaded = true;
  } catch (error) {
    console.error("Failed to load FFmpeg:", error);
    throw new Error("FFmpeg initialization failed");
  }

  return ffmpeg;
}

// Set max request timeout for large audio files
export const maxDuration = 300; // 5 minutes

/**
 * POST /api/audio/convert
 *
 * Converts audio files to WAV format on the server
 * Request body should contain multipart form data with the audio file
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = (
      request.headers.get("content-type") || ""
    ).toLowerCase();

    let buffer: Buffer;
    let originalType = "application/octet-stream";
    let fileName = "upload";

    // Case 1: multipart/form-data (file input)
    if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const formData = await request.formData();
      const audioFile = formData.get("file") as File | null;

      if (!audioFile) {
        return NextResponse.json(
          { success: false, error: "No audio file provided in form data" },
          { status: 400 }
        );
      }

      originalType = audioFile.type || originalType;
      fileName = audioFile.name || fileName;
      const arrayBuffer = await audioFile.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (contentType.includes("application/json")) {
      // Case 2: JSON body containing base64 or data URI
      let json: any;
      try {
        json = await request.json();
      } catch (parseErr) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid JSON in request body",
            details:
              parseErr instanceof Error ? parseErr.message : "JSON parse error",
          },
          { status: 400 }
        );
      }

      const data = json?.audioDataUri || json?.audioData || json?.audioBase64;

      if (!data || typeof data !== "string") {
        return NextResponse.json(
          {
            success: false,
            error:
              "No audio data found in JSON body. Provide audioDataUri, audioData, or audioBase64 field.",
          },
          { status: 400 }
        );
      }

      try {
        if (data.startsWith("data:")) {
          const match = data.match(/^data:(.+);base64,(.+)$/);
          if (!match) {
            return NextResponse.json(
              {
                success: false,
                error:
                  "Invalid data URI provided. Expected format: data:audio/mpeg;base64,...",
              },
              { status: 400 }
            );
          }
          originalType = match[1];
          const base64 = match[2];
          buffer = Buffer.from(base64, "base64");
        } else {
          // Assume plain base64
          originalType = json?.originalType || originalType;
          buffer = Buffer.from(data, "base64");
        }
      } catch (bufferErr) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to decode base64 data",
            details:
              bufferErr instanceof Error ? bufferErr.message : "Decode error",
          },
          { status: 400 }
        );
      }
    } else if (
      contentType.startsWith("audio/") ||
      contentType.startsWith("video/") ||
      contentType.includes("application/octet-stream")
    ) {
      // Case 3: raw binary body upload (audio/*, video/mp4, or octet-stream)
      const arrayBuffer = await request.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      originalType = contentType || originalType;
      fileName = request.headers.get("x-filename") || fileName;
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unsupported Content-Type. Accepts multipart/form-data, application/json (base64/dataURI), audio/*, video/mp4, or application/octet-stream",
        },
        { status: 415 }
      );
    }

    // Basic validation of type
    if (
      !originalType.startsWith("audio/") &&
      originalType !== "video/mp4" &&
      originalType !== "application/octet-stream"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Must be an audio or MP4 video file.",
        },
        { status: 400 }
      );
    }

    console.log("Converting audio file to WAV", {
      fileName,
      fileSize: `${(buffer.length / (1024 * 1024)).toFixed(2)}MB`,
      fileType: originalType,
      timestamp: new Date().toISOString(),
    });

    // Convert to WAV
    const wavBuffer = await convertToWav(buffer, originalType);

    // Convert buffer to base64 data URI
    const base64 = wavBuffer.toString("base64");
    const wavDataUri = `data:audio/wav;base64,${base64}`;

    console.log("Audio conversion completed", {
      originalSize: `${(buffer.length / (1024 * 1024)).toFixed(2)}MB`,
      convertedSize: `${(wavBuffer.length / (1024 * 1024)).toFixed(2)}MB`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        audioDataUri: wavDataUri,
        fileName,
        originalType,
        convertedType: "audio/wav",
        originalSize: buffer.length,
        convertedSize: wavBuffer.length,
      },
    });
  } catch (error) {
    console.error("Audio conversion error:", {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to convert audio file",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * Convert audio buffer to WAV format
 * Using FFmpeg.wasm for server-side conversion
 */
async function convertToWav(buffer: Buffer, mimeType: string): Promise<Buffer> {
  try {
    const ffmpegInstance = await getFFmpeg();

    // Write input file
    const inputFileName = "input_audio";
    const outputFileName = "output.wav";

    ffmpegInstance.writeFile(inputFileName, new Uint8Array(buffer));

    // Run FFmpeg conversion
    await ffmpegInstance.exec([
      "-i",
      inputFileName,
      "-acodec",
      "pcm_s16le",
      "-ar",
      "16000",
      "-ac",
      "1",
      outputFileName,
    ]);

    // Read output file
    const data = await ffmpegInstance.readFile(outputFileName);
    const outputBuffer = Buffer.from(data as Uint8Array);

    // Clean up files
    ffmpegInstance.deleteFile(inputFileName);
    ffmpegInstance.deleteFile(outputFileName);

    return outputBuffer;
  } catch (error) {
    console.error("WAV conversion error:", error);
    throw error;
  }
}

/**
 * Get FFmpeg format from MIME type
 */
function getFormatFromMimeType(mimeType: string): string {
  const mimeToFormat: Record<string, string> = {
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/wave": "wav",
    "audio/ogg": "ogg",
    "audio/webm": "webm",
    "audio/aac": "aac",
    "audio/flac": "flac",
    "audio/x-m4a": "m4a",
    "audio/x-ms-wma": "wma",
    "video/mp4": "mp4",
  };

  return mimeToFormat[mimeType] || "mp3";
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
