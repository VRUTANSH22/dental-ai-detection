/**
 * Recharts bar chart for displaying prediction confidence scores.
 */
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { DISEASE_COLORS } from '../utils/constants';

export default function ConfidenceChart({ allConfidences, predictedClass }) {
  if (!allConfidences) return null;

  const data = Object.entries(allConfidences)
    .map(([name, value]) => ({ name, confidence: value }))
    .sort((a, b) => b.confidence - a.confidence);

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Confidence Distribution
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            fontSize={12}
            stroke="#94a3b8"
          />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            fontSize={12}
            stroke="#94a3b8"
            tick={{ fill: '#64748b' }}
          />
          <Tooltip
            formatter={(value) => [`${value.toFixed(2)}%`, 'Confidence']}
            contentStyle={{
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              fontSize: '13px',
            }}
          />
          <Bar dataKey="confidence" radius={[0, 6, 6, 0]} barSize={28}>
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={
                  entry.name === predictedClass
                    ? DISEASE_COLORS[entry.name] || '#0891B2'
                    : '#cbd5e1'
                }
                opacity={entry.name === predictedClass ? 1 : 0.5}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
