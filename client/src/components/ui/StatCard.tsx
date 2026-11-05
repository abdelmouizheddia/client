import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Card from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  delta?: number;
  accent?: 'gold' | 'navy' | 'emerald' | 'rose';
}

const accentMap = {
  gold: 'bg-gold-500/15 text-gold-600 dark:text-gold-300',
  navy: 'bg-navy-800/10 text-navy-700 dark:bg-white/10 dark:text-gold-200',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
};

export default function StatCard({ label, value, icon, delta, accent = 'navy' }: StatCardProps) {
  return (
    <Card goldEdge className="relative overflow-hidden animate-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-navy-400 dark:text-navy-300/70 mb-1.5">{label}</p>
          <p className="font-mono text-2xl font-bold text-navy-900 dark:text-white">{value}</p>
          {delta !== undefined && (
            <div className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
              {delta >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              <span className="font-mono">{Math.abs(delta)}%</span>
              <span className="text-navy-400 dark:text-navy-300/60 font-normal">عن الشهر الماضي</span>
            </div>
          )}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accentMap[accent]}`}>{icon}</div>
      </div>
    </Card>
  );
}
