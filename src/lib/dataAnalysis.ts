export interface ColumnStats {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime' | 'text';
  count: number;
  missing: number;
  missingPct: number;
  unique: number;
  mean?: number;
  median?: number;
  std?: number;
  min?: number;
  max?: number;
  skewness?: number;
  q1?: number;
  q3?: number;
  mode?: string | number;
  topValues?: { value: string; count: number }[];
}

export interface DatasetSummary {
  rows: number;
  columns: number;
  totalMissing: number;
  totalMissingPct: number;
  numericCols: number;
  categoricalCols: number;
  healthScore: number;
  columnStats: ColumnStats[];
  correlationMatrix: { col1: string; col2: string; value: number }[];
  insights: string[];
}

export interface PreprocessingOptions {
  removeMissing: boolean;
  imputeMethod: 'none' | 'mean' | 'median' | 'mode';
  oneHotEncode: boolean;
  labelEncode: boolean;
  standardize: boolean;
  normalize: boolean;
  removeOutliers: 'none' | 'iqr' | 'zscore';
  dropCorrelated: boolean;
  correlationThreshold: number;
}

export const defaultPreprocessingOptions: PreprocessingOptions = {
  removeMissing: false,
  imputeMethod: 'none',
  oneHotEncode: false,
  labelEncode: false,
  standardize: false,
  normalize: false,
  removeOutliers: 'none',
  dropCorrelated: false,
  correlationThreshold: 0.95,
};

function detectColumnType(values: (string | number | null | undefined)[]): 'numeric' | 'categorical' | 'datetime' | 'text' {
  const nonNull = values.filter(v => v != null && v !== '');
  if (nonNull.length === 0) return 'text';

  const numericCount = nonNull.filter(v => !isNaN(Number(v))).length;
  if (numericCount / nonNull.length > 0.8) return 'numeric';

  const dateCount = nonNull.filter(v => !isNaN(Date.parse(String(v)))).length;
  if (dateCount / nonNull.length > 0.8) return 'datetime';

  const uniqueRatio = new Set(nonNull.map(String)).size / nonNull.length;
  if (uniqueRatio < 0.5 || new Set(nonNull.map(String)).size <= 20) return 'categorical';

  return 'text';
}

function getNumericValues(values: (string | number | null | undefined)[]): number[] {
  return values.filter(v => v != null && v !== '' && !isNaN(Number(v))).map(Number);
}

function mean(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function std(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / (arr.length - 1));
}

function skewness(arr: number[]): number {
  if (arr.length < 3) return 0;
  const m = mean(arr);
  const s = std(arr);
  if (s === 0) return 0;
  const n = arr.length;
  return (n / ((n - 1) * (n - 2))) * arr.reduce((sum, v) => sum + ((v - m) / s) ** 3, 0);
}

