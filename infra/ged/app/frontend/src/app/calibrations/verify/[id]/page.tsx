import { CheckCircle, ExternalLink, FileCheck, QrCode } from 'lucide-react';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{ id: string }>;
};

type Calibration = {
  id: string;
  equipment_code: string;
  equipment_name: string;
  serial_number?: string;
  manufacturer?: string;
  model?: string;
  location?: string;
  laboratory: string;
  certificate_number: string;
  calibration_date: string;
  due_date: string;
  frequency_months?: number;
  result: string;
  notes?: string;
  file_name?: string;
  file_url?: string;
  qr_code_url?: string;
  status: 'VENCIDO' | 'A_VENCER' | 'VIGENTE';
  verification_url: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/unificado/ged';
const INTERNAL_API_URL = process.env.GED_INTERNAL_API_URL || 'http://backend:4000';

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function absoluteUrl(path?: string) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/unificado/ged/')) return path;
  return `${API_URL.replace(/\/$/, '')}${path}`;
}

async function getCalibration(id: string): Promise<Calibration | null> {
  const response = await fetch(`${INTERNAL_API_URL.replace(/\/$/, '')}/api/calibrations/public/${id}`, {
    cache: 'no-store',
  });
  if (!response.ok) return null;
  return response.json();
}

export default async function CalibrationVerifyPage({ params }: PageProps) {
  const { id } = await params;
  const item = await getCalibration(id);

  if (!item) notFound();

  const statusClass = item.status === 'VENCIDO'
    ? 'bg-red-100 text-red-700 border-red-200'
    : item.status === 'A_VENCER'
      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
      : 'bg-green-100 text-green-700 border-green-200';

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-brand-700 text-white">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-start gap-4">
            <FileCheck size={42} className="shrink-0 mt-1" />
            <div>
              <p className="text-sm uppercase tracking-wide text-brand-100">Verificação pública de calibração</p>
              <h1 className="text-3xl font-bold mt-1">{item.equipment_name}</h1>
              <p className="text-brand-100 mt-2">Certificado {item.certificate_number} emitido por {item.laboratory}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-8 grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Documento de aferição</h2>
              <p className="text-sm text-gray-500">Dados rastreáveis cadastrados no GED Concrefer</p>
            </div>
            <span className={`px-3 py-1 rounded-full border text-sm font-semibold ${statusClass}`}>
              {item.status.replace('_', ' ')}
            </span>
          </div>

          <dl className="grid md:grid-cols-2 gap-4 text-sm">
            <div><dt className="text-gray-500">Código do equipamento</dt><dd className="font-semibold text-gray-900">{item.equipment_code}</dd></div>
            <div><dt className="text-gray-500">Número de série</dt><dd className="font-semibold text-gray-900">{item.serial_number || '-'}</dd></div>
            <div><dt className="text-gray-500">Fabricante</dt><dd className="font-semibold text-gray-900">{item.manufacturer || '-'}</dd></div>
            <div><dt className="text-gray-500">Modelo</dt><dd className="font-semibold text-gray-900">{item.model || '-'}</dd></div>
            <div><dt className="text-gray-500">Localização</dt><dd className="font-semibold text-gray-900">{item.location || '-'}</dd></div>
            <div><dt className="text-gray-500">Resultado</dt><dd className="font-semibold text-gray-900">{item.result}</dd></div>
            <div><dt className="text-gray-500">Data da calibração</dt><dd className="font-semibold text-gray-900">{formatDate(item.calibration_date)}</dd></div>
            <div><dt className="text-gray-500">Próxima calibração</dt><dd className="font-semibold text-gray-900">{formatDate(item.due_date)}</dd></div>
            <div><dt className="text-gray-500">Periodicidade</dt><dd className="font-semibold text-gray-900">{item.frequency_months ? `${item.frequency_months} meses` : '-'}</dd></div>
            <div><dt className="text-gray-500">ID GED</dt><dd className="font-mono text-xs text-gray-700 break-all">{item.id}</dd></div>
          </dl>

          {item.notes && (
            <div className="mt-5 border-t pt-4">
              <h3 className="font-semibold text-gray-900">Observações</h3>
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{item.notes}</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {item.file_url ? (
              <a href={absoluteUrl(item.file_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold">
                <ExternalLink size={16} />
                Abrir certificado de aferição
              </a>
            ) : (
              <span className="text-sm text-gray-500">Nenhum arquivo de certificado foi anexado.</span>
            )}
          </div>
        </div>

        <aside className="bg-white border rounded-2xl p-6 shadow-sm h-fit">
          <div className="flex items-center gap-2 text-gray-900 font-bold mb-4">
            <QrCode size={20} />
            QR code
          </div>
          {item.qr_code_url ? (
            <img src={absoluteUrl(item.qr_code_url)} alt="QR code de verificação do certificado" className="w-full rounded-xl border p-3" />
          ) : (
            <div className="aspect-square border rounded-xl flex items-center justify-center text-sm text-gray-400">QR não gerado</div>
          )}
          <p className="text-xs text-gray-500 mt-4 break-all">{item.verification_url}</p>
          <div className="mt-5 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
            <CheckCircle size={18} className="shrink-0" />
            Registro localizado no GED Concrefer.
          </div>
        </aside>
      </section>
    </main>
  );
}
