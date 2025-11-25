import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createAudit,
  getAllAudits,
  updateAudit,
  deleteAudit,
  getAuditById,
} from "@/lib/auditService";
import { validateJWTToken } from "@/lib/jwtAuthService";

// Validation schemas
const subParameterResultSchema = z.object({
  id: z.string().min(1, "Sub-parameter ID is required"),
  name: z.string().min(1, "Sub-parameter name is required"),
  weight: z.number().min(0, "Weight must be non-negative"),
  type: z.enum(["Non-Fatal", "Fatal", "ZTP"]),
  score: z
    .number()
    .min(0, "Score must be non-negative")
    .max(100, "Score cannot exceed 100"),
  comments: z.string().optional(),
  evidence: z.string().optional(),
});

const parameterResultSchema = z.object({
  id: z.string().min(1, "Parameter ID is required"),
  name: z.string().min(1, "Parameter name is required"),
  subParameters: z
    .array(subParameterResultSchema)
    .min(1, "At least one sub-parameter result is required"),
});

const createAuditSchema = z
  .object({
    auditName: z
      .string()
      .min(1, "Audit name is required")
      .max(100, "Audit name must be less than 100 characters")
      .optional(),
    auditType: z
      .enum(["manual", "ai"], { required_error: "Audit type is required" })
      .optional(),
    qaParameterSetId: z
      .string()
      .min(1, "QA parameter set ID is required")
      .optional(),
    qaParameterSetName: z
      .string()
      .min(1, "QA parameter set name is required")
      .optional(),
    sopId: z.string().optional(),
    sopTitle: z.string().optional(),
    agentName: z
      .string()
      .min(1, "Agent name is required")
      .max(100, "Agent name must be less than 100 characters")
      .optional(),
    customerName: z
      .string()
      .min(1, "Customer name is required")
      .max(100, "Customer name must be less than 100 characters")
      .optional(),
    interactionId: z
      .string()
      .min(1, "Interaction ID is required")
      .max(50, "Interaction ID must be less than 50 characters")
      .optional(),
    callTranscript: z.string().min(1, "Call transcript is required").optional(),
    parameters: z.array(parameterResultSchema).optional(),
    overallScore: z
      .number()
      .min(0, "Overall score must be non-negative")
      .max(100, "Overall score cannot exceed 100")
      .optional(),
    overallComments: z.string().optional(),
    auditDate: z.string().datetime().optional(),
    auditorId: z.string().optional(),
    auditorName: z.string().optional(),
  })
  .strict()
  .refine(
    (data) => {
      // At least one required field must be present
      return (
        data.agentName ||
        data.customerName ||
        data.interactionId ||
        data.callTranscript
      );
    },
    { message: "At least one audit field is required" }
  );

const updateAuditSchema = z.object({
  auditName: z
    .string()
    .min(3, "Audit name must be at least 3 characters")
    .max(100, "Audit name must be less than 100 characters")
    .optional(),
  agentName: z
    .string()
    .min(1, "Agent name is required")
    .max(100, "Agent name must be less than 100 characters")
    .optional(),
  customerName: z
    .string()
    .min(1, "Customer name is required")
    .max(100, "Customer name must be less than 100 characters")
    .optional(),
  interactionId: z
    .string()
    .min(1, "Interaction ID is required")
    .max(50, "Interaction ID must be less than 50 characters")
    .optional(),
  callTranscript: z
    .string()
    .min(10, "Call transcript must be at least 10 characters")
    .optional(),
  parameters: z
    .array(parameterResultSchema)
    .min(1, "At least one parameter result is required")
    .optional(),
  overallScore: z
    .number()
    .min(0, "Overall score must be non-negative")
    .max(100, "Overall score cannot exceed 100")
    .optional(),
  overallComments: z.string().optional(),
  auditorId: z.string().optional(),
  auditorName: z.string().optional(),
});

