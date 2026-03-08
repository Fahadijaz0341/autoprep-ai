import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';
import { DatasetSummary, generateDistributionData } from '@/lib/dataAnalysis';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EDAChartsProps {
  data: Record<string, string>[];
  summary: DatasetSummary;
}

const CHART_COLORS = ['hsl(217,91%,60%)', 'hsl(160,84%,39%)', 'hsl(280,65%,60%)', 'hsl(38,92%,50%)', 'hsl(350,80%,55%)'];

interface BoxplotStats {
  name: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers: number[];
}

function computeBoxplot(values: number[], name: string): BoxplotStats {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const q1 = sorted[Math.floor(n * 0.25)];
  const median = sorted[Math.floor(n * 0.5)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const whiskerMin = sorted.find(v => v >= lowerFence) ?? sorted[0];
  const whiskerMax = [...sorted].reverse().find(v => v <= upperFence) ?? sorted[n - 1];
  const outliers = sorted.filter(v => v < lowerFence || v > upperFence);
  return { name, min: whiskerMin, q1, median, q3, max: whiskerMax, outliers };
}

function BoxplotChart({ data, columns }: { data: Record<string, string>[]; columns: string[] }) {
  const boxplots = useMemo(() => {
    return columns.map(col => {
      const vals = data.map(r => Number(r[col])).filter(v => !isNaN(v));
      return computeBoxplot(vals, col);
    });
  }, [data, columns]);

  if (!boxplots.length) return <p className="text-muted-foreground text-sm text-center py-12">No numeric columns available</p>;

  const padding = 40;
  const boxWidth = 50;
  const gap = 20;
  const chartWidth = Math.max(400, boxplots.length * (boxWidth + gap) + padding * 2);
  const chartHeight = 240;

  // Normalize all values to fit in the chart
  const allVals = boxplots.flatMap(b => [b.min, b.max, ...b.outliers]);
  const globalMin = Math.min(...allVals);
  const globalMax = Math.max(...allVals);
  const range = globalMax - globalMin || 1;

  const scaleY = (v: number) => chartHeight - padding - ((v - globalMin) / range) * (chartHeight - padding * 2);

  // Y-axis ticks
  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => globalMin + (range * i) / (tickCount - 1));

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <svg width={chartWidth} height={chartHeight + 20} className="mx-auto">
        {/* Y-axis */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padding - 5} y1={scaleY(t)} x2={chartWidth - padding} y2={scaleY(t)} stroke="hsl(222,30%,16%)" strokeDasharray="3,3" />
            <text x={padding - 8} y={scaleY(t) + 3} textAnchor="end" fill="hsl(215,20%,55%)" fontSize={9} fontFamily="var(--font-mono)">
              {t >= 1000 ? `${(t / 1000).toFixed(1)}k` : t.toFixed(1)}
            </text>
          </g>
        ))}

        {boxplots.map((bp, i) => {
          const cx = padding + i * (boxWidth + gap) + boxWidth / 2;
          const x = cx - boxWidth / 2 + 8;
          const w = boxWidth - 16;

          return (
            <g key={bp.name}>
              {/* Whisker line */}
              <line x1={cx} y1={scaleY(bp.max)} x2={cx} y2={scaleY(bp.min)} stroke="hsl(215,20%,55%)" strokeWidth={1} />
              {/* Whisker caps */}
              <line x1={cx - 8} y1={scaleY(bp.max)} x2={cx + 8} y2={scaleY(bp.max)} stroke="hsl(215,20%,55%)" strokeWidth={1.5} />
              <line x1={cx - 8} y1={scaleY(bp.min)} x2={cx + 8} y2={scaleY(bp.min)} stroke="hsl(215,20%,55%)" strokeWidth={1.5} />
              {/* Box */}
              <rect
                x={x}
                y={scaleY(bp.q3)}
                width={w}
                height={Math.max(1, scaleY(bp.q1) - scaleY(bp.q3))}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                fillOpacity={0.3}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={1.5}
                rx={3}
              />
              {/* Median */}
              <line
                x1={x}
                y1={scaleY(bp.median)}
                x2={x + w}
                y2={scaleY(bp.median)}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={2}
              />
              {/* Outliers */}
              {bp.outliers.slice(0, 20).map((o, j) => (
                <circle key={j} cx={cx} cy={scaleY(o)} r={2.5} fill="hsl(350,80%,55%)" fillOpacity={0.7} />
              ))}
              {/* Label */}
              <text x={cx} y={chartHeight + 12} textAnchor="middle" fill="hsl(215,20%,55%)" fontSize={10} fontFamily="var(--font-mono)">
                {bp.name.length > 8 ? bp.name.slice(0, 7) + '…' : bp.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function EDACharts({ data, summary }: EDAChartsProps) {
  const numericCols = summary.columnStats.filter(c => c.type === 'numeric');
  const categoricalCols = summary.columnStats.filter(c => c.type === 'categorical');
  const [selectedCol, setSelectedCol] = useState(numericCols[0]?.name || '');
  const [selectedCatCol, setSelectedCatCol] = useState(categoricalCols[0]?.name || '');
  const [scatterX, setScatterX] = useState(numericCols[0]?.name || '');
  const [scatterY, setScatterY] = useState(numericCols[1]?.name || numericCols[0]?.name || '');

  const distributionData = selectedCol ? generateDistributionData(data, selectedCol) : [];

  // Missing values chart data
  const missingData = summary.columnStats
    .filter(c => c.missingPct > 0)
    .sort((a, b) => b.missingPct - a.missingPct)
    .slice(0, 15)
    .map(c => ({ name: c.name, value: parseFloat(c.missingPct.toFixed(1)) }));

  // Scatter data
  const scatterData = scatterX && scatterY
    ? data.slice(0, 500).map(row => ({
        x: Number(row[scatterX]),
        y: Number(row[scatterY]),
      })).filter(d => !isNaN(d.x) && !isNaN(d.y))
    : [];

  // Correlation heatmap data (top pairs)
  const topCorrelations = summary.correlationMatrix
    .filter(c => c.col1 !== c.col2)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 10)
    .map(c => ({
      name: `${c.col1.slice(0, 8)} × ${c.col2.slice(0, 8)}`,
      value: parseFloat(c.value.toFixed(3)),
    }));

  // Category frequency data
  const categoryFreqData = useMemo(() => {
    if (!selectedCatCol) return [];
    const freq: Record<string, number> = {};
    data.forEach(row => {
      const v = row[selectedCatCol];
      if (v != null && v !== '' && v !== 'null') {
        freq[v] = (freq[v] || 0) + 1;
      }
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([value, count]) => ({ value, count }));
  }, [data, selectedCatCol]);

  const tooltipStyle = {
    contentStyle: {
      background: 'hsl(222,44%,10%)',
      border: '1px solid hsl(222,30%,16%)',
      borderRadius: '8px',
      fontSize: '12px',
      color: 'hsl(210,40%,93%)',
    },
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="distribution" className="w-full">
        <TabsList className="bg-secondary border border-border flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="boxplot">Boxplot</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="missing">Missing Values</TabsTrigger>
          <TabsTrigger value="correlation">Correlations</TabsTrigger>
          <TabsTrigger value="scatter">Scatter Plot</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="glass-panel rounded-xl p-4 mt-3">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold">Feature Distribution</h4>
            {numericCols.length > 0 && (
              <Select value={selectedCol} onValueChange={setSelectedCol}>
                <SelectTrigger className="w-48 h-8 text-xs bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {numericCols.map(c => (
                    <SelectItem key={c.name} value={c.name} className="text-xs">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={distributionData}>
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: 'hsl(215,20%,55%)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215,20%,55%)' }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distributionData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[0]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="boxplot" className="glass-panel rounded-xl p-4 mt-3">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold">Outlier Detection — Boxplots</h4>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-destructive" /> Outliers</span>
              <span>Whiskers: 1.5×IQR</span>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <BoxplotChart data={data} columns={numericCols.map(c => c.name)} />
          </div>
        </TabsContent>

        <TabsContent value="categories" className="glass-panel rounded-xl p-4 mt-3">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold">Category Frequencies</h4>
            {categoricalCols.length > 0 ? (
              <Select value={selectedCatCol} onValueChange={setSelectedCatCol}>
                <SelectTrigger className="w-48 h-8 text-xs bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoricalCols.map(c => (
                    <SelectItem key={c.name} value={c.name} className="text-xs">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
          {categoricalCols.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-12">No categorical columns detected</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={categoryFreqData}>
                  <XAxis dataKey="value" tick={{ fontSize: 10, fill: 'hsl(215,20%,55%)' }} interval={0} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(215,20%,55%)' }} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {categoryFreqData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </TabsContent>

        <TabsContent value="missing" className="glass-panel rounded-xl p-4 mt-3">
          <h4 className="text-sm font-semibold mb-4">Missing Values by Column</h4>
          {missingData.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-12">No missing values detected ✨</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={missingData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(215,20%,55%)' }} unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(215,20%,55%)' }} width={100} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {missingData.map((d, i) => (
                      <Cell key={i} fill={d.value > 20 ? 'hsl(0,72%,51%)' : d.value > 5 ? 'hsl(38,92%,50%)' : 'hsl(160,84%,39%)'} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </TabsContent>

        <TabsContent value="correlation" className="glass-panel rounded-xl p-4 mt-3">
          <h4 className="text-sm font-semibold mb-4">Top Correlation Pairs</h4>
          {topCorrelations.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-12">Not enough numeric columns for correlation analysis</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={topCorrelations} layout="vertical">
                  <XAxis type="number" domain={[-1, 1]} tick={{ fontSize: 10, fill: 'hsl(215,20%,55%)' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: 'hsl(215,20%,55%)' }} width={120} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {topCorrelations.map((d, i) => (
                      <Cell key={i} fill={d.value > 0 ? 'hsl(217,91%,60%)' : 'hsl(350,80%,55%)'} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </TabsContent>

        <TabsContent value="scatter" className="glass-panel rounded-xl p-4 mt-3">
          <div className="flex items-center gap-3 mb-4">
            <h4 className="text-sm font-semibold">Scatter Plot</h4>
            {numericCols.length >= 2 && (
              <div className="flex gap-2 ml-auto">
                <Select value={scatterX} onValueChange={setScatterX}>
                  <SelectTrigger className="w-36 h-8 text-xs bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {numericCols.map(c => (
                      <SelectItem key={c.name} value={c.name} className="text-xs">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground text-xs self-center">vs</span>
                <Select value={scatterY} onValueChange={setScatterY}>
                  <SelectTrigger className="w-36 h-8 text-xs bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {numericCols.map(c => (
                      <SelectItem key={c.name} value={c.name} className="text-xs">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <ScatterChart>
                <XAxis dataKey="x" name={scatterX} tick={{ fontSize: 10, fill: 'hsl(215,20%,55%)' }} />
                <YAxis dataKey="y" name={scatterY} tick={{ fontSize: 10, fill: 'hsl(215,20%,55%)' }} />
                <Tooltip {...tooltipStyle} />
                <Scatter data={scatterData} fill="hsl(217,91%,60%)" fillOpacity={0.5} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
