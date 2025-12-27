/**
 * Find Audits with Invalid Scores (> 100)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sop-management';

const callAuditSchema = new mongoose.Schema({
  callId: String,
  agentName: String,
  callDate: Date,
  overallScore: Number,
}, { timestamps: true });

async function findAnomalies() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    const CallAudit = mongoose.models.CallAudit || mongoose.model('CallAudit', callAuditSchema);

    const startDate = new Date('2025-12-01T00:00:00.000Z');
    const endDate = new Date('2025-12-31T23:59:59.999Z');

    const audits = await CallAudit.find({
      callDate: { $gte: startDate, $lte: endDate },
      overallScore: { $gt: 0 }
    }).sort({ overallScore: -1 }).limit(10).lean();

    console.log('🔝 Top 10 Non-Zero Scores:\n');
    audits.forEach((audit: any, i) => {
      console.log(`${i + 1}. Score: ${audit.overallScore.toFixed(2)} | Agent: ${audit.agentName} | ID: ${audit._id}`);
    });

    const totalNonZero = await CallAudit.countDocuments({
      callDate: { $gte: startDate, $lte: endDate },
      overallScore: { $gt: 0 }
    });

    const sumResult = await CallAudit.aggregate([
      {
        $match: {
          callDate: { $gte: startDate, $lte: endDate },
          overallScore: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$overallScore' }
        }
      }
    ]);

    const sum = sumResult[0]?.total || 0;
    const avg = sum / totalNonZero;

    console.log(`\n📊 Statistics:`);
    console.log(`   Non-zero audits: ${totalNonZero}`);
    console.log(`   Sum of non-zero scores: ${sum.toFixed(2)}`);
    console.log(`   Average of non-zero scores: ${avg.toFixed(2)}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

findAnomalies();
