require("dotenv").config();
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 5000);
const STORAGE_DIR = path.resolve(process.env.PHOTO_STORAGE_DIR || "/opt/mapaproducao-storage");
const INDEX_FILE = path.join(STORAGE_DIR, "fotos-inspecao.json");
const ALLOWED_ORIGINS = new Set((process.env.ALLOWED_ORIGINS ||
  "https://usina.concretrack.com.br,https://dautomacao.com,http://localhost:5500,http://127.0.0.1:5500")
  .split(",").map((value) => value.trim()).filter(Boolean));

app.use((req, res, next) => {
  const origin = req.get("Origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(?:jpeg|png|webp)$/.test(file.mimetype)) return cb(null, true);
    cb(new Error("Formato inválido. Use JPG, PNG ou WEBP."));
  }
});

let writeQueue = Promise.resolve();
async function readIndex() {
  try {
    const rows = JSON.parse(await fs.readFile(INDEX_FILE, "utf8"));
    if (!Array.isArray(rows)) throw new Error("Índice de fotos inválido.");
    return rows;
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function changeIndex(change) {
  const work = writeQueue.then(async () => {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    const rows = await readIndex();
    const result = await change(rows);
    const temp = `${INDEX_FILE}.${process.pid}.tmp`;
    await fs.writeFile(temp, JSON.stringify(rows), { mode: 0o600 });
    await fs.rename(temp, INDEX_FILE);
    return result;
  });
  writeQueue = work.catch(() => {});
  return work;
}

function publicPhoto(row) {
  const { file_name, ...metadata } = row;
  return { ...metadata, url: `/api/fotos/${encodeURIComponent(row.id)}/arquivo` };
}

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.post("/api/inspecoes/:poste_id/fotos", upload.single("foto"), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: "Nenhuma foto enviada." });
  try {
    const id = uuidv4();
    const fileName = `${id}.jpg`;
    const filePath = path.join(STORAGE_DIR, fileName);
    const buffer = await sharp(req.file.buffer).rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 80 }).toBuffer();
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await fs.writeFile(filePath, buffer, { flag: "wx", mode: 0o600 });
    const row = {
      id,
      poste_id: req.params.poste_id,
      arquivo_nome: fileName,
      file_name: fileName,
      tamanho_bytes: buffer.length,
      usuario: String(req.body.usuario || "sistema").slice(0, 120),
      data_upload: new Date().toISOString()
    };
    try {
      await changeIndex((rows) => rows.push(row));
    } catch (error) {
      await fs.unlink(filePath).catch(() => {});
      throw error;
    }
    res.status(201).json({ success: true, data: publicPhoto(row) });
  } catch (error) { next(error); }
});

app.get("/api/inspecoes/:poste_id/fotos", async (req, res, next) => {
  try {
    await writeQueue;
    const rows = (await readIndex()).filter((row) => row.poste_id === req.params.poste_id);
    res.json({ success: true, data: rows.map(publicPhoto) });
  } catch (error) { next(error); }
});

app.get("/api/fotos/:id/arquivo", async (req, res, next) => {
  try {
    await writeQueue;
    const row = (await readIndex()).find((item) => item.id === req.params.id);
    if (!row) return res.status(404).json({ error: "Foto não encontrada." });
    const buffer = await fs.readFile(path.join(STORAGE_DIR, row.file_name));
    res.setHeader("Content-Type", "image/jpeg");
    if (req.query.download === "1") {
      res.setHeader("Content-Disposition", `attachment; filename="${row.arquivo_nome}"`);
    }
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.send(buffer);
  } catch (error) { next(error); }
});

app.delete("/api/fotos/:id", async (req, res, next) => {
  try {
    const row = await changeIndex((rows) => {
      const index = rows.findIndex((item) => item.id === req.params.id);
      return index < 0 ? null : rows.splice(index, 1)[0];
    });
    if (!row) return res.status(404).json({ error: "Foto não encontrada." });
    await fs.unlink(path.join(STORAGE_DIR, row.file_name)).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});

app.use((error, req, res, next) => {
  console.error("Photo API error:", error);
  res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 500)
    .json({ error: error.message || "Falha ao processar foto." });
});

if (require.main === module) {
  app.listen(PORT, "127.0.0.1", () => console.log(`Photo API listening on ${PORT}`));
}
module.exports = app;
