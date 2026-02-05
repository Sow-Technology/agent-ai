/**
 * Migration Script: Apply ZTP Logic to Existing Audits
 * 
 * This script updates all existing audits to apply the new ZTP rule:
 * If any Fatal parameter has score > 50%, set overall score to 0.
 * 
 * Run with: npx tsx scripts/migrate-ztp-scores.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' }); // Also try .env file

// Use the same pattern as src/lib/mongoose.ts
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sop-management';

console.log(`📡 Using MongoDB URI: ${MONGODB_URI.substring(0, 30)}...`);

// Define the audit schema inline for the script
const auditResultSchema = new mongoose.Schema({
  parameterId: String,
  parameterName: String,
  score: Number,
  maxScore: Number,
  type: String,
  comments: String,
});

const callAuditSchema = new mongoose.Schema({
  callId: String,
  agentName: String,
  agentUserId: String,
  customerName: String,
  callDate: Date,
  campaignId: String,
  campaignName: String,
  projectId: String,
  auditResults: [auditResultSchema],
  overallScore: Number,
  maxPossibleScore: Number,
  transcript: String,
  englishTranslation: String,
  audioUrl: String,
  auditedBy: String,
  auditType: String,
  tokenUsage: {
    inputTokens: Number,
    outputTokens: Number,
    totalTokens: Number,
  },
  auditDurationMs: Number,
  audioHash: String,
}, { timestamps: true });

async function migrateAudits() {
  console.log('🔄 Starting ZTP Migration Script...');
  console.log('📊 Rule: If any Fatal parameter score > 50%, set overall score to 0\n');

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
    let skippedCount = 0;
    let alreadyZeroCount = 0;

    for (const audit of audits) {
      const auditDoc = audit as any;
      const auditId = auditDoc._id.toString();
      const currentScore = auditDoc.overallScore || 0;
      
      // Check if any Fatal parameter has score < 50
      const auditResults = auditDoc.auditResults || [];
      const hasFatalFailure = auditResults.some(
        (r: any) => r.type === 'Fatal' && r.score < 50
      );

      if (hasFatalFailure) {
        if (currentScore === 0) {
          // Already zero, no need to update
          alreadyZeroCount++;
          console.log(`⏭️  Audit ${auditId}: Already has score 0 (skipping)`);
        } else {
          // Update the score to 0
          await CallAudit.updateOne(
            { _id: auditDoc._id },
            { $set: { overallScore: 0 } }
          );
          updatedCount++;
          console.log(`✅ Audit ${auditId}: Updated score from ${currentScore} to 0 (Fatal parameter < 50, ZTP triggered)`);
        }
      } else {
        skippedCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Total audits processed: ${audits.length}`);
    console.log(`   Updated to score 0: ${updatedCount}`);
    console.log(`   Already had score 0: ${alreadyZeroCount}`);
    console.log(`   No Fatal failure (unchanged): ${skippedCount}`);
    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the migration
migrateAudits();
