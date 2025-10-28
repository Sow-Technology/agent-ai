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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "500mb",
    },
  },
};

/**
 * POST /api/audio/convert
 * 
 * Converts audio files to WAV format on the server
 * Request body should contain multipart form data with the audio file
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("file") as File;

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!audioFile.type.startsWith("audio/") && audioFile.type !== "video/mp4") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Must be an audio or MP4 video file.",
        },
        { status: 400 }
      );
    }

    console.log("Converting audio file to WAV", {
      fileName: audioFile.name,
      fileSize: `${(audioFile.size / (1024 * 1024)).toFixed(2)}MB`,
      fileType: audioFile.type,
      timestamp: new Date().toISOString(),
    });

    // Read file as buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert to WAV using FFmpeg (via Node.js)
    const wavBuffer = await convertToWav(buffer, audioFile.type);

    // Convert buffer to base64 data URI
    const base64 = wavBuffer.toString("base64");
    const wavDataUri = `data:audio/wav;base64,${base64}`;

    console.log("Audio conversion completed", {
      originalSize: `${(audioFile.size / (1024 * 1024)).toFixed(2)}MB`,
      convertedSize: `${(wavBuffer.length / (1024 * 1024)).toFixed(2)}MB`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        audioDataUri: wavDataUri,
        fileName: audioFile.name,
        originalType: audioFile.type,
        convertedType: "audio/wav",
        originalSize: audioFile.size,
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
async function convertToWav(
  buffer: Buffer,
  mimeType: string
): Promise<Buffer> {
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
