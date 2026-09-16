// src/controllers/serviceController.js

const prisma = require('../config/prisma');

// POST /api/services (admin only)
async function createService(req, res) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Service name is required' });
    }

    const service = await prisma.service.create({ data: { name: name.trim() } });
    res.status(201).json(service);
  } catch (err) {
    console.error('createService error:', err);
    res.status(500).json({ error: 'Failed to create service' });
  }
}

// GET /api/services (public — customers need this for the join form)
async function listServices(req, res) {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });
    res.json(services);
  } catch (err) {
    console.error('listServices error:', err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
}

module.exports = { createService, listServices };
