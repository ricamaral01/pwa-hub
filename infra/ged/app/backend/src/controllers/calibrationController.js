const fs = require('fs');
const path = require('path');
const multer = require('multer');
const QRCode = require('qrcode');
const pool = require('../config/database');

const dir = path.join(__dirname, '../../uploads/calibrations');
fs.mkdirSync(dir, { recursive: true });
const qrDir = path.join(dir, 'qr');
fs.mkdirSync(qrDir, { recursive: true });
// Busboy rejects at its exact cap; +1 preserves the effective 20 MiB ceiling.
const upload = multer({ storage: multer.diskStorage({ destination: dir, filename: (_r, f, cb) => cb(null, `${Date.now()}-${f.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`) }), limits: { fileSize: 20 * 1024 * 1024 + 1 } }).single('file');
const writable = (u) => ['ADMIN', 'ADMIN_MASTER', 'QUALIDADE', 'LABORATORIO'].includes(u.role);
const scope = (req) => req.user.company_id || null;
const publicBaseUrl = () => (process.env.FILE_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://ged.concretrack.com.br').replace(/\/$/, '');

async function ensureQrCode(certificate) {
  const verifyUrl = `${publicBaseUrl()}/calibrations/verify/${certificate.id}`;
  const filename = `${certificate.id}.png`;
  const filePath = path.join(qrDir, filename);
  await QRCode.toFile(filePath, verifyUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 512,
  });
  const qrCodeUrl = `/unificado/ged/uploads/calibrations/qr/${filename}`;
  const { rows } = await pool.query(
    'UPDATE calibration_certificates SET qr_code_url=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
    [qrCodeUrl, certificate.id]
  );
  return rows[0] || { ...certificate, qr_code_url: qrCodeUrl };
}

async function list(req, res) {
  const values = [scope(req)];
  const where = ['c.company_id IS NOT DISTINCT FROM COALESCE($1, (SELECT company_id FROM users WHERE id = $2))'];
  values.push(req.user.id);
  if (req.query.search) { values.push(`%${req.query.search}%`); where.push(`(equipment_code ILIKE $${values.length} OR equipment_name ILIKE $${values.length} OR certificate_number ILIKE $${values.length} OR laboratory ILIKE $${values.length})`); }
  if (req.query.status === 'VENCIDO') where.push('due_date < CURRENT_DATE');
  if (req.query.status === 'A_VENCER') where.push("due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'");
  if (req.query.status === 'VIGENTE') where.push("due_date > CURRENT_DATE + INTERVAL '30 days'");
  const { rows } = await pool.query(`SELECT c.*, u.name created_by_name, CASE WHEN due_date < CURRENT_DATE THEN 'VENCIDO' WHEN due_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'A_VENCER' ELSE 'VIGENTE' END status FROM calibration_certificates c LEFT JOIN users u ON u.id=c.created_by WHERE ${where.join(' AND ')} ORDER BY due_date, equipment_code`, values);
  res.json(rows);
}
async function stats(req, res) {
  const { rows } = await pool.query(`SELECT COUNT(*)::int total, COUNT(*) FILTER (WHERE due_date < CURRENT_DATE)::int expired, COUNT(*) FILTER (WHERE due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')::int due_soon, COUNT(*) FILTER (WHERE due_date > CURRENT_DATE + INTERVAL '30 days')::int current FROM calibration_certificates WHERE company_id IS NOT DISTINCT FROM COALESCE($1, (SELECT company_id FROM users WHERE id = $2))`, [scope(req), req.user.id]);
  res.json(rows[0]);
}
async function publicVerify(req, res) {
  const { rows } = await pool.query(
    `SELECT id,equipment_code,equipment_name,serial_number,manufacturer,model,location,laboratory,certificate_number,calibration_date,due_date,frequency_months,result,notes,file_name,file_url,qr_code_url,created_at,updated_at,
    CASE WHEN due_date < CURRENT_DATE THEN 'VENCIDO' WHEN due_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'A_VENCER' ELSE 'VIGENTE' END status
    FROM calibration_certificates WHERE id=$1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Certificado não encontrado.' });
  res.json({
    ...rows[0],
    verification_url: `${publicBaseUrl()}/calibrations/verify/${rows[0].id}`,
  });
}
async function save(req, res) {
  if (!writable(req.user)) return res.status(403).json({ error: 'Sem permissão para gerenciar certificados.' });
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const b=req.body, id=req.params.id, fileUrl=req.file ? `/unificado/ged/uploads/calibrations/${req.file.filename}` : null;
    const fields=[b.equipment_code,b.equipment_name,b.serial_number||null,b.manufacturer||null,b.model||null,b.location||null,b.laboratory,b.certificate_number,b.calibration_date,b.due_date,b.frequency_months||null,b.result||'APROVADO',b.notes||null];
    if (!fields[0]||!fields[1]||!fields[6]||!fields[7]||!fields[8]||!fields[9]) return res.status(400).json({ error:'Preencha os campos obrigatórios.' });
    try {
      let result;
      if (id) result=await pool.query(`UPDATE calibration_certificates SET equipment_code=$1,equipment_name=$2,serial_number=$3,manufacturer=$4,model=$5,location=$6,laboratory=$7,certificate_number=$8,calibration_date=$9,due_date=$10,frequency_months=$11,result=$12,notes=$13,file_name=COALESCE($14,file_name),file_url=COALESCE($15,file_url),updated_at=NOW() WHERE id=$16 AND company_id IS NOT DISTINCT FROM $17 RETURNING *`, [...fields,req.file?.originalname||null,fileUrl,id,scope(req)]);
      else result=await pool.query(`INSERT INTO calibration_certificates(equipment_code,equipment_name,serial_number,manufacturer,model,location,laboratory,certificate_number,calibration_date,due_date,frequency_months,result,notes,file_name,file_url,created_by,company_id) VALUES(${fields.map((_,i)=>`$${i+1}`).join(',')},$14,$15,$16,$17) RETURNING *`, [...fields,req.file?.originalname||null,fileUrl,req.user.id,scope(req)]);
      const saved = await ensureQrCode(result.rows[0]);
      res.status(id?200:201).json(saved);
    } catch(e) { if(e.code==='23505') return res.status(409).json({error:'Número de certificado já cadastrado.'}); throw e; }
  });
}
async function remove(req,res){ if(!writable(req.user)) return res.status(403).json({error:'Sem permissão.'}); await pool.query('DELETE FROM calibration_certificates WHERE id=$1 AND company_id IS NOT DISTINCT FROM $2',[req.params.id,scope(req)]); res.status(204).end(); }
module.exports={list,stats,publicVerify,create:save,update:save,remove};
