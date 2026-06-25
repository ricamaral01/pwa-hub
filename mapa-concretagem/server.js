require("dotenv").config();
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const SftpClient = require("ssh2-sftp-client");
const { createClient } = require("@supabase/supabase-js");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Servir arquivos estáticos da pasta raiz do Hub (um nível acima)
app.use(express.static(path.join(__dirname, "..")));

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("Erro: SUPABASE_URL e SUPABASE_KEY são obrigatórios no arquivo .env");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

// Multer in-memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Formato inválido. Apenas JPG, PNG e WEBP são aceitos."));
  },
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// SFTP Configuration
const sftpConfig = {
  host: process.env.SFTP_HOST || "2.25.163.32",
  port: parseInt(process.env.SFTP_PORT || "22", 10),
  username: process.env.SFTP_USER || "root",
  password: process.env.SFTP_PASSWORD || "Concrefer@2026##VPS",
  readyTimeout: 15000
};

const STORAGE_BASE_PATH = process.env.STORAGE_BASE_PATH || "/opt/mapaproducao-storage";

// StorageService helper methods
const StorageService = {
  async connect() {
    const sftp = new SftpClient();
    try {
      await sftp.connect(sftpConfig);
      return sftp;
    } catch (err) {
      if (err.message.includes("Authentication failure")) {
        throw new Error("Erro de autenticação no servidor SFTP.");
      } else if (err.code === "ETIMEDOUT" || err.message.includes("timed out")) {
        throw new Error("Timeout ao conectar ao servidor SFTP.");
      } else {
        throw new Error(`Falha de conexão com o servidor SFTP: ${err.message}`);
      }
    }
  },

  async uploadFile(remotePath, buffer) {
    const sftp = await this.connect();
    try {
      // Create directories recursively
      const remoteDir = path.dirname(remotePath).replace(/\\/g, "/");
      await sftp.mkdir(remoteDir, true);

      // Upload buffer
      await sftp.put(buffer, remotePath);
    } catch (err) {
      if (err.message.includes("ENOSPC") || err.message.toLowerCase().includes("no space")) {
        throw new Error("Espaço em disco insuficiente na VPS de Storage.");
      }
      throw new Error(`Falha ao enviar arquivo via SFTP: ${err.message}`);
    } finally {
      await sftp.end().catch(() => {});
    }
  },

  async deleteFile(remotePath) {
    const sftp = await this.connect();
    try {
      const exists = await sftp.exists(remotePath);
      if (exists) {
        await sftp.delete(remotePath);
      }
    } catch (err) {
      throw new Error(`Falha ao excluir arquivo via SFTP: ${err.message}`);
    } finally {
      await sftp.end().catch(() => {});
    }
  }
};

// Endpoints

// 1. POST: Upload photo
app.post("/api/inspecoes/:poste_id/fotos", upload.single("foto"), async (req, res) => {
  const startTime = Date.now();
  const { poste_id } = req.params;
  const usuario = req.body.usuario || "sistema";

  if (!req.file) {
    return res.status(400).json({ error: "Nenhum arquivo enviado." });
  }

  try {
    // Compress and resize using sharp
    let compressedBuffer;
    let extension = ".jpg";
    
    // We convert everything to JPEG for standardizing, with width max 1600px and 80% quality
    compressedBuffer = await sharp(req.file.buffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const uuidName = `${uuidv4()}${extension}`;

    // Path structure: {STORAGE_BASE_PATH}/inspecoes/{ano}/{mes}/{dia}/{poste_id}/
    const now = new Date();
    const ano = now.getFullYear();
    const mes = String(now.getMonth() + 1).padStart(2, "0");
    const dia = String(now.getDate()).padStart(2, "0");

    const relativePath = `inspecoes/${ano}/${mes}/${dia}/${poste_id}/${uuidName}`;
    const remotePath = `${STORAGE_BASE_PATH}/${relativePath}`.replace(/\\/g, "/");

    // Upload via SFTP
    await StorageService.uploadFile(remotePath, compressedBuffer);

    // Save metadata to Supabase
    const { data: dbData, error: dbError } = await supabase
      .from("fotos_inspecao")
      .insert({
        poste_id,
        arquivo_nome: uuidName,
        arquivo_path: relativePath,
        tamanho_bytes: compressedBuffer.length,
        usuario
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Erro ao salvar metadados no Supabase: ${dbError.message}`);
    }

    const uploadTime = Date.now() - startTime;

    // Log details
    console.log(JSON.stringify({
      logType: "UPLOAD_PHOTO",
      usuario,
      date: new Date().toISOString(),
      fileName: uuidName,
      uploadTimeMs: uploadTime,
      result: "SUCCESS",
      posteId: poste_id,
      sizeBytes: compressedBuffer.length
    }));

    res.status(201).json({
      success: true,
      data: dbData
    });

  } catch (err) {
    const uploadTime = Date.now() - startTime;
    console.error(JSON.stringify({
      logType: "UPLOAD_PHOTO",
      usuario,
      date: new Date().toISOString(),
      fileName: req.file.originalname,
      uploadTimeMs: uploadTime,
      result: "FAILURE",
      error: err.message
    }));

    res.status(500).json({ error: err.message });
  }
});

// 2. GET: List photos for an inspection
app.get("/api/inspecoes/:poste_id/fotos", async (req, res) => {
  const { poste_id } = req.params;

  try {
    const { data, error } = await supabase
      .from("fotos_inspecao")
      .select("*")
      .eq("poste_id", poste_id)
      .order("data_upload", { ascending: true });

    if (error) {
      throw error;
    }

    // Map each item to include direct download link structure from VPS if requested
    // (Serving static files is handled by the VPS on the STORAGE_BASE_PATH, e.g. at http://2.25.163.32/storage/)
    // Assuming the VPS exposes files at http://2.25.163.32:8081/ or standard port:
    const baseWebUrl = process.env.STORAGE_WEB_URL || "http://2.25.163.32/storage";
    const mapped = data.map(item => ({
      ...item,
      url: `${baseWebUrl}/${item.arquivo_path}`
    }));

    res.json({ success: true, data: mapped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. DELETE: Exclude photo
app.delete("/api/fotos/:id", async (req, res) => {
  const { id } = req.params;
  const usuario = req.query.usuario || "sistema";

  try {
    // 1. Get metadata from Supabase
    const { data: photo, error: getError } = await supabase
      .from("fotos_inspecao")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (getError) throw getError;
    if (!photo) {
      return res.status(404).json({ error: "Foto não encontrada no banco de dados." });
    }

    // 2. Delete file from VPS Storage
    const remotePath = `${STORAGE_BASE_PATH}/${photo.arquivo_path}`.replace(/\\/g, "/");
    await StorageService.deleteFile(remotePath);

    // 3. Delete record from Supabase
    const { error: deleteError } = await supabase
      .from("fotos_inspecao")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    console.log(JSON.stringify({
      logType: "DELETE_PHOTO",
      usuario,
      date: new Date().toISOString(),
      photoId: id,
      fileName: photo.arquivo_nome,
      result: "SUCCESS"
    }));

    res.json({ success: true, message: "Foto excluída com sucesso." });

  } catch (err) {
    console.error(JSON.stringify({
      logType: "DELETE_PHOTO",
      usuario,
      date: new Date().toISOString(),
      photoId: id,
      result: "FAILURE",
      error: err.message
    }));

    res.status(500).json({ error: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Servidor de Storage ativo na porta ${PORT}`);
});
