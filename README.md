# AutoPrep AI — Instant CSV Explorer & Preprocessor

🔗 **Live Demo:** [https://auto-prep-ai-tool.lovable.app](https://auto-prep-ai-tool.lovable.app)

A powerful, fully **client-side** Exploratory Data Analysis (EDA) tool built with React. Upload any CSV and get instant statistical analysis, interactive visualizations, smart insights, and automated preprocessing — all without any backend, API keys, or data leaving your browser.

## ✨ Features

- **Drag & drop CSV upload** with streaming chunk parsing (PapaParse)
- **Auto column detection** — numeric, categorical, datetime
- **Statistical summary** — mean, median, std, skewness, IQR, outlier counts
- **Interactive charts** — histograms, box plots, bar charts, correlation heatmap, pair plots
- **Data quality heatmap** — visualize missing values across all columns
- **Smart insights** — rule-based alerts for high missingness, multicollinearity, skewness, class imbalance
- **Preprocessing pipeline** — missing value imputation, scaling, encoding, outlier removal
- **Export options** — processed CSV, Python code, markdown report
- **100% offline** — all computation runs in the browser, zero data sent to any server

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| UI components | shadcn/ui (Radix primitives) |
| Charts | Recharts + custom SVG |
| CSV parsing | PapaParse |
| Animations | Framer Motion |
| Data analysis | Custom TypeScript (no external ML library) |

## 🚀 Getting Started

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and drop a CSV file to start exploring.

## 📦 Deploy

Since there's no backend, deploy anywhere that serves static files:

- **Lovable** — click Publish for an instant live URL
- **Vercel / Netlify** — import the repo, zero config
- **GitHub Pages** — build and push the `dist/` folder

## 📄 License

MIT
