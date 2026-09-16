// src/config/prisma.js
//
// A single shared PrismaClient instance. Creating a new PrismaClient per
// request would open a new connection pool each time — same mistake as
// not pooling raw MySQL connections. Import this file everywhere you
// need DB access.

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
