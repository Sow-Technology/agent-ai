import CallAudit, { ICallAudit } from '../models/CallAudit';
import { AuditDocument, AuditResultDocument } from './models';
import mongoose from 'mongoose';

// Helper function to transform Mongoose document to AuditDocument
function transformToAuditDocument(doc: any): AuditDocument {
  return {
    _id: doc._id,
    id: doc._id.toString(),
    callId: doc.callId,
    agentName: doc.agentName,
    customerName: doc.customerName,
    callDate: doc.callDate,
    campaignId: doc.campaignId,
    campaignName: doc.campaignName,
    projectId: doc.projectId,
    auditResults: doc.auditResults,
    overallScore: doc.overallScore,
    maxPossibleScore: doc.maxPossibleScore,
    transcript: doc.transcript,
    audioUrl: doc.audioUrl,
    auditedBy: doc.auditedBy,
    auditType: doc.auditType,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// Export types for use in other modules
export type { AuditDocument };

// Audit management functions
export async function createAudit(auditData: {
  callId: string;
  agentName: string;
  customerName?: string;
  callDate: Date;
  campaignId: string;
  campaignName: string;
  projectId?: string;
  auditResults: AuditResultDocument[];
  overallScore: number;
  maxPossibleScore: number;
  transcript?: string;
  audioUrl?: string;
  auditedBy: string;
  auditType: 'manual' | 'ai';
}): Promise<AuditDocument | null> {
  try {
    const newAudit = new CallAudit({
      callId: auditData.callId,
      agentName: auditData.agentName,
      customerName: auditData.customerName,
      callDate: auditData.callDate,
      campaignId: auditData.campaignId,
      campaignName: auditData.campaignName,
      projectId: auditData.projectId,
      auditResults: auditData.auditResults,
      overallScore: auditData.overallScore,
      maxPossibleScore: auditData.maxPossibleScore,
      transcript: auditData.transcript,
      audioUrl: auditData.audioUrl,
      auditedBy: auditData.auditedBy,
      auditType: auditData.auditType
    });
    
    const savedAudit = await newAudit.save();

    return {
      _id: savedAudit._id,
      id: savedAudit._id.toString(),
      callId: savedAudit.callId,
      agentName: savedAudit.agentName,
      customerName: savedAudit.customerName,
      callDate: savedAudit.callDate,
      campaignId: savedAudit.campaignId,
      campaignName: savedAudit.campaignName,
      projectId: savedAudit.projectId,
      auditResults: savedAudit.auditResults,
      overallScore: savedAudit.overallScore,
      maxPossibleScore: savedAudit.maxPossibleScore,
      transcript: savedAudit.transcript,
      audioUrl: savedAudit.audioUrl,
      auditedBy: savedAudit.auditedBy,
      auditType: savedAudit.auditType,
      createdAt: savedAudit.createdAt,
      updatedAt: savedAudit.updatedAt,
    };
  } catch (error) {
    console.error('Error creating audit:', error);
    return null;
  }
}

export async function getAuditById(auditId: string): Promise<AuditDocument | null> {
  try {
    const result = await CallAudit.findById(auditId).lean();
    if (result) {
      return transformToAuditDocument(result);
    }
    return null;
  } catch (error) {
    console.error('Error getting audit by ID:', error);
    return null;
  }
}

export async function getAllAudits(): Promise<AuditDocument[]> {
  try {
    const results = await CallAudit.find({}).sort({ createdAt: -1 }).lean();
    return results.map(transformToAuditDocument);
  } catch (error) {
    console.error('Error getting all audits:', error);
    return [];
  }
}

export async function getAuditsByAgent(agentName: string): Promise<AuditDocument[]> {
  try {
    const results = await CallAudit.find({ agentName }).sort({ createdAt: -1 }).lean();
    return results.map(transformToAuditDocument);
  } catch (error) {
    console.error('Error getting audits by agent:', error);
    return [];
  }
}

export async function getAuditsByCampaign(campaignId: string): Promise<AuditDocument[]> {
  try {
    const results = await CallAudit.find({ campaignId }).sort({ createdAt: -1 }).lean();
    return results.map(transformToAuditDocument);
  } catch (error) {
    console.error('Error getting audits by campaign:', error);
    return [];
  }
}

export async function getAuditsByDateRange(startDate: Date, endDate: Date): Promise<AuditDocument[]> {
  try {
    const results = await CallAudit.find({
      callDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ createdAt: -1 }).lean();
    return results.map(transformToAuditDocument);
  } catch (error) {
    console.error('Error getting audits by date range:', error);
    return [];
  }
}

export async function getAuditsByType(auditType: 'manual' | 'ai'): Promise<AuditDocument[]> {
  try {
    const results = await CallAudit.find({ auditType }).sort({ createdAt: -1 }).lean();
    return results.map(transformToAuditDocument);
  } catch (error) {
    console.error('Error getting audits by type:', error);
    return [];
  }
}

export async function updateAudit(auditId: string, updateData: Partial<AuditDocument>): Promise<AuditDocument | null> {
  try {
    const result = await CallAudit.findByIdAndUpdate(
      auditId,
      { $set: { ...updateData, updatedAt: new Date() } },
      { new: true }
    ).lean();
    if (result) {
      return transformToAuditDocument(result);
    }
    return null;
  } catch (error) {
    console.error('Error updating audit:', error);
    return null;
  }
}

export async function deleteAudit(auditId: string): Promise<boolean> {
  try {
    const result = await CallAudit.findByIdAndDelete(auditId);
    return result !== null;
  } catch (error) {
    console.error('Error deleting audit:', error);
    return false;
  }
}

export async function searchAudits(searchTerm: string): Promise<AuditDocument[]> {
  try {
    const searchRegex = new RegExp(searchTerm, 'i');
    
    const results = await CallAudit.find({
      $or: [
        { callId: { $regex: searchRegex } },
        { agentName: { $regex: searchRegex } },
        { customerName: { $regex: searchRegex } },
        { campaignName: { $regex: searchRegex } }
      ]
    }).sort({ createdAt: -1 }).lean();
    
    return results.map(transformToAuditDocument);
  } catch (error) {
    console.error('Error searching audits:', error);
    return [];
  }
}

// Analytics functions
export async function getAuditStatistics(): Promise<{
  totalAudits: number;
  manualAudits: number;
  aiAudits: number;
  averageScore: number;
  scoreDistribution: { range: string; count: number }[];
}> {
  try {
    const totalAudits = await CallAudit.countDocuments();
    const manualAudits = await CallAudit.countDocuments({ auditType: 'manual' });
    const aiAudits = await CallAudit.countDocuments({ auditType: 'ai' });
    
    // Calculate average score
    const avgResult = await CallAudit.aggregate([
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$overallScore' }
        }
      }
    ]);
    
    const averageScore = avgResult.length > 0 ? Math.round(avgResult[0].averageScore * 100) / 100 : 0;
    
    // Score distribution
    const scoreDistribution = await CallAudit.aggregate([
      {
        $bucket: {
          groupBy: '$overallScore',
          boundaries: [0, 20, 40, 60, 80, 100],
          default: '100+',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);
    
    const formattedDistribution = scoreDistribution.map(bucket => ({
      range: typeof bucket._id === 'number' ? `${bucket._id}-${bucket._id + 19}` : bucket._id,
      count: bucket.count
    }));
    
    return {
      totalAudits,
      manualAudits,
      aiAudits,
      averageScore,
      scoreDistribution: formattedDistribution
    };
  } catch (error) {
    console.error('Error getting audit statistics:', error);
    return {
      totalAudits: 0,
      manualAudits: 0,
      aiAudits: 0,
      averageScore: 0,
      scoreDistribution: []
    };
  }
}

export async function getAgentPerformanceStats(): Promise<{
  agentName: string;
  totalAudits: number;
  averageScore: number;
  passRate: number;
}[]> {
  try {
    const agentStats = await CallAudit.aggregate([
      {
        $group: {
          _id: '$agentName',
          totalAudits: { $sum: 1 },
          averageScore: { $avg: '$overallScore' },
          passCount: {
            $sum: {
              $cond: [{ $gte: ['$overallScore', 70] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          agentName: '$_id',
          totalAudits: 1,
          averageScore: { $round: ['$averageScore', 2] },
          passRate: {
            $round: [
              { $multiply: [{ $divide: ['$passCount', '$totalAudits'] }, 100] },
              2
            ]
          }
        }
      },
      {
        $sort: { averageScore: -1 }
      }
    ]);
    
    return agentStats as {
      agentName: string;
      totalAudits: number;
      averageScore: number;
      passRate: number;
    }[];
  } catch (error) {
    console.error('Error getting agent performance stats:', error);
    return [];
  }
}

export async function getCampaignPerformanceStats(): Promise<{
  campaignName: string;
  campaignId: string;
  totalAudits: number;
  averageScore: number;
  complianceRate: number;
}[]> {
  try {
    const campaignStats = await CallAudit.aggregate([
      {
        $group: {
          _id: { campaignId: '$campaignId', campaignName: '$campaignName' },
          totalAudits: { $sum: 1 },
          averageScore: { $avg: '$overallScore' },
          compliantCount: {
            $sum: {
              $cond: [{ $gte: ['$overallScore', 70] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          campaignId: '$_id.campaignId',
          campaignName: '$_id.campaignName',
          totalAudits: 1,
          averageScore: { $round: ['$averageScore', 2] },
          complianceRate: {
            $round: [
              { $multiply: [{ $divide: ['$compliantCount', '$totalAudits'] }, 100] },
              2
            ]
          }
        }
      },
      {
        $sort: { averageScore: -1 }
      }
    ]);
    
    return campaignStats as {
      campaignName: string;
      campaignId: string;
      totalAudits: number;
      averageScore: number;
      complianceRate: number;
    }[];
  } catch (error) {
    console.error('Error getting campaign performance stats:', error);
    return [];
  }
}