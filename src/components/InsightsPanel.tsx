import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

interface InsightsPanelProps {
  insights: string[];
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (!insights.length) return null;

  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="h-4 w-4 text-warning" />
        <h3 className="font-semibold text-sm">AI Insights</h3>
        <span className="text-xs text-muted-foreground ml-auto">{insights.length} suggestions</span>
      </div>
      <div className="space-y-2 max-h-48 overflow-auto scrollbar-thin">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="text-sm text-muted-foreground py-1.5 px-3 rounded-lg bg-secondary/50"
          >
            {insight}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
