import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAudit, getAllAudits, updateAudit, deleteAudit, getAuditById } from '@/lib/auditService';

// Validation schemas
const subParameterResultSchema = z.object({
  id: z.string().min(1, 'Sub-parameter ID is required'),
  name: z.string().min(1, 'Sub-parameter name is required'),
  weight: z.number().min(0, 'Weight must be non-negative'),
  type: z.enum(['Non-Fatal', 'Fatal', 'ZTP']),
  score: z.number().min(0, 'Score must be non-negative').max(100, 'Score cannot exceed 100'),
  comments: z.string().optional(),
  evidence: z.string().optional()
});

const parameterResultSchema = z.object({
  id: z.string().min(1, 'Parameter ID is required'),
  name: z.string().min(1, 'Parameter name is required'),
  subParameters: z.array(subParameterResultSchema).min(1, 'At least one sub-parameter result is required')
});

const createAuditSchema = z.object({
  auditName: z.string().min(3, 'Audit name must be at least 3 characters').max(100, 'Audit name must be less than 100 characters'),
  auditType: z.enum(['manual', 'ai'], { required_error: 'Audit type is required' }),
  qaParameterSetId: z.string().min(1, 'QA parameter set ID is required'),
  qaParameterSetName: z.string().min(1, 'QA parameter set name is required'),
  sopId: z.string().optional(),
  sopTitle: z.string().optional(),
  agentName: z.string().min(1, 'Agent name is required').max(100, 'Agent name must be less than 100 characters'),
  customerName: z.string().min(1, 'Customer name is required').max(100, 'Customer name must be less than 100 characters'),
  interactionId: z.string().min(1, 'Interaction ID is required').max(50, 'Interaction ID must be less than 50 characters'),
  callTranscript: z.string().min(10, 'Call transcript must be at least 10 characters'),
  parameters: z.array(parameterResultSchema).min(1, 'At least one parameter result is required'),
  overallScore: z.number().min(0, 'Overall score must be non-negative').max(100, 'Overall score cannot exceed 100'),
  overallComments: z.string().optional(),
  auditDate: z.string().datetime().optional(),
  auditorId: z.string().optional(),
  auditorName: z.string().optional()
});

const updateAuditSchema = z.object({
  auditName: z.string().min(3, 'Audit name must be at least 3 characters').max(100, 'Audit name must be less than 100 characters').optional(),
  agentName: z.string().min(1, 'Agent name is required').max(100, 'Agent name must be less than 100 characters').optional(),
  customerName: z.string().min(1, 'Customer name is required').max(100, 'Customer name must be less than 100 characters').optional(),
  interactionId: z.string().min(1, 'Interaction ID is required').max(50, 'Interaction ID must be less than 50 characters').optional(),
  callTranscript: z.string().min(10, 'Call transcript must be at least 10 characters').optional(),
  parameters: z.array(parameterResultSchema).min(1, 'At least one parameter result is required').optional(),
  overallScore: z.number().min(0, 'Overall score must be non-negative').max(100, 'Overall score cannot exceed 100').optional(),
  overallComments: z.string().optional(),
  auditorId: z.string().optional(),
  auditorName: z.string().optional()
});

// GET /api/audits - Get all audits
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const auditType = searchParams.get('type');
    const agentName = searchParams.get('agent');
    const qaParameterSetId = searchParams.get('qaParameterSetId');
    const sopId = searchParams.get('sopId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    
    // Build filter object
    const filters: any = {};
    if (auditType) filters.auditType = auditType;
    if (agentName) filters.agentName = { $regex: agentName, $options: 'i' };
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
    
    return NextResponse.json({ success: true, data: audits });
  } catch (error) {
    console.error('Error fetching audits:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audits' },
      { status: 500 }
    );
  }
}

// POST /api/audits - Create a new audit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = createAuditSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    
    // Map the validated data to the format expected by createAudit
    const auditData = {
      callId: validatedData.interactionId,
      agentName: validatedData.agentName,
      customerName: validatedData.customerName,
      callDate: validatedData.auditDate ? new Date(validatedData.auditDate) : new Date(),
      campaignId: validatedData.qaParameterSetId, // Using QA parameter set as campaign for now
      campaignName: validatedData.qaParameterSetName,
      auditResults: validatedData.parameters.flatMap(param => 
         param.subParameters.map(subParam => ({
           parameterId: subParam.id,
           parameterName: subParam.name,
           score: subParam.score,
           maxScore: subParam.weight,
           type: subParam.type,
           comments: subParam.comments
         }))
       ),
      overallScore: validatedData.overallScore,
      maxPossibleScore: 100, // Assuming max score is 100
      transcript: validatedData.callTranscript,
      auditedBy: validatedData.auditorName || validatedData.auditorId || 'Unknown',
      auditType: validatedData.auditType
    };
    
    const newAudit = await createAudit(auditData);
    
    return NextResponse.json(
      { success: true, data: newAudit },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating audit:', error);
    
    // Handle duplicate key error (interaction ID already exists)
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Audit with this interaction ID already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create audit' },
      { status: 500 }
    );
  }
}

// PUT /api/audits/[id] - Update an audit
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const auditId = url.pathname.split('/').pop();
    
    if (!auditId) {
      return NextResponse.json(
        { success: false, error: 'Audit ID is required' },
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
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;
    const updatedAudit = await updateAudit(auditId, updateData);
    
    if (!updatedAudit) {
      return NextResponse.json(
        { success: false, error: 'Audit not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: updatedAudit });
  } catch (error: any) {
    console.error('Error updating audit:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Audit with this interaction ID already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update audit' },
      { status: 500 }
    );
  }
}

// DELETE /api/audits/[id] - Delete an audit
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const auditId = url.pathname.split('/').pop();
    
    if (!auditId) {
      return NextResponse.json(
        { success: false, error: 'Audit ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteAudit(auditId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Audit not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Audit deleted successfully' });
  } catch (error) {
    console.error('Error deleting audit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete audit' },
      { status: 500 }
    );
  }
}