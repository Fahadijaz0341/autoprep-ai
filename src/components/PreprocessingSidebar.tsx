import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Download, Code, FileDown, Settings2 } from 'lucide-react';
import { PreprocessingOptions } from '@/lib/dataAnalysis';
import { Separator } from '@/components/ui/separator';

interface PreprocessingSidebarProps {
  options: PreprocessingOptions;
  onChange: (options: PreprocessingOptions) => void;
  onExportCSV: () => void;
  onExportPython: () => void;
  onExportReport: () => void;
  processedRows: number;
  originalRows: number;
}

export function PreprocessingSidebar({
  options,
  onChange,
  onExportCSV,
  onExportPython,
  onExportReport,
  processedRows,
  originalRows,
}: PreprocessingSidebarProps) {
  const update = (partial: Partial<PreprocessingOptions>) => onChange({ ...options, ...partial });

  return (
    <div className="w-72 shrink-0 h-full border-l border-border bg-card/50 overflow-y-auto scrollbar-thin">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Preprocessing</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {processedRows.toLocaleString()} / {originalRows.toLocaleString()} rows
        </p>
      </div>

      <div className="p-4 space-y-5">
        {/* Missing Values */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Missing Values</p>
          <div className="flex items-center justify-between">
            <Label htmlFor="removeMissing" className="text-xs">Remove rows with missing</Label>
            <Switch id="removeMissing" checked={options.removeMissing} onCheckedChange={v => update({ removeMissing: v })} />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Imputation method</Label>
            <Select value={options.imputeMethod} onValueChange={v => update({ imputeMethod: v as PreprocessingOptions['imputeMethod'] })}>
              <SelectTrigger className="h-8 text-xs bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">None</SelectItem>
                <SelectItem value="mean" className="text-xs">Mean</SelectItem>
                <SelectItem value="median" className="text-xs">Median</SelectItem>
                <SelectItem value="mode" className="text-xs">Mode</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Outliers */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outlier Removal</p>
          <Select value={options.removeOutliers} onValueChange={v => update({ removeOutliers: v as PreprocessingOptions['removeOutliers'] })}>
            <SelectTrigger className="h-8 text-xs bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">None</SelectItem>
              <SelectItem value="iqr" className="text-xs">IQR Method</SelectItem>
              <SelectItem value="zscore" className="text-xs">Z-Score (±3σ)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Encoding */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Encoding</p>
          <div className="flex items-center justify-between">
            <Label htmlFor="oneHot" className="text-xs">One-Hot Encoding</Label>
            <Switch id="oneHot" checked={options.oneHotEncode} onCheckedChange={v => update({ oneHotEncode: v, labelEncode: v ? false : options.labelEncode })} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="labelEnc" className="text-xs">Label Encoding</Label>
            <Switch id="labelEnc" checked={options.labelEncode} onCheckedChange={v => update({ labelEncode: v, oneHotEncode: v ? false : options.oneHotEncode })} />
          </div>
        </div>

        <Separator />

        {/* Scaling */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Feature Scaling</p>
          <div className="flex items-center justify-between">
            <Label htmlFor="standardize" className="text-xs">Standardization (Z-score)</Label>
            <Switch id="standardize" checked={options.standardize} onCheckedChange={v => update({ standardize: v, normalize: v ? false : options.normalize })} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="normalize" className="text-xs">Normalization (0-1)</Label>
            <Switch id="normalize" checked={options.normalize} onCheckedChange={v => update({ normalize: v, standardize: v ? false : options.standardize })} />
          </div>
        </div>

        <Separator />

        {/* Correlation */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Feature Selection</p>
          <div className="flex items-center justify-between">
            <Label htmlFor="dropCorr" className="text-xs">Drop correlated features</Label>
            <Switch id="dropCorr" checked={options.dropCorrelated} onCheckedChange={v => update({ dropCorrelated: v })} />
          </div>
          {options.dropCorrelated && (
            <div>
              <Label className="text-xs mb-2 block">Threshold: {options.correlationThreshold.toFixed(2)}</Label>
              <Slider
                value={[options.correlationThreshold]}
                onValueChange={([v]) => update({ correlationThreshold: v })}
                min={0.7}
                max={1}
                step={0.01}
                className="py-1"
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Export */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Export</p>
          <Button onClick={onExportCSV} variant="outline" size="sm" className="w-full justify-start gap-2 text-xs h-8">
            <Download className="h-3.5 w-3.5" /> Download CSV
          </Button>
          <Button onClick={onExportPython} variant="outline" size="sm" className="w-full justify-start gap-2 text-xs h-8">
            <Code className="h-3.5 w-3.5" /> Python Code
          </Button>
          <Button onClick={onExportReport} variant="outline" size="sm" className="w-full justify-start gap-2 text-xs h-8">
            <FileDown className="h-3.5 w-3.5" /> EDA Report
          </Button>
        </div>
      </div>
    </div>
  );
}
