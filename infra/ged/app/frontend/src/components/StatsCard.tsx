import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'yellow' | 'gray' | 'red';
}

const colorMap = {
  blue:   'bg-blue-50 text-blue-600',
  green:  'bg-green-50 text-green-600',
  yellow: 'bg-amber-50 text-amber-600',
  gray:   'bg-gray-100 text-gray-500',
  red:    'bg-red-50 text-red-600',
};

export default function StatsCard({ label, value, icon: Icon, color = 'blue' }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={clsx('p-3 rounded-lg', colorMap[color])}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
