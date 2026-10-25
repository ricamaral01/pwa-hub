import PrintButton from './PrintButton';

type PageProps = {
  params: Promise<{ id: string }>;
};

type Calibration = {
  id: string;
  equipment_code: string;
  equipment_name: string;
  serial_number?: string;
  laboratory: string;
  certificate_number: string;
  calibration_date: string;
  due_date: string;
  result: string;
  file_url?: string;
  qr_code_url?: string;
  status: 'VENCIDO' | 'A_VENCER' | 'VIGENTE';
  verification_url: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/unificado/ged';
const INTERNAL_API_URL = process.env.GED_INTERNAL_API_URL || 'http://backend:4000';

function absoluteUrl(path?: string) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/unificado/ged/')) return path;
  return `${API_URL.replace(/\/$/, '')}${path}`;
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

async function getCalibration(id: string): Promise<Calibration | null> {
  const response = await fetch(`${INTERNAL_API_URL.replace(/\/$/, '')}/api/calibrations/public/${id}`, {
    cache: 'no-store',
  });
  if (!response.ok) return null;
  return response.json();
}

export default async function CalibrationLabelPage({ params }: PageProps) {
  const { id } = await params;
  const item = await getCalibration(id);

  if (!item) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-sm text-gray-600">Certificado não encontrado.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 print:bg-white flex flex-col items-center justify-center gap-4 p-6 print:p-0">
      <style>{`
        @page {
          size: 80mm 40mm;
          margin: 0;
        }
        @media print {
          html, body {
            width: 80mm;
            height: 40mm;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
          .no-print { display: none !important; }
          .label-sheet {
            box-shadow: none !important;
            border: 0 !important;
          }
        }
      `}</style>

      <div className="no-print flex items-center gap-3">
        <PrintButton />
        <span className="text-xs text-gray-500">No driver Argox, selecione mídia 80 mm x 40 mm e escala 100%.</span>
      </div>

      <section className="label-sheet bg-white border border-gray-300 shadow-sm overflow-hidden" style={{ width: '80mm', height: '40mm' }}>
        <div className="h-full w-full grid" style={{ gridTemplateColumns: '33mm 47mm' }}>
          <div className="flex items-center justify-center border-r border-black p-[2mm]">
            {item.qr_code_url ? (
              <img src={absoluteUrl(item.qr_code_url)} alt="QR code de verificação" className="w-[29mm] h-[29mm] object-contain" />
            ) : (
              <div className="w-[29mm] h-[29mm] border flex items-center justify-center text-[7pt]">SEM QR</div>
            )}
          </div>

          <div className="p-[2mm] text-black font-sans leading-tight overflow-hidden">
            <div className="text-[8pt] font-black uppercase truncate">Certificado de aferição</div>
            <div className="text-[6.5pt] uppercase truncate">GED Concrefer</div>

            <div className="mt-[1.4mm] text-[7pt] font-bold truncate">{item.equipment_code}</div>
            <div className="text-[7pt] font-bold overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.equipment_name}</div>
            <div className="text-[6.5pt] truncate">S/N: {item.serial_number || '-'}</div>

            <div className="mt-[1mm] text-[6.5pt] truncate">Cert.: {item.certificate_number}</div>
            <div className="text-[6.5pt] truncate">Lab.: {item.laboratory}</div>
            <div className="text-[6.5pt]">Cal.: {formatDate(item.calibration_date)}</div>
            <div className="text-[7pt] font-black">Venc.: {formatDate(item.due_date)}</div>

            <div className="mt-[1mm] flex items-center justify-between gap-[1mm]">
              <span className="text-[6pt] font-bold border border-black px-[1mm] py-[0.3mm]">{item.status.replace('_', ' ')}</span>
              <span className="text-[5.5pt] truncate">Valide pelo QR</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
