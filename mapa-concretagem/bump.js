#!/usr/bin/env node
/**
 * bump.js — Auto cache-bust para mapa-concretagem
 * Uso:
 *   node bump.js          → atualiza versões uma vez
 *   node bump.js --watch  → fica observando mudanças em app.js e styles.css
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DIR = __dirname;
const INDEX = path.join(DIR, "index.html");
const TARGETS = ["app.js", "styles.css"];

function hashFile(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(content).digest("hex").slice(0, 8);
  } catch {
    return "0";
  }
}

function bumpVersions() {
  let html = fs.readFileSync(INDEX, "utf8");
  let changed = false;

  for (const file of TARGETS) {
    const hash = hashFile(path.join(DIR, file));
    const pattern = new RegExp(`(${file.replace(".", "\\.")}\\?v=)[^"'\\s]+`, "g");
    const updated = html.replace(pattern, `$1${hash}`);
    if (updated !== html) {
      html = updated;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(INDEX, html, "utf8");
    console.log(`[${new Date().toLocaleTimeString("pt-BR")}] index.html atualizado.`);
  }
}

bumpVersions();

if (process.argv.includes("--watch")) {
  console.log("Observando mudanças em app.js e styles.css... (Ctrl+C para sair)");
  for (const file of TARGETS) {
    fs.watch(path.join(DIR, file), () => {
      console.log(`Mudança detectada: ${file}`);
      bumpVersions();
    });
  }
}
