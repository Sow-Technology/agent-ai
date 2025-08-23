import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createQAParameter, getAllQAParameters, updateQAParameter, deleteQAParameter, getQAParameterById } from '@/lib/qaParameterService';

// Validation schemas
const subParameterSchema = z.object({
  id: z.string().min(1, 'Sub-parameter ID is required'),
  name: z.string().min(1, 'Sub-parameter name is required').max(150, 'Sub-parameter name must be less than 150 characters'),
  weight: z.number().min(0, 'Weight must be non-negative').max(100, 'Weight cannot exceed 100'),
  type: z.enum(['Non-Fatal', 'Fatal', 'ZTP'], { required_error: 'Type is required' })
});

const parameterSchema = z.object({
  id: z.string().min(1, 'Parameter ID is required'),
  name: z.string().min(1, 'Parameter name is required').max(100, 'Parameter name must be less than 100 characters'),
  subParameters: z.array(subParameterSchema).min(1, 'At least one sub-parameter is required')
});

const createQAParameterSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must be less than 100 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters').max(250, 'Description must be less than 250 characters'),
  parameters: z.array(parameterSchema).min(1, 'At least one parameter group is required'),
  isActive: z.boolean().default(true),
  linkedSopId: z.string().optional()
}).refine(
  (data) => {
    const totalWeight = data.parameters
      .flatMap(p => p.subParameters)
      .reduce((sum, sp) => sum + sp.weight, 0);
    return Math.abs(totalWeight - 100) < 0.01;
  },
  {
    message: 'The sum of all sub-parameter weights must equal 100',
    path: ['parameters']
  }
);

const updateQAParameterSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must be less than 100 characters').optional(),
  description: z.string().min(5, 'Description must be at least 5 characters').max(250, 'Description must be less than 250 characters').optional(),
  parameters: z.array(parameterSchema).min(1, 'At least one parameter group is required').optional(),
  isActive: z.boolean().optional(),
  linkedSopId: z.string().optional()
}).refine(
  (data) => {
    if (!data.parameters) return true;
    const totalWeight = data.parameters
      .flatMap(p => p.subParameters)
      .reduce((sum, sp) => sum + sp.weight, 0);
    return Math.abs(totalWeight - 100) < 0.01;
  },
  {
    message: 'The sum of all sub-parameter weights must equal 100',
    path: ['parameters']
  }
);

// GET /api/qa-parameters - Get all QA parameters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const search = searchParams.get('search');
    
    let qaParameters;
    
    if (search) {
      // If search query is provided, use search functionality
      const { searchQAParameters } = await import('@/lib/qaParameterService');
      qaParameters = await searchQAParameters(search);
    } else if (active === 'true') {
      // Get only active QA parameters
      const { getActiveQAParameters } = await import('@/lib/qaParameterService');
      qaParameters = await getActiveQAParameters();
    } else {
      // Get all QA parameters
      qaParameters = await getAllQAParameters();
    }
    
    return NextResponse.json({ success: true, data: qaParameters });
  } catch (error) {
    console.error('Error fetching QA parameters:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch QA parameters' },
      { status: 500 }
    );
  }
}

// POST /api/qa-parameters - Create a new QA parameter set
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = createQAParameterSchema.safeParse(body);
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

    const qaParameterData = validationResult.data;
    
    // Add createdBy field (for now using a default value, should be from session)
    const parameterDataWithCreatedBy = {
      ...qaParameterData,
      createdBy: 'system' // TODO: Get from authenticated user session
    };
    
    const newQAParameter = await createQAParameter(parameterDataWithCreatedBy);
    
    return NextResponse.json(
      { success: true, data: newQAParameter },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating QA parameter:', error);
    
    // Handle duplicate key error (name already exists)
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'QA parameter set with this name already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create QA parameter set' },
      { status: 500 }
    );
  }
}

// PUT /api/qa-parameters/[id] - Update a QA parameter set
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const qaParameterId = url.pathname.split('/').pop();
    
    if (!qaParameterId) {
      return NextResponse.json(
        { success: false, error: 'QA parameter ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = updateQAParameterSchema.safeParse(body);
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
    const updatedQAParameter = await updateQAParameter(qaParameterId, updateData);
    
    if (!updatedQAParameter) {
      return NextResponse.json(
        { success: false, error: 'QA parameter set not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: updatedQAParameter });
  } catch (error: any) {
    console.error('Error updating QA parameter:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'QA parameter set with this name already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update QA parameter set' },
      { status: 500 }
    );
  }
}

// DELETE /api/qa-parameters/[id] - Delete a QA parameter set
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const qaParameterId = url.pathname.split('/').pop();
    
    if (!qaParameterId) {
      return NextResponse.json(
        { success: false, error: 'QA parameter ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteQAParameter(qaParameterId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'QA parameter set not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'QA parameter set deleted successfully' });
  } catch (error) {
    console.error('Error deleting QA parameter:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete QA parameter set' },
      { status: 500 }
    );
  }
}