/**
 * Fix Database Scores Properly
 * 
 * This script will:
 * 1. Check the current state of scores in the database
 * 2. Recalculate them properly as percentages
 * 3. Apply ZTP rule
 * 
 * Run with: npx tsx scripts/fix-database-scores.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sop-management';

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
  callDate: Date,
  auditResults: [auditResultSchema],
  overallScore: Number,
  maxPossibleScore: Number,
}, { timestamps: true });

async function fixScores() {
  console.log('🔧 Starting Database Score Fix...\n');

  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    const CallAudit = mongoose.models.CallAudit || mongoose.model('CallAudit', callAuditSchema);

    const audits = await CallAudit.find({}).lean();
    console.log(`📋 Found ${audits.length} total audits\n`);

    // Sample some scores first
    console.log('📊 Sample of current scores:');
    const samples = audits.filter(a => (a as any).overallScore > 0).slice(0, 5);
    samples.forEach((audit: any) => {
      console.log(`   Score: ${audit.overallScore}, MaxPossible: ${audit.maxPossibleScore || 'N/A'}`);
    });
    console.log('');

    let fixedCount = 0;
    let ztpCount = 0;
    let alreadyCorrectCount = 0;

    for (const audit of audits) {
      const auditDoc = audit as any;
      const currentScore = auditDoc.overallScore || 0;
      const auditResults = auditDoc.auditResults || [];
      
      // Skip if already 0 from ZTP
      if (currentScore === 0) {
        ztpCount++;
        continue;
      }

      // Calculate the correct score
      // maxScore in auditResults appears to be the weighted score
      // We need to sum them, then normalize by maxPossibleScore
      const sumOfWeightedScores = auditResults.reduce((sum: number, r: any) => sum + (r.maxScore || 0), 0);
      const maxPossible = auditDoc.maxPossibleScore || 100;
      
      // If the sum exceeds maxPossible, we need to normalize
      let correctedScore = sumOfWeightedScores;
      if (maxPossible > 0 && sumOfWeightedScores > maxPossible) {
        // Normalize to 0-100 scale
        correctedScore = (sumOfWeightedScores / maxPossible) * 100;
      }
      
      // Check for ZTP rule: Fatal < 50
      const hasFatalFailure = auditResults.some((r: any) => r.type === 'Fatal' && r.score < 50);
      if (hasFatalFailure) {
        correctedScore = 0;
      }
      
      // Round to 1 decimal
      correctedScore = Math.round(correctedScore * 10) / 10;
      
      // Only update if different
      if (Math.abs(currentScore - correctedScore) > 0.1) {
        await CallAudit.updateOne(
          { _id: auditDoc._id },
          { $set: { overallScore: correctedScore } }
        );
        fixedCount++;
        
        if (fixedCount <= 5) {
          console.log(`✅ Fixed ${auditDoc._id}: ${currentScore} → ${correctedScore}`);
        }
      } else {
        alreadyCorrectCount++;
      }
    }

    if (fixedCount > 5) {
      console.log(`   ... and ${fixedCount - 5} more audits fixed`);
    }

    console.log('\n📊 Fix Summary:');
    console.log(`   Total audits: ${audits.length}`);
    console.log(`   Fixed (recalculated): ${fixedCount}`);
    console.log(`   Already at score 0 (ZTP): ${ztpCount}`);
    console.log(`   Already correct: ${alreadyCorrectCount}`);
    console.log('\n✅ Database fix completed!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixScores();
