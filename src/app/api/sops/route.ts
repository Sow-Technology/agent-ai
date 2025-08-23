import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSOP, getAllSOPs, updateSOP, deleteSOP, getSOPById } from '@/lib/sopService';

// Validation schemas
const createSOPSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters'),
  category: z.string().min(1, 'Category is required').max(100, 'Category must be less than 100 characters'),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  status: z.enum(['Draft', 'Published', 'Archived'], { required_error: 'Status is required' }).default('Draft'),
  linkedCampaignIds: z.array(z.string()).optional().default([])
});

const updateSOPSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters').optional(),
  category: z.string().min(1, 'Category is required').max(100, 'Category must be less than 100 characters').optional(),
  content: z.string().min(50, 'Content must be at least 50 characters').optional(),
  status: z.enum(['Draft', 'Published', 'Archived']).optional(),
  linkedCampaignIds: z.array(z.string()).optional()
});

// GET /api/sops - Get all SOPs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    let sops;
    
    if (search) {
      // If search query is provided, use search functionality
      const { searchSOPs } = await import('@/lib/sopService');
      sops = await searchSOPs(search);
    } else {
      // Get all SOPs and filter if needed
      sops = await getAllSOPs();
      
      if (category) {
        sops = sops.filter(sop => sop.category.toLowerCase() === category.toLowerCase());
      }
      
      if (status) {
        sops = sops.filter(sop => sop.status === status);
      }
    }
    
    return NextResponse.json({ success: true, data: sops });
  } catch (error) {
    console.error('Error fetching SOPs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SOPs' },
      { status: 500 }
    );
  }
}

// POST /api/sops - Create a new SOP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = createSOPSchema.safeParse(body);
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

    const sopData = validationResult.data;
    
    // Add required fields that are missing from the schema
    const sopDataWithRequiredFields = {
      ...sopData,
      version: '1.0', // Default version for new SOPs
      createdBy: 'system' // TODO: Get from authenticated user session
    };
    
    const newSOP = await createSOP(sopDataWithRequiredFields);
    
    return NextResponse.json(
      { success: true, data: newSOP },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating SOP:', error);
    
    // Handle duplicate key error (title already exists)
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'SOP with this title already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create SOP' },
      { status: 500 }
    );
  }
}

// PUT /api/sops/[id] - Update a SOP
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sopId = url.pathname.split('/').pop();
    
    if (!sopId) {
      return NextResponse.json(
        { success: false, error: 'SOP ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = updateSOPSchema.safeParse(body);
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
    const updatedSOP = await updateSOP(sopId, updateData);
    
    if (!updatedSOP) {
      return NextResponse.json(
        { success: false, error: 'SOP not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: updatedSOP });
  } catch (error: any) {
    console.error('Error updating SOP:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'SOP with this title already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update SOP' },
      { status: 500 }
    );
  }
}

// DELETE /api/sops/[id] - Delete a SOP
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sopId = url.pathname.split('/').pop();
    
    if (!sopId) {
      return NextResponse.json(
        { success: false, error: 'SOP ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteSOP(sopId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'SOP not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'SOP deleted successfully' });
  } catch (error) {
    console.error('Error deleting SOP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete SOP' },
      { status: 500 }
    );
  }
}