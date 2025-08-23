import SOP, { ISOP } from '../models/SOP';
import { SOPDocument } from './models';
import mongoose from 'mongoose';

// Helper function to transform Mongoose document to SOPDocument
function transformToSOPDocument(doc: any): SOPDocument {
  return {
    _id: doc._id,
    id: doc._id.toString(),
    title: doc.title,
    content: doc.content,
    category: doc.category,
    version: doc.version,
    status: doc.status,
    linkedParameterSetId: doc.linkedParameterSetId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    createdBy: doc.createdBy,
  };
}

// Export types for use in other modules
export type { SOPDocument };

// SOP management functions
export async function createSOP(sopData: {
  title: string;
  content: string;
  category: string;
  version: string;
  status: 'Draft' | 'Published' | 'Archived';
  linkedParameterSetId?: string;
  createdBy: string;
}): Promise<SOPDocument | null> {
  try {
    const newSOP = new SOP({
      title: sopData.title,
      content: sopData.content,
      category: sopData.category,
      version: sopData.version,
      status: sopData.status,
      linkedParameterSetId: sopData.linkedParameterSetId,
      createdBy: sopData.createdBy
    });
    
    const savedSOP = await newSOP.save();
    return transformToSOPDocument(savedSOP);
  } catch (error) {
    console.error('Error creating SOP:', error);
    return null;
  }
}

export async function getSOPById(sopId: string): Promise<SOPDocument | null> {
  try {
    const result = await SOP.findById(sopId).lean();
    if (result) {
      return transformToSOPDocument(result);
    }
    return null;
  } catch (error) {
    console.error('Error getting SOP by ID:', error);
    return null;
  }
}

export async function getAllSOPs(): Promise<SOPDocument[]> {
  try {
    const results = await SOP.find({}).sort({ updatedAt: -1 }).lean();
    return results.map(transformToSOPDocument);
  } catch (error) {
    console.error('Error getting all SOPs:', error);
    return [];
  }
}

export async function getSOPsByCategory(category: string): Promise<SOPDocument[]> {
  try {
    const results = await SOP.find({ category }).sort({ updatedAt: -1 }).lean();
    return results.map(transformToSOPDocument);
  } catch (error) {
    console.error('Error getting SOPs by category:', error);
    return [];
  }
}

export async function getSOPsByStatus(status: 'Draft' | 'Published' | 'Archived'): Promise<SOPDocument[]> {
  try {
    const results = await SOP.find({ status }).sort({ updatedAt: -1 }).lean();
    return results.map(transformToSOPDocument);
  } catch (error) {
    console.error('Error getting SOPs by status:', error);
    return [];
  }
}

export async function updateSOP(sopId: string, updateData: Partial<SOPDocument>): Promise<SOPDocument | null> {
  try {
    updateData.updatedAt = new Date();
    
    const result = await SOP.findByIdAndUpdate(
      sopId,
      { $set: updateData },
      { new: true }
    ).lean();
    
    if (result) {
      return transformToSOPDocument(result);
    }
    return null;
  } catch (error) {
    console.error('Error updating SOP:', error);
    return null;
  }
}

export async function deleteSOP(sopId: string): Promise<boolean> {
  try {
    const result = await SOP.findByIdAndDelete(sopId);
    return result !== null;
  } catch (error) {
    console.error('Error deleting SOP:', error);
    return false;
  }
}

export async function searchSOPs(searchTerm: string): Promise<SOPDocument[]> {
  try {
    const searchRegex = new RegExp(searchTerm, 'i');
    
    const results = await SOP.find({
      $or: [
        { title: { $regex: searchRegex } },
        { content: { $regex: searchRegex } },
        { category: { $regex: searchRegex } }
      ]
    }).sort({ updatedAt: -1 }).lean();
    
    return results.map(transformToSOPDocument);
  } catch (error) {
    console.error('Error searching SOPs:', error);
    return [];
  }
}

export async function linkSOPToParameterSet(sopId: string, parameterSetId: string): Promise<boolean> {
  try {
    const result = await SOP.findByIdAndUpdate(
      sopId,
      { $set: { linkedParameterSetId: parameterSetId, updatedAt: new Date() } }
    );
    
    return result !== null;
  } catch (error) {
    console.error('Error linking SOP to parameter set:', error);
    return false;
  }
}

export async function unlinkSOPFromParameterSet(sopId: string): Promise<boolean> {
  try {
    const result = await SOP.findByIdAndUpdate(
      sopId,
      { $unset: { linkedParameterSetId: "" }, $set: { updatedAt: new Date() } }
    );
    
    return result !== null;
  } catch (error) {
    console.error('Error unlinking SOP from parameter set:', error);
    return false;
  }
}