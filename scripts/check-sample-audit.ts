/**
 * Check a single audit to understand the score calculation
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

async function checkSample() {
  try {
    await mongoose.connect(MONGODB_URI!);
    const CallAudit = mongoose.models.CallAudit || mongoose.model('CallAudit', callAuditSchema);

    // Get one audit with high score
    const audit = await CallAudit.findOne({
      callDate: {
        $gte: new Date('2025-12-01'),
        $lte: new Date('2025-12-31')
      },
      overallScore: { $gt: 1000 }
    }).lean();

    if (!audit) {
      console.log('No audits found with score > 1000');
      await mongoose.disconnect();
      return;
    }

    const auditDoc = audit as any;
    
    console.log('\n📋 Sample Audit Analysis:');
    console.log(`   Agent: ${auditDoc.agentName}`);
    console.log(`   Overall Score: ${auditDoc.overallScore}`);
    console.log(`   Max Possible Score: ${auditDoc.maxPossibleScore || 'N/A'}`);
    console.log(`\n   Parameters (${auditDoc.auditResults.length}):`);
    console.log('   ─────────────────────────────────────────────────────');
    
    let calculatedSum = 0;
    let totalWeight = 0;
    
    auditDoc.auditResults.forEach((r: any, i: number) => {
      const weight = r.maxScore / (r.score / 100); // Reverse calculate weight
      calculatedSum += r.maxScore;
      totalWeight += weight;
      
      if (i < 5) { // Show first 5
        console.log(`   ${i + 1}. ${r.parameterName.substring(0, 50)}`);
        console.log(`      Score: ${r.score}%  |  Weighted: ${r.maxScore}  |  Weight: ~${weight.toFixed(1)}`);
      }
    });
    
    if (auditDoc.auditResults.length > 5) {
      console.log(`   ... and ${auditDoc.auditResults.length - 5} more parameters`);
    }
    
    console.log('   ─────────────────────────────────────────────────────');
    console.log(`\n   📊 Calculated Sum of Weighted Scores: ${calculatedSum.toFixed(2)}`);
    console.log(`   📊 Total Weight: ~${totalWeight.toFixed(1)}%`);
    console.log(`   📊 Stored Overall Score: ${auditDoc.overallScore}\n`);
    
    if (Math.abs(calculatedSum - auditDoc.overallScore) < 1) {
      console.log('   ✅ Overall score = sum of weighted scores');
    } else {
      console.log('   ❌ Mismatch between sum and stored score');
    }
    
    if (totalWeight > 100) {
      console.log(`   ⚠️  Weights sum to ${totalWeight.toFixed(1)}% (exceeds 100%!)`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

checkSample();
