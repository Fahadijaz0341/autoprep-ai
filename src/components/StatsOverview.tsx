import { motion } from 'framer-motion';
import { Rows3, Columns3, AlertTriangle, Activity, Hash, Tag } from 'lucide-react';
import { DatasetSummary } from '@/lib/dataAnalysis';

interface StatsOverviewProps {
  summary: DatasetSummary;
}

export function StatsOverview({ summary }: StatsOverviewProps) {
  const healthColor = summary.healthScore >= 80 ? 'text-success' : summary.healthScore >= 50 ? 'text-warning' : 'text-destructive';

  const cards = [
    { label: 'Rows', value: summary.rows.toLocaleString(), icon: Rows3, accent: 'text-primary' },
    { label: 'Columns', value: summary.columns, icon: Columns3, accent: 'text-primary' },
    { label: 'Numeric', value: summary.numericCols, icon: Hash, accent: 'text-info' },
    { label: 'Categorical', value: summary.categoricalCols, icon: Tag, accent: 'text-accent' },
    { label: 'Missing', value: `${summary.totalMissingPct.toFixed(1)}%`, icon: AlertTriangle, accent: summary.totalMissingPct > 10 ? 'text-warning' : 'text-muted-foreground' },
    { label: 'Health', value: `${summary.healthScore}%`, icon: Activity, accent: healthColor },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="stat-card"
        >
          <div className="flex items-center gap-2 mb-2">
            <card.icon className={`h-4 w-4 ${card.accent}`} />
            <span className="text-xs text-muted-foreground">{card.label}</span>
          </div>
          <p className={`text-xl font-bold font-mono ${card.accent}`}>{card.value}</p>
        </motion.div>
      ))}
    </div>
  );
}