function quantile(arr: number[], q: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined ? sorted[base] + rest * (sorted[base + 1] - sorted[base]) : sorted[base];
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  const mx = mean(x.slice(0, n));
  const my = mean(y.slice(0, n));
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx;
    const b = y[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}

export function analyzeDataset(data: Record<string, string>[]): DatasetSummary {
  if (!data.length) {
    return { rows: 0, columns: 0, totalMissing: 0, totalMissingPct: 0, numericCols: 0, categoricalCols: 0, healthScore: 100, columnStats: [], correlationMatrix: [], insights: [] };
  }

  const columns = Object.keys(data[0]);
  const rows = data.length;
  const columnStats: ColumnStats[] = [];
  const insights: string[] = [];
  let totalMissing = 0;

  for (const col of columns) {
    const values = data.map(row => row[col]);
    const type = detectColumnType(values);
    const missing = values.filter(v => v == null || v === '' || v === 'null' || v === 'NaN').length;
    totalMissing += missing;
    const nonNullValues = values.filter(v => v != null && v !== '' && v !== 'null' && v !== 'NaN');
    const unique = new Set(nonNullValues).size;

    const stat: ColumnStats = {
      name: col,
      type,
      count: rows,
      missing,
      missingPct: (missing / rows) * 100,
      unique,
    };

    if (type === 'numeric') {
      const nums = getNumericValues(values);
      stat.mean = mean(nums);
      stat.median = median(nums);
      stat.std = std(nums);
      stat.min = Math.min(...nums);
      stat.max = Math.max(...nums);
      stat.skewness = skewness(nums);
      stat.q1 = quantile(nums, 0.25);
      stat.q3 = quantile(nums, 0.75);
    }

    if (type === 'categorical') {
      const freq: Record<string, number> = {};
      nonNullValues.forEach(v => { freq[String(v)] = (freq[String(v)] || 0) + 1; });
      stat.topValues = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }));
      stat.mode = stat.topValues[0]?.value;
    }

    if (stat.missingPct > 20) {
      insights.push(`⚠️ Column "${col}" has ${stat.missingPct.toFixed(1)}% missing values`);
    }
    if (type === 'numeric' && stat.skewness && Math.abs(stat.skewness) > 2) {
      insights.push(`📊 Column "${col}" is highly skewed (${stat.skewness.toFixed(2)})`);
    }
    if (unique === 1) {
      insights.push(`🔒 Column "${col}" has only one unique value — consider dropping`);
    }

    columnStats.push(stat);
  }

  // Correlation matrix for numeric columns
  const numericCols = columnStats.filter(c => c.type === 'numeric');
  const correlationMatrix: { col1: string; col2: string; value: number }[] = [];
  const numericData: Record<string, number[]> = {};
  for (const col of numericCols) {
    numericData[col.name] = getNumericValues(data.map(row => row[col.name]));
  }

  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i; j < numericCols.length; j++) {
      const corr = i === j ? 1 : pearsonCorrelation(numericData[numericCols[i].name], numericData[numericCols[j].name]);
      correlationMatrix.push({ col1: numericCols[i].name, col2: numericCols[j].name, value: corr });
      if (i !== j) {
        correlationMatrix.push({ col1: numericCols[j].name, col2: numericCols[i].name, value: corr });
        if (Math.abs(corr) > 0.9) {
          insights.push(`🔗 "${numericCols[i].name}" and "${numericCols[j].name}" are highly correlated (${corr.toFixed(2)})`);
        }
      }
    }
  }

  const totalMissingPct = (totalMissing / (rows * columns.length)) * 100;
  const healthScore = Math.max(0, Math.round(100 - totalMissingPct * 2 - insights.length * 3));

  return {
    rows,
    columns: columns.length,
    totalMissing,
    totalMissingPct,
    numericCols: numericCols.length,
    categoricalCols: columnStats.filter(c => c.type === 'categorical').length,
    healthScore,
    columnStats,
    correlationMatrix,
    insights,
  };
}

export function applyPreprocessing(
  data: Record<string, string>[],
  options: PreprocessingOptions,
  stats: ColumnStats[]
): Record<string, string>[] {
  let result = data.map(row => ({ ...row }));

  if (options.removeMissing) {
    result = result.filter(row => Object.values(row).every(v => v != null && v !== '' && v !== 'null' && v !== 'NaN'));
  }

  if (options.imputeMethod !== 'none') {
    for (const col of stats) {
      if (col.type === 'numeric') {
        let fillValue: number;
        if (options.imputeMethod === 'mean') fillValue = col.mean ?? 0;
        else if (options.imputeMethod === 'median') fillValue = col.median ?? 0;
        else fillValue = col.mean ?? 0; // mode fallback
        result.forEach(row => {
          if (row[col.name] == null || row[col.name] === '' || row[col.name] === 'NaN') {
            row[col.name] = String(fillValue);
          }
        });
      } else if (col.type === 'categorical' && options.imputeMethod === 'mode' && col.mode) {
        const modeVal = String(col.mode);
        result.forEach(row => {
          if (row[col.name] == null || row[col.name] === '') {
            row[col.name] = modeVal;
          }
        });
      }
    }
  }

  if (options.removeOutliers !== 'none') {
    for (const col of stats.filter(c => c.type === 'numeric')) {
      if (options.removeOutliers === 'iqr' && col.q1 != null && col.q3 != null) {
        const iqr = col.q3 - col.q1;
        const lower = col.q1 - 1.5 * iqr;
        const upper = col.q3 + 1.5 * iqr;
        result = result.filter(row => {
          const v = Number(row[col.name]);
          return isNaN(v) || (v >= lower && v <= upper);
        });
      } else if (options.removeOutliers === 'zscore' && col.mean != null && col.std != null && col.std > 0) {
        result = result.filter(row => {
          const v = Number(row[col.name]);
          return isNaN(v) || Math.abs((v - col.mean!) / col.std!) <= 3;
        });
      }
    }
  }

  if (options.normalize) {
    for (const col of stats.filter(c => c.type === 'numeric')) {
      if (col.min != null && col.max != null && col.max !== col.min) {
        result.forEach(row => {
          const v = Number(row[col.name]);
          if (!isNaN(v)) {
            row[col.name] = String((v - col.min!) / (col.max! - col.min!));
          }
        });
      }
    }
  } else if (options.standardize) {
    for (const col of stats.filter(c => c.type === 'numeric')) {
      if (col.mean != null && col.std != null && col.std > 0) {
        result.forEach(row => {
          const v = Number(row[col.name]);
          if (!isNaN(v)) {
            row[col.name] = String((v - col.mean!) / col.std!);
          }
        });
      }
    }
  }

  return result;
}

