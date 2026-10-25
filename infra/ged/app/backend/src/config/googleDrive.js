const { google } = require('googleapis');
const path = require('path');

// IDs das pastas no Google Drive (configurados via .env)
const FOLDER_IDS = {
  VIGENTES: process.env.DRIVE_FOLDER_VIGENTES,
  EM_REVISAO: process.env.DRIVE_FOLDER_EM_REVISAO,
  OBSOLETOS: process.env.DRIVE_FOLDER_OBSOLETOS,
  MODELOS: process.env.DRIVE_FOLDER_MODELOS,
};

/**
 * Cria e retorna um cliente autenticado do Google Drive
 * usando Service Account (JSON key file).
 */
function getDriveClient() {
  const credentialsPath = path.resolve(
    process.env.GOOGLE_CREDENTIALS_PATH || './google-credentials.json'
  );

  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
}

module.exports = { getDriveClient, FOLDER_IDS };
