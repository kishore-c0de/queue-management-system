// src/controllers/tokenController.js

const prisma = require('../config/prisma');
const { getIO } = require('../sockets/io');

// MySQL DATE columns don't carry a time component — normalize to
// midnight UTC so "today" always matches what's stored in queue_date.
function todayDateOnly() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

// Pushes the current waiting list to every connected client (customers
// watching their position + the admin dashboard). Called after any
// change that affects the queue.
async function broadcastQueue() {
  const io = getIO();
  if (!io) return;

  const waiting = await prisma.token.findMany({
    where: { queueDate: todayDateOnly(), status: 'waiting' },
    orderBy: { tokenNumber: 'asc' },
    include: { service: true },
  });

  io.emit('queue:updated', { waiting });
}

// POST /api/tokens (public — this is how a customer joins the queue)
//
// CONCURRENCY-SAFE TOKEN NUMBERS (Step 5, explained):
// If two customers submit at the exact same millisecond, a naive
// "SELECT COUNT(*) + 1" can hand out the SAME number to both — a
// classic race condition, because both requests read the count
// before either has written their row.
//
// The fix: `INSERT ... ON DUPLICATE KEY UPDATE counter = counter + 1`
// is a SINGLE atomic statement in MySQL. The database itself
// serializes concurrent writes to the same row, so even if 10
// requests hit this line simultaneously, each one gets a distinct,
// correctly-incremented counter value — no two requests can read
// the same "before" value. We wrap it in a Prisma transaction with
// the token creation so the counter bump and the token insert
// either both succeed or both roll back together.
async function joinQueue(req, res) {
  try {
    const { customer_name, service_id } = req.body;

    if (!customer_name || !customer_name.trim() || !service_id) {
      return res.status(400).json({ error: 'customer_name and service_id are required' });
    }

    const service = await prisma.service.findFirst({
      where: { id: Number(service_id), isActive: true },
    });
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const today = todayDateOnly();

    const newToken = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO daily_counters (queue_date, counter)
        VALUES (${today}, 1)
        ON DUPLICATE KEY UPDATE counter = counter + 1
      `;

      const counterRow = await tx.dailyCounter.findUnique({ where: { queueDate: today } });

      return tx.token.create({
        data: {
          customerName: customer_name.trim(),
          serviceId: service.id,
          tokenNumber: counterRow.counter,
          queueDate: today,
        },
        include: { service: true },
      });
    });

    await broadcastQueue();
    res.status(201).json(newToken);
  } catch (err) {
    // Belt-and-suspenders: the UNIQUE KEY in the schema means that even
    // if the logic above somehow raced, MySQL rejects the duplicate
    // insert outright (Prisma error code P2002) instead of corrupting data.
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Token number collision, please retry' });
    }
    console.error('joinQueue error:', err);
    res.status(500).json({ error: 'Failed to join queue' });
  }
}

// GET /api/tokens?status=waiting (public — used by both customer status
// page and admin dashboard)
async function listTokens(req, res) {
  try {
    const { status } = req.query;
    const where = { queueDate: todayDateOnly() };
    if (status) where.status = status;

    const tokens = await prisma.token.findMany({
      where,
      orderBy: { tokenNumber: 'asc' },
      include: { service: true },
    });

    res.json(tokens);
  } catch (err) {
    console.error('listTokens error:', err);
    res.status(500).json({ error: 'Failed to fetch tokens' });
  }
}

// PATCH /api/tokens/:id/status (admin only)
async function updateTokenStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['waiting', 'serving', 'completed', 'skipped'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const data = { status };
    if (status === 'serving') data.calledAt = new Date();
    if (status === 'completed') data.completedAt = new Date();

    const updated = await prisma.token.update({
      where: { id: Number(id) },
      data,
      include: { service: true },
    });

    await broadcastQueue();
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Token not found' });
    }
    console.error('updateTokenStatus error:', err);
    res.status(500).json({ error: 'Failed to update token status' });
  }
}

module.exports = { joinQueue, listTokens, updateTokenStatus };
