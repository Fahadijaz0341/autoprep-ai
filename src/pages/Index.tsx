import { useState, useMemo, useCallback } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { StatsOverview } from '@/components/StatsOverview';
import { EDACharts } from '@/components/EDACharts';
import { DataPreview } from '@/components/DataPreview';
import { ColumnStatsTable } from '@/components/ColumnStatsTable';
import { InsightsPanel } from '@/components/InsightsPanel';
import { PreprocessingSidebar } from '@/components/PreprocessingSidebar';
import {
  analyzeDataset,
  applyPreprocessing,
  defaultPreprocessingOptions,
  dataToCSV,
  generatePythonCode,
  PreprocessingOptions,
  DatasetSummary,
} from '@/lib/dataAnalysis';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

function downloadFile(content: string, filename: string, type = 'text/csv') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const Index = () => {
  const [rawData, setRawData] = useState<Record<string, string>[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [options, setOptions] = useState<PreprocessingOptions>(defaultPreprocessingOptions);

  const summary: DatasetSummary | null = useMemo(() => {
    if (!rawData) return null;
    return analyzeDataset(rawData);
  }, [rawData]);

  const processedData = useMemo(() => {
    if (!rawData || !summary) return null;
    return applyPreprocessing(rawData, options, summary.columnStats);
  }, [rawData, options, summary]);

  const handleDataLoaded = useCallback((data: Record<string, string>[], name: string) => {
    setRawData(data);
    setFileName(name);
    setOptions(defaultPreprocessingOptions);
  }, []);

  const handleReset = useCallback(() => {
    setRawData(null);
    setFileName('');
  }, []);

  const handleExportCSV = useCallback(() => {
    if (!processedData) return;
    downloadFile(dataToCSV(processedData), `processed_${fileName}`);
  }, [processedData, fileName]);

  const handleExportPython = useCallback(() => {
    downloadFile(generatePythonCode(options), 'preprocessing_pipeline.py', 'text/x-python');
  }, [options]);

  const handleExportReport = useCallback(() => {
    if (!summary) return;
    const report = [
      `# EDA Report — ${fileName}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      `## Overview`,
      `- Rows: ${summary.rows}`,
      `- Columns: ${summary.columns}`,
      `- Numeric: ${summary.numericCols}`,
      `- Categorical: ${summary.categoricalCols}`,
      `- Total Missing: ${summary.totalMissingPct.toFixed(1)}%`,
      `- Health Score: ${summary.healthScore}%`,
      '',
      `## Column Details`,
      ...summary.columnStats.map(c =>
        `### ${c.name} (${c.type})\n- Missing: ${c.missingPct.toFixed(1)}%\n- Unique: ${c.unique}${
          c.type === 'numeric' ? `\n- Mean: ${c.mean?.toFixed(3)}\n- Std: ${c.std?.toFixed(3)}\n- Skewness: ${c.skewness?.toFixed(3)}` : ''
        }`
      ),
      '',
      `## Insights`,
      ...summary.insights,
    ].join('\n');
    downloadFile(report, `eda_report_${fileName.replace('.csv', '')}.md`, 'text/markdown');
  }, [summary, fileName]);

  if (!rawData || !summary || !processedData) {
    return <FileUploader onDataLoaded={handleDataLoaded} />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Header */}
        <header className="sticky top-0 z-10 glass-panel border-b border-border px-6 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            New Dataset
          </Button>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm gradient-text">AutoPrep AI</span>
          </div>
          <span className="text-xs text-muted-foreground font-mono ml-auto">{fileName}</span>
        </header>

        <div className="p-6 space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <StatsOverview summary={summary} />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <InsightsPanel insights={summary.insights} />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <EDACharts data={rawData} summary={summary} />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <ColumnStatsTable stats={summary.columnStats} />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <DataPreview data={processedData} columnStats={summary.columnStats} />
          </motion.div>
        </div>
      </div>

      {/* Sidebar */}
      <PreprocessingSidebar
        options={options}
        onChange={setOptions}
        onExportCSV={handleExportCSV}
        onExportPython={handleExportPython}
        onExportReport={handleExportReport}
        processedRows={processedData.length}
        originalRows={rawData.length}
      />
    </div>
  );
};

export default Index;
