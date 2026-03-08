import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ColumnStats } from '@/lib/dataAnalysis';

interface DataPreviewProps {
  data: Record<string, string>[];
  columnStats: ColumnStats[];
  maxRows?: number;
}

const typeColor: Record<string, string> = {
  numeric: 'bg-info/15 text-info border-info/20',
  categorical: 'bg-accent/15 text-accent border-accent/20',
  datetime: 'bg-warning/15 text-warning border-warning/20',
  text: 'bg-muted text-muted-foreground border-border',
};

export function DataPreview({ data, columnStats, maxRows = 20 }: DataPreviewProps) {
  const columns = Object.keys(data[0] || {});
  const displayData = data.slice(0, maxRows);

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm">Dataset Preview</h3>
        <span className="text-xs text-muted-foreground">
          Showing {displayData.length} of {data.length} rows · {columns.length} columns
        </span>
      </div>
      <div className="overflow-auto max-h-[400px] scrollbar-thin">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map(col => {
                const stat = columnStats.find(s => s.name === col);
                return (
                  <TableHead key={col} className="whitespace-nowrap py-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-xs">{col}</span>
                      {stat && (
                        <Badge variant="outline" className={`text-[10px] w-fit px-1.5 py-0 ${typeColor[stat.type]}`}>
                          {stat.type}
                        </Badge>
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((row, i) => (
              <TableRow key={i} className="hover:bg-secondary/30">
                {columns.map(col => (
                  <TableCell key={col} className="font-mono text-xs py-2 whitespace-nowrap max-w-[200px] truncate">
                    {row[col] || <span className="text-destructive/60 italic">null</span>}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
