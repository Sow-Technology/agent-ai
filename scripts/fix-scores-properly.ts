/**
 * PROPER FIX: Recalculate Overall Score as AVERAGE of parameter scores
 * 
 * The issue: maxScore == score (not weighted). Summing them gives 600 instead of 100%.
 * Solution: Calculate average of all parameter scores, then apply ZTP rule.
 * 
 * Run with: npx tsx scripts/fix-scores-properly.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sop-management';

async function fixScoresProperly() {
  console.log('🔧 Starting PROPER Score Fix...\n');
  console.log('📋 Method: Calculate AVERAGE of parameter scores, then apply ZTP\n');

  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No DB connection');

    const audits = await db.collection('callaudits').find({}).toArray();
    console.log(`📋 Found ${audits.length} total audits\n`);

    let fixedCount = 0;
    let ztpCount = 0;
    let unchangedCount = 0;

    for (const audit of audits) {
      const auditResults = audit.auditResults || [];
      
      if (auditResults.length === 0) {
        unchangedCount++;
        continue;
      }

      // Calculate AVERAGE of parameter scores
      const sumOfScores = auditResults.reduce((sum: number, r: any) => sum + (r.score || 0), 0);
      let averageScore = sumOfScores / auditResults.length;

      // Check ZTP: If any Fatal parameter score < 50, overall = 0
      const hasFatalFailure = auditResults.some(
        (r: any) => r.type === 'Fatal' && (r.score || 0) < 50
      );

      let finalScore = hasFatalFailure ? 0 : Math.round(averageScore * 10) / 10;

      // Check if update needed
      const currentScore = audit.overallScore || 0;
      
      if (Math.abs(currentScore - finalScore) > 0.1) {
        await db.collection('callaudits').updateOne(
          { _id: audit._id },
          { $set: { overallScore: finalScore } }
        );
        
        if (hasFatalFailure) {
          ztpCount++;
        } else {
          fixedCount++;
        }
        
        if (fixedCount + ztpCount <= 10) {
          console.log(`✅ ${audit._id}: ${currentScore} → ${finalScore}${hasFatalFailure ? ' (ZTP)' : ''}`);
        }
      } else {
        unchangedCount++;
      }
    }

    if (fixedCount + ztpCount > 10) {
      console.log(`   ... and ${fixedCount + ztpCount - 10} more audits updated`);
    }

    console.log('\n📊 Fix Summary:');
    console.log(`   Total audits: ${audits.length}`);
    console.log(`   Fixed (recalculated average): ${fixedCount}`);
    console.log(`   Fixed (ZTP applied): ${ztpCount}`);
    console.log(`   Unchanged: ${unchangedCount}`);

    // Verify with a sample
    console.log('\n📋 Verification - Sample scores after fix:');
    const samples = await db.collection('callaudits').find({ overallScore: { $gt: 0 } }).limit(5).toArray();
    samples.forEach((s: any) => {
      console.log(`   ${s.agentName}: ${s.overallScore}%`);
    });

    console.log('\n✅ PROPER fix completed!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixScoresProperly();
