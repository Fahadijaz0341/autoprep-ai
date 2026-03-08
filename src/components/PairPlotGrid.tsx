import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColumnStats } from '@/lib/dataAnalysis';

interface PairPlotGridProps {
  data: Record<string, string>[];
  numericColumns: ColumnStats[];
}

const COLORS = ['hsl(217,91%,60%)', 'hsl(160,84%,39%)', 'hsl(280,65%,60%)', 'hsl(38,92%,50%)'];

export function PairPlotGrid({ data, numericColumns }: PairPlotGridProps) {
  const maxCols = 4;
  const availableCols = numericColumns.slice(0, 8);
  const [selectedCols, setSelectedCols] = useState<string[]>(
    availableCols.slice(0, Math.min(maxCols, availableCols.length)).map(c => c.name)
  );

  const sampleData = useMemo(() => data.slice(0, 300), [data]);

  const cellSize = 140;
  const padding = 20;

  const colData = useMemo(() => {
    const result: Record<string, { values: number[]; min: number; max: number }> = {};
    for (const col of selectedCols) {
      const vals = sampleData.map(r => Number(r[col])).filter(v => !isNaN(v));
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      result[col] = { values: vals, min, max: max === min ? max + 1 : max };
    }
    return result;
  }, [sampleData, selectedCols]);

  const scaleX = (val: number, col: string) => {
    const { min, max } = colData[col];
    return padding + ((val - min) / (max - min)) * (cellSize - padding * 2);
  };

  const scaleY = (val: number, col: string) => {
    const { min, max } = colData[col];
    return cellSize - padding - ((val - min) / (max - min)) * (cellSize - padding * 2);
  };

  const toggleCol = (col: string) => {
    setSelectedCols(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : prev.length < maxCols ? [...prev, col] : prev
    );
  };

  if (numericColumns.length < 2) {
    return (
      <div className="glass-panel rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-4">Pair Plot</h3>
        <p className="text-muted-foreground text-sm text-center py-8">Need at least 2 numeric columns</p>
      </div>
    );
  }

  const n = selectedCols.length;

  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-semibold text-sm">Pair Plot Grid</h3>
        <div className="flex gap-1.5 flex-wrap">
          {availableCols.map((col, i) => (
            <button
              key={col.name}
              onClick={() => toggleCol(col.name)}
              className={`text-[10px] font-mono px-2 py-1 rounded-md border transition-colors ${
                selectedCols.includes(col.name)
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30'
              }`}
            >
              {col.name.length > 10 ? col.name.slice(0, 9) + '…' : col.name}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-auto scrollbar-thin">
        <div
          className="inline-grid gap-1"
          style={{ gridTemplateColumns: `40px repeat(${n}, ${cellSize}px)`, gridTemplateRows: `repeat(${n}, ${cellSize}px) 30px` }}
        >
          {/* Empty top-left corner spacer */}
          <div />
          {/* Column headers - empty for top row */}
          {selectedCols.map(col => (
            <div key={`header-${col}`} />
          ))}

          {selectedCols.map((rowCol, ri) => (
            <>
              {/* Row label */}
              <div key={`label-${rowCol}`} className="flex items-center justify-end pr-1">
                <span className="text-[9px] font-mono text-muted-foreground writing-mode-vertical" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                  {rowCol.length > 10 ? rowCol.slice(0, 9) + '…' : rowCol}
                </span>
              </div>

              {selectedCols.map((colCol, ci) => {
                const isDiagonal = ri === ci;

                if (isDiagonal) {
                  // Histogram on diagonal
                  const vals = colData[colCol]?.values || [];
                  const bins = 10;
                  const { min, max } = colData[colCol];
                  const binWidth = (max - min) / bins;
                  const histogram = Array(bins).fill(0);
                  vals.forEach(v => {
                    const idx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
                    histogram[idx]++;
                  });
                  const maxCount = Math.max(...histogram, 1);
                  const barW = (cellSize - padding * 2) / bins;

                  return (
                    <svg key={`${rowCol}-${colCol}`} width={cellSize} height={cellSize} className="bg-secondary/30 rounded-lg border border-border/50">
                      {histogram.map((count, bi) => (
                        <rect
                          key={bi}
                          x={padding + bi * barW}
                          y={cellSize - padding - (count / maxCount) * (cellSize - padding * 2)}
                          width={barW - 1}
                          height={(count / maxCount) * (cellSize - padding * 2)}
                          fill={COLORS[ri % COLORS.length]}
                          fillOpacity={0.6}
                          rx={1}
                        />
                      ))}
                      <text x={cellSize / 2} y={14} textAnchor="middle" fill="hsl(215,20%,55%)" fontSize={9} fontFamily="var(--font-mono)">
                        {colCol.length > 12 ? colCol.slice(0, 11) + '…' : colCol}
                      </text>
                    </svg>
                  );
                }

                // Scatter plot
                const xVals = colData[colCol]?.values || [];
                const yVals = colData[rowCol]?.values || [];
                const points = [];
                const len = Math.min(xVals.length, yVals.length, 200);
                for (let i = 0; i < len; i++) {
                  points.push({ x: scaleX(xVals[i], colCol), y: scaleY(yVals[i], rowCol) });
                }

                return (
                  <svg key={`${rowCol}-${colCol}`} width={cellSize} height={cellSize} className="bg-secondary/20 rounded-lg border border-border/30">
                    {points.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r={1.8} fill={COLORS[ci % COLORS.length]} fillOpacity={0.4} />
                    ))}
                  </svg>
                );
              })}
            </>
          ))}

          {/* Bottom labels */}
          <div />
          {selectedCols.map(col => (
            <div key={`bottom-${col}`} className="flex items-start justify-center">
              <span className="text-[9px] font-mono text-muted-foreground">
                {col.length > 12 ? col.slice(0, 11) + '…' : col}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
