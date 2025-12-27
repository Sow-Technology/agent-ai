/**
 * Deep Diagnostic: Understand the exact database structure
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sop-management';

async function diagnose() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected\n');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No DB connection');
    
    // Get one non-zero score audit to analyze
    const audit = await db.collection('callaudits').findOne({
      overallScore: { $gt: 0 }
    });

    if (!audit) {
      console.log('No audits with score > 0 found');
      return;
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('              SINGLE AUDIT DEEP ANALYSIS               ');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log(`ID: ${audit._id}`);
    console.log(`Agent: ${audit.agentName || 'N/A'}`);
    console.log(`Overall Score (in DB): ${audit.overallScore}`);
    console.log(`Max Possible Score: ${audit.maxPossibleScore || 'N/A'}`);
    console.log(`Call Date: ${audit.callDate}`);
    console.log('');

    const results = audit.auditResults || [];
    console.log(`📊 Audit Results (${results.length} parameters):\n`);

    let sumOfScores = 0;
    let sumOfMaxScores = 0;
    let sumOfWeights = 0;

    results.forEach((r: any, i: number) => {
      const score = r.score || 0;
      const maxScore = r.maxScore || 0;
      const weight = r.weight || 'N/A';
      const weightedScore = r.weightedScore || 'N/A';
      
      sumOfScores += score;
      sumOfMaxScores += maxScore;
      if (typeof weight === 'number') sumOfWeights += weight;

      if (i < 10) { // Show first 10
        console.log(`${(i+1).toString().padStart(2)}. ${(r.parameter || r.parameterName || 'Unknown').substring(0, 50)}`);
        console.log(`    score: ${score} | maxScore: ${maxScore} | weight: ${weight} | weightedScore: ${weightedScore} | type: ${r.type || 'N/A'}`);
      }
    });

    if (results.length > 10) {
      console.log(`    ... and ${results.length - 10} more parameters\n`);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('                    CALCULATIONS                        ');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log(`Sum of all "score" values: ${sumOfScores}`);
    console.log(`Sum of all "maxScore" values: ${sumOfMaxScores}`);
    console.log(`Sum of all "weight" values: ${sumOfWeights || 'N/A (no weight field)'}`);
    console.log(`Stored overallScore: ${audit.overallScore}`);
    console.log(`Stored maxPossibleScore: ${audit.maxPossibleScore || 'N/A'}`);

    console.log('\n💡 INTERPRETATION:');
    if (Math.abs(sumOfMaxScores - audit.overallScore) < 1) {
      console.log('   overallScore = sum of maxScore values');
    }
    if (audit.maxPossibleScore && sumOfWeights && Math.abs(sumOfWeights - audit.maxPossibleScore) < 1) {
      console.log('   maxPossibleScore = sum of weight values');
    }

    // What SHOULD the score be?
    // If score is 0-100 and maxScore is the weighted contribution...
    // Then overallScore should be sum of maxScores if weights sum to 100
    // But if weights sum to more, we need to normalize

    const correctPercentage = audit.maxPossibleScore 
      ? (sumOfMaxScores / audit.maxPossibleScore) * 100 
      : sumOfMaxScores;
    console.log(`\n📐 If we normalize: ${sumOfMaxScores} / ${audit.maxPossibleScore || 100} * 100 = ${correctPercentage.toFixed(1)}%`);

    // Also check another audit at score 0
    const ztpAudit = await db.collection('callaudits').findOne({
      overallScore: 0
    });

    if (ztpAudit) {
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('          SAMPLE ZTP AUDIT (score = 0)                 ');
      console.log('═══════════════════════════════════════════════════════\n');

      console.log(`Agent: ${ztpAudit.agentName}`);
      const ztpResults = ztpAudit.auditResults || [];
      const fatalParams = ztpResults.filter((r: any) => r.type === 'Fatal');
      console.log(`Fatal parameters: ${fatalParams.length}`);
      fatalParams.forEach((r: any) => {
        console.log(`   - ${r.parameter}: score ${r.score}%`);
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

diagnose();
