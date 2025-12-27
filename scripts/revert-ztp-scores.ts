/**
 * Revert Script: Recalculate Overall Scores
 * 
 * This script ignores the ZTP override and recalculates the overall score
 * by summing the weighted scores (stored as maxScore) of all parameter results.
 * 
 * Run with: npx tsx scripts/revert-ztp-scores.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Use the same pattern as src/lib/mongoose.ts
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sop-management';

console.log(`📡 Using MongoDB URI: ${MONGODB_URI.substring(0, 30)}...`);

// Define the audit schema inline for the script
const auditResultSchema = new mongoose.Schema({
  parameterId: String,
  parameterName: String,
  score: Number,
  maxScore: Number, // This stores the weighted score
  type: String,
  comments: String,
});

const callAuditSchema = new mongoose.Schema({
  callId: String,
  auditResults: [auditResultSchema],
  overallScore: Number,
}, { timestamps: true });

async function revertScores() {
  console.log('🔄 Starting Score Revert Script...');
  console.log('📊 Operation: Recalculate overallScore from sum of auditResults.maxScore');

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    // Get or create the model
    const CallAudit = mongoose.models.CallAudit || mongoose.model('CallAudit', callAuditSchema);

    // Find all audits
    const audits = await CallAudit.find({}).lean();
    console.log(`📋 Found ${audits.length} total audits\n`);

    let updatedCount = 0;
    let unchangedCount = 0;

    for (const audit of audits) {
      const auditDoc = audit as any;
      const auditId = auditDoc._id.toString();
      const currentScore = auditDoc.overallScore || 0;
      
      // Recalculate score from components
      const auditResults = auditDoc.auditResults || [];
      const recalculatedScore = auditResults.reduce((sum: number, r: any) => sum + (r.maxScore || 0), 0);
      
      // Round to 2 decimal places to match typical precision
      const roundedScore = Math.round(recalculatedScore * 100) / 100;

      if (currentScore !== roundedScore) {
        // Update the score
        await CallAudit.updateOne(
          { _id: auditDoc._id },
          { $set: { overallScore: roundedScore } }
        );
        updatedCount++;
        console.log(`✅ Audit ${auditId}: Reverted score from ${currentScore} to ${roundedScore}`);
      } else {
        unchangedCount++;
      }
    }

    console.log('\n📊 Revert Summary:');
    console.log(`   Total audits processed: ${audits.length}`);
    console.log(`   Scores updated (reverted): ${updatedCount}`);
    console.log(`   Scores unchanged: ${unchangedCount}`);
    console.log('\n✅ Revert completed successfully!');

  } catch (error) {
    console.error('❌ Revert failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the revert
revertScores();