// GET /api/audits - Get all audits
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const auditType = searchParams.get("type");
    const agentName = searchParams.get("agent");
    const qaParameterSetId = searchParams.get("qaParameterSetId");
    const sopId = searchParams.get("sopId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    // Get current user from JWT token
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    let currentUser = null;
    let currentUserRole = null;
    let currentUsername = null;
    let currentUserId = null;

    if (token) {
      const tokenResult = await validateJWTToken(token);
      if (tokenResult.valid && tokenResult.user) {
        currentUser = tokenResult.user;
        currentUserRole = tokenResult.user.role;
        currentUsername = tokenResult.user.username;
        currentUserId = tokenResult.user.id;
      }
    }

    // Build filter object
    const filters: any = {};
    if (auditType) filters.auditType = auditType;
    if (agentName) filters.agentName = { $regex: agentName, $options: "i" };
    if (qaParameterSetId) filters.qaParameterSetId = qaParameterSetId;
    if (sopId) filters.sopId = sopId;

    // Date range filter
    if (startDate || endDate) {
      filters.auditDate = {};
      if (startDate) filters.auditDate.$gte = new Date(startDate);
      if (endDate) filters.auditDate.$lte = new Date(endDate);
    }

    // Pagination options
    const options: any = {};
    if (limit) options.limit = parseInt(limit);
    if (offset) options.skip = parseInt(offset);

    const audits = await getAllAudits();

    // Debug logging
    console.log("Current user role:", currentUserRole);
    console.log("Current username:", currentUsername);
    console.log("Current user ID:", currentUserId);
    console.log("Total audits before filter:", audits.length);
    if (audits.length > 0) {
      console.log(
        "Sample audit auditedBy values:",
        audits.slice(0, 5).map((a: any) => a.auditedBy)
      );
    }

    // Apply role-based filtering to the results
    let filteredAudits = audits;
    if (currentUserRole === "Agent" || currentUserRole === "Auditor") {
      // Match by username OR user ID (to support old audits with IDs and new audits with usernames)
      filteredAudits = filteredAudits.filter(
        (audit: any) =>
          audit.auditedBy === currentUsername ||
          audit.auditedBy === currentUserId
      );
      console.log(
        "Filtered audits count for Auditor/Agent:",
        filteredAudits.length
      );
    } else if (currentUserRole === "Project Admin") {
      filteredAudits = filteredAudits.filter(
        (audit: any) => audit.projectId === currentUser?.projectId
      );
    }

    return NextResponse.json({ success: true, data: filteredAudits });
  } catch (error) {
    console.error("Error fetching audits:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch audits" },
      { status: 500 }
    );
  }
}

// POST /api/audits - Create a new audit
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error("Failed to parse JSON body:", e);
      body = {};
    }

    console.log("Audit POST received body:", JSON.stringify(body, null, 2));

    // Get current user from JWT token
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    let currentUsername = "Unknown";

    console.log(
      "POST /api/audits - Auth header:",
      authHeader ? "Present" : "Missing"
    );

    if (token) {
      const tokenResult = await validateJWTToken(token);
      console.log(
        "POST /api/audits - Token validation:",
        tokenResult.valid ? "Valid" : "Invalid"
      );
      if (tokenResult.valid && tokenResult.user) {
        currentUsername = tokenResult.user.username;
        console.log("POST /api/audits - Current username:", currentUsername);
      }
    }

    // Validate request body
    const validationResult = createAuditSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Validation errors:", validationResult.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Ensure minimum required fields for creating an audit
    if (!validatedData.agentName || !validatedData.interactionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          details: "agentName and interactionId are required",
        },
        { status: 400 }
      );
    }

    // Map the validated data to the format expected by createAudit
    const auditData = {
      callId: validatedData.interactionId,
      agentName: validatedData.agentName,
      customerName: validatedData.customerName || "Unknown Customer",
      callDate: validatedData.auditDate
        ? new Date(validatedData.auditDate)
        : new Date(),
      campaignId: validatedData.qaParameterSetId || "default_campaign", // Using QA parameter set as campaign for now
      campaignName: validatedData.qaParameterSetName || "Default Campaign",
      auditResults:
        validatedData.parameters?.flatMap((param) =>
          param.subParameters.map((subParam) => ({
            parameterId: subParam.id,
            parameterName: subParam.name,
            score: subParam.score,
            maxScore: subParam.weight,
            type: subParam.type,
            comments: subParam.comments,
          }))
        ) || [],
      overallScore: validatedData.overallScore || 0,
      maxPossibleScore: 100, // Assuming max score is 100
      transcript: validatedData.callTranscript || "No transcript provided",
      auditedBy: currentUsername,
      auditType: validatedData.auditType || "manual",
    };

    console.log(
      "POST /api/audits - Creating audit with auditedBy:",
      currentUsername
    );

    const newAudit = await createAudit(auditData);

    return NextResponse.json(
      { success: true, data: newAudit },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating audit:", error);

    // Handle duplicate key error (interaction ID already exists)
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Audit with this interaction ID already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create audit" },
      { status: 500 }
    );
  }
}

// PUT /api/audits/[id] - Update an audit
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const auditId = url.pathname.split("/").pop();

    if (!auditId) {
      return NextResponse.json(
        { success: false, error: "Audit ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = updateAuditSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;
    const updatedAudit = await updateAudit(auditId, updateData);

    if (!updatedAudit) {
      return NextResponse.json(
        { success: false, error: "Audit not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedAudit });
  } catch (error: any) {
    console.error("Error updating audit:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Audit with this interaction ID already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update audit" },
      { status: 500 }
    );
  }
}

// DELETE /api/audits/[id] - Delete an audit
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const auditId = url.pathname.split("/").pop();

    if (!auditId) {
      return NextResponse.json(
        { success: false, error: "Audit ID is required" },
        { status: 400 }
      );
    }

    const success = await deleteAudit(auditId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Audit not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Audit deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting audit:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete audit" },
      { status: 500 }
    );
  }
}
