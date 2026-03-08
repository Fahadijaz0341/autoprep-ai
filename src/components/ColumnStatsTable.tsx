import { ColumnStats } from '@/lib/dataAnalysis';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ColumnStatsTableProps {
  stats: ColumnStats[];
}

export function ColumnStatsTable({ stats }: ColumnStatsTableProps) {
  const numericStats = stats.filter(s => s.type === 'numeric');
  if (!numericStats.length) return null;

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm">Numeric Column Statistics</h3>
      </div>
      <div className="overflow-auto scrollbar-thin">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs">Column</TableHead>
              <TableHead className="text-xs text-right">Mean</TableHead>
              <TableHead className="text-xs text-right">Median</TableHead>
              <TableHead className="text-xs text-right">Std</TableHead>
              <TableHead className="text-xs text-right">Min</TableHead>
              <TableHead className="text-xs text-right">Max</TableHead>
              <TableHead className="text-xs text-right">Skewness</TableHead>
              <TableHead className="text-xs text-right">Missing %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {numericStats.map(s => (
              <TableRow key={s.name} className="hover:bg-secondary/30">
                <TableCell className="font-mono text-xs font-medium">{s.name}</TableCell>
                <TableCell className="text-xs text-right font-mono">{s.mean?.toFixed(2)}</TableCell>
                <TableCell className="text-xs text-right font-mono">{s.median?.toFixed(2)}</TableCell>
                <TableCell className="text-xs text-right font-mono">{s.std?.toFixed(2)}</TableCell>
                <TableCell className="text-xs text-right font-mono">{s.min?.toFixed(2)}</TableCell>
                <TableCell className="text-xs text-right font-mono">{s.max?.toFixed(2)}</TableCell>
                <TableCell className="text-xs text-right font-mono">{s.skewness?.toFixed(2)}</TableCell>
                <TableCell className={`text-xs text-right font-mono ${s.missingPct > 10 ? 'text-warning' : ''}`}>
                  {s.missingPct.toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
