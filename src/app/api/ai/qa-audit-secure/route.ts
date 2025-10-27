import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Body size controlled at reverse proxy (nginx) or use cloud upload flow

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request structure
    if (!body.encryptedData || !body.dataKey || !body.metadata) {
      return NextResponse.json(
        { success: false, error: "Invalid secure request format" },
        { status: 400 }
      );
    }

    // Verify data integrity
    const isValid = await verifyDataIntegrity(body);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Data integrity check failed" },
        { status: 400 }
      );
    }

    // Decrypt data for processing (only in memory)
    const decryptedData = await decryptSecureData(
      body.encryptedData,
      body.dataKey
    );

    // Process with AI (data never stored)
    const { qaAuditCall } = await import("@/ai/flows/qa-audit-flow");

    try {
      const result = await qaAuditCall(decryptedData);
    } catch (aiError) {
      console.error("AI Processing Error Details:", {
        error: aiError instanceof Error ? aiError.message : aiError,
        timestamp: new Date().toISOString(),
      });

      // Re-throw with more context
      if (aiError instanceof Error) {
        throw new Error(`AI Processing failed: ${aiError.message}`);
      }
      throw aiError;
    }

    const result = await qaAuditCall(decryptedData);

    // Encrypt result before sending back
    const encryptedResult = await encryptResult(result, body.dataKey);

    // Log audit trail (without storing actual data)
    await logSecureAudit({
      userId: body.metadata.userId,
      action: "qa_audit",
      timestamp: new Date(),
      dataSize: body.encryptedData.length,
      success: true,
    });

    return NextResponse.json({
      success: true,
      encryptedResult,
      metadata: {
        processedAt: new Date().toISOString(),
        dataIntegrity: await generateIntegrityHash(result),
      },
    });
  } catch (error) {
    console.error("Secure QA Audit API error:", {
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      timestamp: new Date().toISOString(),
    });

    // Log security events
    await logSecurityEvent({
      type: "api_error",
      endpoint: "/api/ai/qa-audit-secure",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date(),
    });

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: "Secure processing failed",
        details: errorMessage.substring(0, 200),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Security helper functions
async function verifyDataIntegrity(data: any): Promise<boolean> {
  // Implement integrity verification
  const expectedHash = data.metadata.integrityHash;
  const actualHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(data.encryptedData))
    .digest("hex");

  return expectedHash === actualHash;
}

async function decryptSecureData(
  encryptedData: string,
  key: string
): Promise<any> {
  // Implement client-side encryption compatible decryption
  // This is a simplified example - use proper encryption in production
  try {
    const decipher = crypto.createDecipher("aes-256-cbc", key);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error("Decryption failed");
  }
}

async function encryptResult(result: any, key: string): Promise<string> {
  // Encrypt result before sending back to client
  try {
    const cipher = crypto.createCipher("aes-256-cbc", key);
    let encrypted = cipher.update(JSON.stringify(result), "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  } catch (error) {
    throw new Error("Encryption failed");
  }
}

async function generateIntegrityHash(data: any): Promise<string> {
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

async function logSecureAudit(auditData: any): Promise<void> {
  // Log to secure audit database (without sensitive data)
  console.log("Secure audit logged:", {
    ...auditData,
    timestamp: new Date().toISOString(),
  });
}

async function logSecurityEvent(event: any): Promise<void> {
  // Log security events for monitoring
  console.error("Security event:", event);
}