export function generateDistributionData(data: Record<string, string>[], column: string, bins = 15): { range: string; count: number }[] {
  const nums = data.map(r => Number(r[column])).filter(v => !isNaN(v));
  if (!nums.length) return [];
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min === max) return [{ range: String(min), count: nums.length }];
  const binWidth = (max - min) / bins;
  const histogram = Array.from({ length: bins }, (_, i) => ({
    range: `${(min + i * binWidth).toFixed(1)}`,
    count: 0,
  }));
  nums.forEach(v => {
    const idx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
    histogram[idx].count++;
  });
  return histogram;
}

export function dataToCSV(data: Record<string, string>[]): string {
  if (!data.length) return '';
  const cols = Object.keys(data[0]);
  const header = cols.map(c => `"${c}"`).join(',');
  const rows = data.map(row => cols.map(c => `"${row[c] ?? ''}"`).join(','));
  return [header, ...rows].join('\n');
}

export function generatePythonCode(options: PreprocessingOptions): string {
  const lines = [
    'import pandas as pd',
    'import numpy as np',
    'from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder, OneHotEncoder',
    '',
    '# Load dataset',
    'df = pd.read_csv("your_dataset.csv")',
    '',
  ];

  if (options.removeMissing) {
    lines.push('# Remove missing values', 'df = df.dropna()', '');
  }
  if (options.imputeMethod !== 'none') {
    lines.push(`# Impute missing values with ${options.imputeMethod}`);
    if (options.imputeMethod === 'mean') lines.push('df = df.fillna(df.mean(numeric_only=True))');
    else if (options.imputeMethod === 'median') lines.push('df = df.fillna(df.median(numeric_only=True))');
    else lines.push('df = df.fillna(df.mode().iloc[0])');
    lines.push('');
  }
  if (options.removeOutliers === 'iqr') {
    lines.push('# Remove outliers using IQR', 'Q1 = df.quantile(0.25)', 'Q3 = df.quantile(0.75)', 'IQR = Q3 - Q1', 'df = df[~((df < (Q1 - 1.5 * IQR)) | (df > (Q3 + 1.5 * IQR))).any(axis=1)]', '');
  }
  if (options.removeOutliers === 'zscore') {
    lines.push('# Remove outliers using Z-score', 'from scipy import stats', 'df = df[(np.abs(stats.zscore(df.select_dtypes(include=[np.number]))) < 3).all(axis=1)]', '');
  }
  if (options.standardize) {
    lines.push('# Standardize numeric features', 'scaler = StandardScaler()', 'numeric_cols = df.select_dtypes(include=[np.number]).columns', 'df[numeric_cols] = scaler.fit_transform(df[numeric_cols])', '');
  }
  if (options.normalize) {
    lines.push('# Normalize numeric features', 'scaler = MinMaxScaler()', 'numeric_cols = df.select_dtypes(include=[np.number]).columns', 'df[numeric_cols] = scaler.fit_transform(df[numeric_cols])', '');
  }
  if (options.oneHotEncode) {
    lines.push('# One-hot encode categorical features', 'df = pd.get_dummies(df, drop_first=True)', '');
  }
  if (options.labelEncode) {
    lines.push('# Label encode categorical features', 'le = LabelEncoder()', 'for col in df.select_dtypes(include=["object"]).columns:', '    df[col] = le.fit_transform(df[col].astype(str))', '');
  }
  if (options.dropCorrelated) {
    lines.push(`# Drop highly correlated features (threshold: ${options.correlationThreshold})`, 'corr_matrix = df.corr().abs()', 'upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))', `to_drop = [col for col in upper.columns if any(upper[col] > ${options.correlationThreshold})]`, 'df = df.drop(columns=to_drop)', '');
  }
  lines.push('# Save processed dataset', 'df.to_csv("processed_dataset.csv", index=False)', 'print(f"Processed dataset shape: {df.shape}")');
  return lines.join('\n');
}
