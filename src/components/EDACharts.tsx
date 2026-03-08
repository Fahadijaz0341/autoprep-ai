import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';
import { DatasetSummary, generateDistributionData } from '@/lib/dataAnalysis';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EDAChartsProps {
  data: Record<string, string>[];
  summary: DatasetSummary;
}

const CHART_COLORS = ['hsl(217,91%,60%)', 'hsl(160,84%,39%)', 'hsl(280,65%,60%)', 'hsl(38,92%,50%)', 'hsl(350,80%,55%)'];

export function EDACharts({ data, summary }: EDAChartsProps) {
  const numericCols = summary.columnStats.filter(c => c.type === 'numeric');
  const [selectedCol, setSelectedCol] = useState(numericCols[0]?.name || '');
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
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
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
