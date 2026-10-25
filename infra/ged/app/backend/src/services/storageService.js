/**
 * storageService.js
 * Armazenamento local de arquivos no servidor.
 * Substitui a integração com Google Drive.
 */

const fs   = require('fs');
const path = require('path');

const UPLOAD_DIR = process.env.GED_UPLOAD_DIR || path.join(__dirname, '../../uploads');

const FOLDER_MAP = {
  EM_REVISAO: 'em_revisao',
  VIGENTES:   'vigentes',
  OBSOLETOS:  'obsoletos',
  MODELOS:    'modelos',
};

function ensureDir(folderKey) {
  const sub = FOLDER_MAP[folderKey] ?? folderKey.toLowerCase();
  const dir  = path.join(UPLOAD_DIR, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return { dir, sub };
}

function getBaseUrl() {
  // NEXT_PUBLIC_API_URL / FRONTEND_URL podem ambos apontar para o domínio raiz.
  // O backend está em :4000, mas o nginx expõe /uploads/ via proxy.
  return process.env.FILE_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:4000';
}

/**
 * Salva um arquivo em disco.
 * @returns {{ id: string, webViewLink: string, name: string }}
 */
async function uploadFile(fileBuffer, fileName, _mimeType, folderKey) {
  const { dir, sub } = ensureDir(folderKey);
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, fileBuffer);

  const baseUrl = getBaseUrl();
  return {
    id:          `${sub}/${fileName}`,
    webViewLink: `${baseUrl}/uploads/${sub}/${fileName}`,
    name:        fileName,
  };
}

/**
 * Move um arquivo entre pastas.
 */
async function moveFile(fileId, _fromFolderKey, toFolderKey) {
  // fileId = "em_revisao/LAB-001_Rev01.pdf"
  const { dir: toDir, sub: toSub } = ensureDir(toFolderKey);
  const fileName = path.basename(fileId);

  // Tenta localizar o arquivo na pasta de origem
  const srcPath = path.join(UPLOAD_DIR, fileId);
  if (!fs.existsSync(srcPath)) throw new Error(`Arquivo de origem ausente: ${fileId}`);
  const destPath = path.join(toDir, fileName);
  fs.renameSync(srcPath, destPath);
  const baseUrl = getBaseUrl();
  const newId = `${toSub}/${fileName}`;
  return {
    id: newId,
    webViewLink: `${baseUrl}/uploads/${newId}`,
    name: fileName,
  };
}

module.exports = { uploadFile, moveFile };
