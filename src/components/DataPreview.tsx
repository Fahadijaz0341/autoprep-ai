import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ColumnStats } from '@/lib/dataAnalysis';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, X } from 'lucide-react';

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

type SortDir = 'asc' | 'desc' | null;

export function DataPreview({ data, columnStats, maxRows = 50 }: DataPreviewProps) {
  const columns = Object.keys(data[0] || {});
  const [search, setSearch] = useState('');
  const [columnFilter, setColumnFilter] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const filteredColumns = useMemo(() => {
    if (!columnFilter) return columns;
    const q = columnFilter.toLowerCase();
    return columns.filter(c => c.toLowerCase().includes(q));
  }, [columns, columnFilter]);

  const filteredAndSortedData = useMemo(() => {
    let result = data;

    // Row search: filter rows where any visible column contains the search term
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(row =>
        filteredColumns.some(col => String(row[col] ?? '').toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortCol && sortDir) {
      const stat = columnStats.find(s => s.name === sortCol);
      const isNumeric = stat?.type === 'numeric';
      result = [...result].sort((a, b) => {
        const va = a[sortCol] ?? '';
        const vb = b[sortCol] ?? '';
        let cmp: number;
        if (isNumeric) {
          cmp = (Number(va) || 0) - (Number(vb) || 0);
        } else {
          cmp = va.localeCompare(vb);
        }
        return sortDir === 'desc' ? -cmp : cmp;
      });
    }

    return result.slice(0, maxRows);
  }, [data, search, sortCol, sortDir, filteredColumns, columnStats, maxRows]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortCol(null);
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortCol !== col) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
    if (sortDir === 'asc') return <ArrowUp className="h-3 w-3 text-primary" />;
    return <ArrowDown className="h-3 w-3 text-primary" />;
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Dataset Preview</h3>
          <span className="text-xs text-muted-foreground">
            Showing {filteredAndSortedData.length} of {data.length} rows · {filteredColumns.length}/{columns.length} columns
          </span>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search rows..."
              className="h-8 pl-8 text-xs bg-secondary border-border"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={columnFilter}
              onChange={e => setColumnFilter(e.target.value)}
              placeholder="Filter columns..."
              className="h-8 pl-8 text-xs bg-secondary border-border"
            />
            {columnFilter && (
              <button onClick={() => setColumnFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-auto max-h-[450px] scrollbar-thin">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {filteredColumns.map(col => {
                const stat = columnStats.find(s => s.name === col);
                return (
                  <TableHead key={col} className="whitespace-nowrap py-3">
                    <button onClick={() => handleSort(col)} className="flex flex-col gap-1 group">
                      <span className="flex items-center gap-1.5 font-mono text-xs">
                        {col}
                        <SortIcon col={col} />
                      </span>
                      {stat && (
                        <Badge variant="outline" className={`text-[10px] w-fit px-1.5 py-0 ${typeColor[stat.type]}`}>
                          {stat.type}
                        </Badge>
                      )}
                    </button>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedData.map((row, i) => (
              <TableRow key={i} className="hover:bg-secondary/30">
                {filteredColumns.map(col => (
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
