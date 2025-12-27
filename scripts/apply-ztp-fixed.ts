/**
 * Fixed Migration Script: Apply ZTP Without Recalculation
 * 
 * This script applies ZTP logic to existing scores WITHOUT recalculating them.
 * It preserves the AI's original score calculations.
 * 
 * Run with: npx tsx scripts/apply-ztp-fixed.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sop-management';

console.log(`📡 Using MongoDB URI: ${MONGODB_URI.substring(0, 30)}...`);

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
  auditResults: [auditResultSchema],
  overallScore: Number,
  maxPossibleScore: Number,
}, { timestamps: true });

async function applyZTP() {
  console.log('🔄 Starting ZTP Application (No Recalculation)...');
  console.log('📊 Rule: If any Fatal parameter score < 50%, set overall score to 0\n');

  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    const CallAudit = mongoose.models.CallAudit || mongoose.model('CallAudit', callAuditSchema);

    // Get all audits
    const audits = await CallAudit.find({}).lean();
    console.log(`📋 Found ${audits.length} total audits\n`);

    let ztpAppliedCount = 0;
    let normalScoringCount = 0;
    let alreadyZeroCount = 0;

    for (const audit of audits) {
      const auditDoc = audit as any;
      const currentScore = auditDoc.overallScore || 0;
      
      // Check if any Fatal parameter has score < 50
      const auditResults = auditDoc.auditResults || [];
      const hasFatalFailure = auditResults.some(
        (r: any) => r.type === 'Fatal' && r.score < 50
      );

      if (hasFatalFailure) {
        if (currentScore !== 0) {
          // Apply ZTP
          await CallAudit.updateOne(
            { _id: auditDoc._id },
            { $set: { overallScore: 0 } }
          );
          ztpAppliedCount++;
          if (ztpAppliedCount <= 5) {
            console.log(`✅ ZTP applied: ${auditDoc._id} (was ${currentScore}, now 0)`);
          }
        } else {
          alreadyZeroCount++;
        }
      } else {
        normalScoringCount++;
      }
    }

    if (ztpAppliedCount > 5) {
      console.log(`   ... and ${ztpAppliedCount - 5} more audits`);
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Total audits processed: ${audits.length}`);
    console.log(`   ZTP applied (set to 0): ${ztpAppliedCount}`);
    console.log(`   Already had score 0: ${alreadyZeroCount}`);
    console.log(`   Normal scoring (no ZTP): ${normalScoringCount}`);
    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

applyZTP();
