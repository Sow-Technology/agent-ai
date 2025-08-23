import QAParameter, { IQAParameter } from '../models/QAParameter';
import { QAParameterDocument, ParameterDocument, SubParameterDocument } from './models';
import mongoose from 'mongoose';

// Helper function to transform Mongoose document to QAParameterDocument
function transformToQAParameterDocument(doc: any): QAParameterDocument {
  return {
    _id: doc._id,
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    parameters: doc.parameters,
    isActive: doc.isActive,
    linkedSopId: doc.linkedSopId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    createdBy: doc.createdBy,
  };
}

// Export types for use in other modules
export type { QAParameterDocument };

// QA Parameter management functions
export async function createQAParameter(parameterData: {
  name: string;
  description: string;
  parameters: ParameterDocument[];
  isActive: boolean;
  linkedSopId?: string;
  createdBy: string;
}): Promise<QAParameterDocument | null> {
  try {
    const newQAParameter = new QAParameter({
      name: parameterData.name,
      description: parameterData.description,
      parameters: parameterData.parameters,
      isActive: parameterData.isActive,
      linkedSopId: parameterData.linkedSopId,
      createdBy: parameterData.createdBy
    });
    
    const savedParameter = await newQAParameter.save();
    return transformToQAParameterDocument(savedParameter);
  } catch (error) {
    console.error('Error creating QA parameter:', error);
    return null;
  }
}

export async function getQAParameterById(parameterId: string): Promise<QAParameterDocument | null> {
  try {
    const result = await QAParameter.findById(parameterId).lean();
    if (result) {
      return transformToQAParameterDocument(result);
    }
    return null;
  } catch (error) {
    console.error('Error getting QA parameter by ID:', error);
    return null;
  }
}

export async function getAllQAParameters(): Promise<QAParameterDocument[]> {
  try {
    const results = await QAParameter.find({}).sort({ updatedAt: -1 }).lean();
    return results.map(transformToQAParameterDocument);
  } catch (error) {
    console.error('Error getting all QA parameters:', error);
    return [];
  }
}

export async function getActiveQAParameters(): Promise<QAParameterDocument[]> {
  try {
    const results = await QAParameter.find({ isActive: true }).sort({ updatedAt: -1 }).lean();
    return results.map(transformToQAParameterDocument);
  } catch (error) {
    console.error('Error getting active QA parameters:', error);
    return [];
  }
}

export async function updateQAParameter(parameterId: string, updateData: Partial<QAParameterDocument>): Promise<QAParameterDocument | null> {
  try {
    updateData.updatedAt = new Date();
    
    const result = await QAParameter.findByIdAndUpdate(
      parameterId,
      { $set: updateData },
      { new: true }
    ).lean();
    
    if (result) {
      return transformToQAParameterDocument(result);
    }
    return null;
  } catch (error) {
    console.error('Error updating QA parameter:', error);
    return null;
  }
}

export async function deleteQAParameter(parameterId: string): Promise<boolean> {
  try {
    const result = await QAParameter.findByIdAndDelete(parameterId);
    return result !== null;
  } catch (error) {
    console.error('Error deleting QA parameter:', error);
    return false;
  }
}

export async function searchQAParameters(searchTerm: string): Promise<QAParameterDocument[]> {
  try {
    const searchRegex = new RegExp(searchTerm, 'i');
    
    const results = await QAParameter.find({
      $or: [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } }
      ]
    }).sort({ updatedAt: -1 }).lean();

    return results.map(transformToQAParameterDocument);
  } catch (error) {
    console.error('Error searching QA parameters:', error);
    return [];
  }
}

export async function toggleQAParameterStatus(parameterId: string): Promise<QAParameterDocument | null> {
  try {
    const currentParameter = await QAParameter.findById(parameterId).lean() as IQAParameter | null;
    if (!currentParameter) {
      return null;
    }
    
    const result = await QAParameter.findByIdAndUpdate(
      parameterId,
      { $set: { isActive: !currentParameter.isActive, updatedAt: new Date() } },
      { new: true }
    ).lean();
    
    if (result) {
      return transformToQAParameterDocument(result);
    }
    return null;
  } catch (error) {
    console.error('Error toggling QA parameter status:', error);
    return null;
  }
}

export async function linkQAParameterToSOP(parameterId: string, sopId: string): Promise<boolean> {
  try {
    const result = await QAParameter.findByIdAndUpdate(
      parameterId,
      { $set: { linkedSopId: sopId, updatedAt: new Date() } }
    );
    
    return result !== null;
  } catch (error) {
    console.error('Error linking QA parameter to SOP:', error);
    return false;
  }
}

export async function unlinkQAParameterFromSOP(parameterId: string): Promise<boolean> {
  try {
    const result = await QAParameter.findByIdAndUpdate(
      parameterId,
      { $unset: { linkedSopId: "" }, $set: { updatedAt: new Date() } }
    );
    
    return result !== null;
  } catch (error) {
    console.error('Error unlinking QA parameter from SOP:', error);
    return false;
  }
}

// Helper functions for parameter structure
export function createSubParameter(name: string, weight: number, type: 'Fatal' | 'Non-Fatal' | 'ZTP'): SubParameterDocument {
  return {
    id: `sub_param_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    weight,
    type
  };
}

export function createParameter(name: string, subParameters: SubParameterDocument[]): ParameterDocument {
  return {
    id: `param_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    subParameters
  };
}

export async function duplicateQAParameter(parameterId: string, newName: string, createdBy: string): Promise<QAParameterDocument | null> {
  try {
    const originalParameter = await getQAParameterById(parameterId);
    if (!originalParameter) {
      return null;
    }
    
    // Create a copy with new IDs
    const duplicatedParameters = originalParameter.parameters.map(param => ({
      ...param,
      id: `param_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      subParameters: param.subParameters.map(subParam => ({
        ...subParam,
        id: `sub_param_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }))
    }));
    
    return await createQAParameter({
      name: newName,
      description: `Copy of ${originalParameter.description}`,
      parameters: duplicatedParameters,
      isActive: false, // Start as inactive
      linkedSopId: originalParameter.linkedSopId,
      createdBy
    });
  } catch (error) {
    console.error('Error duplicating QA parameter:', error);
    return null;
  }
}