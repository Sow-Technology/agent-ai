/**
 * Diagnostic Script: Analyze QA Score Calculations
 * 
 * This script queries the database and shows all the calculations
 * to understand where the 79.4% Overall QA Score comes from.
 * 
 * Run with: npx tsx scripts/analyze-qa-calculations.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sop-management';

console.log(`📡 Using MongoDB URI: ${MONGODB_URI.substring(0, 30)}...`);

// Define the audit schema
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

async function analyzeCalculations() {
  console.log('🔍 Starting QA Calculations Analysis...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    const CallAudit = mongoose.models.CallAudit || mongoose.model('CallAudit', callAuditSchema);

    // Filter by December 2025 (same as dashboard)
    const startDate = new Date('2025-12-01T00:00:00.000Z');
    const endDate = new Date('2025-12-31T23:59:59.999Z');

    const audits = await CallAudit.find({
      callDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).lean();

    console.log(`📋 Found ${audits.length} audits in December 2025\n`);

    // Calculate various metrics
    let totalScore = 0;
    let totalScoreExcludingZeros = 0;
    let auditsWithZeroScore = 0;
    let auditsWithFatalErrors = 0;
    let auditsWithFatalBelow50 = 0;
    let nonZeroCount = 0;

    const scoreDistribution: Record<string, number> = {
      '0': 0,
      '1-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    };

    audits.forEach((audit: any) => {
      const score = audit.overallScore || 0;
      totalScore += score;

      // Score distribution
      if (score === 0) {
        scoreDistribution['0']++;
        auditsWithZeroScore++;
      } else {
        totalScoreExcludingZeros += score;
        nonZeroCount++;
        
        if (score <= 20) scoreDistribution['1-20']++;
        else if (score <= 40) scoreDistribution['21-40']++;
        else if (score <= 60) scoreDistribution['41-60']++;
        else if (score <= 80) scoreDistribution['61-80']++;
        else scoreDistribution['81-100']++;
      }

      // Check for fatal errors
      const auditResults = audit.auditResults || [];
      const hasFatalError = auditResults.some((r: any) => r.type === 'Fatal' && r.score < 80);
      const hasFatalBelow50 = auditResults.some((r: any) => r.type === 'Fatal' && r.score < 50);
      
      if (hasFatalError) auditsWithFatalErrors++;
      if (hasFatalBelow50) auditsWithFatalBelow50++;
    });

    // Calculate averages
    const overallAverage = audits.length > 0 ? totalScore / audits.length : 0;
    const averageExcludingZeros = nonZeroCount > 0 ? totalScoreExcludingZeros / nonZeroCount : 0;

    // Display results
    console.log('═══════════════════════════════════════════════════════');
    console.log('                   CALCULATION RESULTS                 ');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📊 BASIC STATISTICS:');
    console.log(`   Total Audits: ${audits.length}`);
    console.log(`   Audits with score = 0: ${auditsWithZeroScore} (${(auditsWithZeroScore / audits.length * 100).toFixed(1)}%)`);
    console.log(`   Audits with score > 0: ${nonZeroCount} (${(nonZeroCount / audits.length * 100).toFixed(1)}%)\n`);

    console.log('📈 SCORE AVERAGES:');
    console.log(`   Overall Average (including zeros): ${overallAverage.toFixed(1)}%`);
    console.log(`   Average (excluding zeros): ${averageExcludingZeros.toFixed(1)}%\n`);

    console.log('🔴 FATAL ERRORS:');
    console.log(`   Audits with Fatal < 80: ${auditsWithFatalErrors} (${(auditsWithFatalErrors / audits.length * 100).toFixed(1)}%)`);
    console.log(`   Audits with Fatal < 50 (ZTP): ${auditsWithFatalBelow50} (${(auditsWithFatalBelow50 / audits.length * 100).toFixed(1)}%)\n`);

    console.log('📊 SCORE DISTRIBUTION:');
    Object.entries(scoreDistribution).forEach(([range, count]) => {
      const percentage = (count / audits.length * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(count / audits.length * 50));
      console.log(`   ${range.padEnd(10)} ${count.toString().padStart(4)} (${percentage.padStart(5)}%)  ${bar}`);
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('                  DASHBOARD COMPARISON                 ');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Dashboard shows:');
    console.log('   - Overall QA Score: 79.4%');
    console.log('   - Fatal Rate: 89.8% (919 audits)');
    console.log('   - ZTP Triggered: 89.8% (919 audits)\n');

    console.log('Our calculations show:');
    console.log(`   - Overall Average (incl. zeros): ${overallAverage.toFixed(1)}%`);
    console.log(`   - Overall Average (excl. zeros): ${averageExcludingZeros.toFixed(1)}%`);
    console.log(`   - Fatal Rate (< 80): ${(auditsWithFatalErrors / audits.length * 100).toFixed(1)}%`);
    console.log(`   - ZTP Rate (< 50): ${(auditsWithFatalBelow50 / audits.length * 100).toFixed(1)}%\n`);

    console.log('💡 ANALYSIS:');
    if (Math.abs(averageExcludingZeros - 79.4) < 1) {
      console.log('   ✅ The "Overall QA Score" is the average EXCLUDING zero scores!');
      console.log('   📌 This means it only averages the "passing" audits.\n');
    } else if (Math.abs(overallAverage - 79.4) < 1) {
      console.log('   ✅ The "Overall QA Score" is the true average INCLUDING zeros.\n');
    } else {
      console.log('   ⚠️  Neither calculation matches 79.4% - investigating further...\n');
    }

    console.log('✅ Analysis completed successfully!\n');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the analysis
analyzeCalculations();
