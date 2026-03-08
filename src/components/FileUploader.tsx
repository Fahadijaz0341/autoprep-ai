import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';

interface FileUploaderProps {
  onDataLoaded: (data: Record<string, string>[], fileName: string) => void;
}

export function FileUploader({ onDataLoaded }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be under 50MB');
      return;
    }
    setError(null);
    setIsLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsLoading(false);
        if (results.errors.length > 0) {
          setError(`Parse error: ${results.errors[0].message}`);
          return;
        }
        onDataLoaded(results.data as Record<string, string>[], file.name);
      },
      error: (err) => {
        setIsLoading(false);
        setError(`Failed to parse: ${err.message}`);
      },
    });
  }, [onDataLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <h1 className="text-5xl font-bold mb-3 tracking-tight">
          <span className="gradient-text">AutoPrep AI</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Automated Exploratory Data Analysis & Preprocessing
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-xl"
      >
        <label
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`
            relative flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer
            transition-all duration-300
            ${isDragging
              ? 'border-primary bg-primary/5 glow-border'
              : 'border-border hover:border-primary/40 hover:bg-card/50'
            }
            ${isLoading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          <input type="file" accept=".csv" onChange={handleFileInput} className="absolute inset-0 opacity-0 cursor-pointer" />

          <div className={`p-4 rounded-2xl transition-colors ${isDragging ? 'bg-primary/10' : 'bg-secondary'}`}>
            {isLoading ? (
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-primary" />
            )}
          </div>

          <div className="text-center">
            <p className="text-foreground font-medium text-lg">
              {isLoading ? 'Analyzing dataset...' : 'Drop your CSV file here'}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              or click to browse · CSV up to 50MB
            </p>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground text-xs mt-2">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Supports any CSV with headers</span>
          </div>
        </label>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
            >
              <X className="h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 grid grid-cols-3 gap-8 text-center max-w-lg"
      >
        {[
          { label: 'Auto EDA', desc: 'Instant insights' },
          { label: 'Smart Clean', desc: 'One-click preprocessing' },
          { label: 'Export', desc: 'CSV + Python code' },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-foreground font-semibold text-sm">{item.label}</p>
            <p className="text-muted-foreground text-xs mt-0.5">{item.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
