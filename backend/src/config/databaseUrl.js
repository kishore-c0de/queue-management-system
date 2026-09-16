// src/config/databaseUrl.js
//
// Injects the Aiven CA cert path into DATABASE_URL from DATABASE_SSL_CERT,
// if set. Lets the app code use one path locally (../certs/aiven-ca.pem)
// and a different one in production (Render's Secret File mount), without
// duplicating the whole connection string per environment.
//
// Must run after DATABASE_URL is loaded into process.env and before
// `new PrismaClient()` is called. Note: this does NOT affect the
// `prisma migrate deploy` CLI step — that reads DATABASE_URL directly from
// the environment as a separate process, so the deployed DATABASE_URL
// itself must already contain the correct sslcert path.

function applySslCertPath() {
  const certPath = process.env.DATABASE_SSL_CERT;
  if (!certPath || !process.env.DATABASE_URL) return;

  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set('sslcert', certPath);
  process.env.DATABASE_URL = url.toString();
}

module.exports = { applySslCertPath };
