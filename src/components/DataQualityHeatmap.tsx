import { useMemo } from 'react';
import { DatasetSummary } from '@/lib/dataAnalysis';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface DataQualityHeatmapProps {
  summary: DatasetSummary;
}

function getQualityColor(completeness: number): string {
  if (completeness >= 95) return 'bg-success/80';
  if (completeness >= 80) return 'bg-success/40';
  if (completeness >= 60) return 'bg-warning/60';
  if (completeness >= 40) return 'bg-warning/80';
  return 'bg-destructive/70';
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'numeric': return '#';
    case 'categorical': return 'Aa';
    case 'datetime': return '📅';
    default: return 'T';
  }
}

export function DataQualityHeatmap({ summary }: DataQualityHeatmapProps) {
  const columns = useMemo(() => {
    return summary.columnStats.map(col => ({
      name: col.name,
      type: col.type,
      completeness: 100 - col.missingPct,
      unique: col.unique,
      uniquePct: (col.unique / col.count) * 100,
      missing: col.missing,
      missingPct: col.missingPct,
    }));
  }, [summary]);

  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Data Quality Overview</h3>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-success/80" /> {'≥95%'}</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-success/40" /> {'≥80%'}</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-warning/60" /> {'≥60%'}</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-destructive/70" /> {'<60%'}</span>
        </div>
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(140px, 1fr))` }}>
        {columns.map(col => (
          <Tooltip key={col.name}>
            <TooltipTrigger asChild>
              <div className="rounded-lg border border-border p-3 hover:border-primary/30 transition-colors cursor-default">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-mono text-muted-foreground bg-secondary rounded px-1 py-0.5">
                    {getTypeIcon(col.type)}
                  </span>
                  <span className="text-xs font-medium truncate" title={col.name}>{col.name}</span>
                </div>

                {/* Completeness bar */}
                <div className="h-2 rounded-full bg-secondary overflow-hidden mb-1.5">
                  <div
                    className={`h-full rounded-full transition-all ${getQualityColor(col.completeness)}`}
                    style={{ width: `${col.completeness}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>{col.completeness.toFixed(0)}% complete</span>
                  <span>{col.unique} uniq</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <div className="space-y-1">
                <p className="font-semibold">{col.name}</p>
                <p>Type: {col.type}</p>
                <p>Missing: {col.missing} ({col.missingPct.toFixed(1)}%)</p>
                <p>Unique: {col.unique} ({col.uniquePct.toFixed(1)}%)</p>
                <p>Completeness: {col.completeness.toFixed(1)}%</p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
