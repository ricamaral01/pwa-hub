const { Readable } = require('stream');
const { getDriveClient, FOLDER_IDS } = require('../config/googleDrive');

/**
 * Faz upload de um buffer para o Google Drive em uma pasta específica.
 *
 * @param {Buffer} fileBuffer  Conteúdo do arquivo
 * @param {string} fileName    Nome do arquivo no Drive
 * @param {string} mimeType    MIME type (ex: 'application/pdf')
 * @param {string} folderKey   Chave da pasta: 'VIGENTES' | 'EM_REVISAO' | 'OBSOLETOS' | 'MODELOS'
 * @returns {{ id: string, webViewLink: string }}
 */
async function uploadFile(fileBuffer, fileName, mimeType, folderKey) {
  const drive = getDriveClient();
  const folderId = FOLDER_IDS[folderKey];

  if (!folderId) {
    throw new Error(`ID da pasta Google Drive não configurado para: ${folderKey}`);
  }

  // Converter Buffer para Readable stream
  const stream = Readable.from(fileBuffer);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id,webViewLink,name',
  });

  // Tornar arquivo visível para quem tem o link
  await drive.permissions.create({
    fileId: response.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  return {
    id: response.data.id,
    webViewLink: response.data.webViewLink,
    name: response.data.name,
  };
}

/**
 * Move um arquivo entre pastas no Google Drive.
 *
 * @param {string} fileId       ID do arquivo no Drive
 * @param {string} fromFolderKey  Pasta de origem
 * @param {string} toFolderKey    Pasta de destino
 */
async function moveFile(fileId, fromFolderKey, toFolderKey) {
  const drive = getDriveClient();
  const fromFolderId = FOLDER_IDS[fromFolderKey];
  const toFolderId   = FOLDER_IDS[toFolderKey];

  if (!fromFolderId || !toFolderId) {
    throw new Error('Folder IDs não configurados no ambiente.');
  }

  await drive.files.update({
    fileId,
    addParents:    toFolderId,
    removeParents: fromFolderId,
    fields: 'id,parents',
  });
}

/**
 * Retorna o link público de visualização de um arquivo no Drive.
 * @param {string} fileId
 */
async function getFileUrl(fileId) {
  const drive = getDriveClient();
  const res = await drive.files.get({ fileId, fields: 'webViewLink' });
  return res.data.webViewLink;
}

/**
 * Remove um arquivo do Drive (uso interno para limpeza).
 * @param {string} fileId
 */
async function deleteFile(fileId) {
  const drive = getDriveClient();
  await drive.files.delete({ fileId });
}

module.exports = { uploadFile, moveFile, getFileUrl, deleteFile };
