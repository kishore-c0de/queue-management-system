// src/controllers/summaryController.js

const prisma = require('../config/prisma');
const { generateSummary } = require('../utils/aiSummary');

function todayDateOnly() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

// Turns raw token rows into the small stats object we send to the AI.
// Deliberately computed in plain JS rather than SQL aggregates — with
// one business and a few dozen tokens a day, this is simpler to read
// and just as fast.
function computeStats(tokens) {
  const completed = tokens.filter((t) => t.status === 'completed');
  const skipped = tokens.filter((t) => t.status === 'skipped');

  const waitTimesMinutes = tokens
    .filter((t) => t.calledAt)
    .map((t) => (new Date(t.calledAt) - new Date(t.createdAt)) / 60000);

  const averageWaitMinutes =
    waitTimesMinutes.length > 0
      ? Math.round(waitTimesMinutes.reduce((sum, v) => sum + v, 0) / waitTimesMinutes.length)
      : null;

  const hourCounts = {};
  tokens.forEach((t) => {
    const hour = new Date(t.createdAt).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  let peakHour = null;
  let peakCount = 0;
  for (const [hour, count] of Object.entries(hourCounts)) {
    if (count > peakCount) {
      peakCount = count;
      peakHour = Number(hour);
    }
  }

  return {
    total_customers: tokens.length,
    total_completed: completed.length,
    total_no_show: skipped.length,
    average_wait_minutes: averageWaitMinutes,
    peak_hour: peakHour !== null ? `${peakHour}:00 - ${peakHour + 1}:00` : null,
  };
}

// GET /api/summary/today?regenerate=true (admin only)
async function getTodaySummary(req, res) {
  try {
    const today = todayDateOnly();
    const forceRegenerate = req.query.regenerate === 'true';

    const tokens = await prisma.token.findMany({ where: { queueDate: today } });
    const stats = computeStats(tokens);

    if (!forceRegenerate) {
      const cached = await prisma.dailySummary.findUnique({ where: { queueDate: today } });
      if (cached) {
        return res.json({ stats, summary: cached.content, cached: true });
      }
    }

    if (stats.total_customers === 0) {
      return res.json({ stats, summary: 'No customers have joined the queue today yet.', cached: false });
    }

    let summaryText;
    try {
      summaryText = await generateSummary(stats);
    } catch (aiErr) {
      console.error('generateSummary error:', aiErr);
      return res.json({ stats, summary: null, summaryError: aiErr.message, cached: false });
    }

    await prisma.dailySummary.upsert({
      where: { queueDate: today },
      update: { content: summaryText },
      create: { queueDate: today, content: summaryText },
    });

    res.json({ stats, summary: summaryText, cached: false });
  } catch (err) {
    console.error('getTodaySummary error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate summary' });
  }
}

module.exports = { getTodaySummary };
