// src/components/organisms/RuptureDetailsChart/RuptureDetailsChart.tsx
'use client';

import React from 'react';
import { Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

interface RuptureDetailsChartProps {
  ruptureDetails: Array<{
    periode: string;
    periode_libelle: string;
    quantite_vendue: number;
    quantite_commandee: number;
    quantite_receptionnee: number;
    quantite_stock: number;
    delta_quantite: number;
    taux_reception: number;
  }>;
  productName: string;
}

export const RuptureDetailsChart: React.FC<RuptureDetailsChartProps> = ({
  ruptureDetails,
  productName
}) => {
  const chartData = ruptureDetails.map(detail => ({
    periode: detail.periode_libelle.split(' ')[0],
    vendue: detail.quantite_vendue,
    commandee: detail.quantite_commandee,
    receptionnee: detail.quantite_receptionnee,
    stock: detail.quantite_stock,
    delta: detail.delta_quantite,
    taux: detail.taux_reception
  }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Évolution temporelle - {productName}
        </h3>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Quantités (Ventes, Commandes, Réceptions)
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="periode" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="vendue" fill="#3b82f6" name="Vendue" />
              <Line type="monotone" dataKey="commandee" stroke="#10b981" name="Commandée" strokeWidth={2} />
              <Line type="monotone" dataKey="receptionnee" stroke="#f59e0b" name="Réceptionnée" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Écarts, Stock et Taux de réception
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="periode" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="delta" fill="#ef4444" name="Delta Qté" />
              <Bar yAxisId="left" dataKey="stock" fill="#22c55e" name="Stock" />
              <Line yAxisId="right" type="monotone" dataKey="taux" stroke="#8b5cf6" name="Taux (%)" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};