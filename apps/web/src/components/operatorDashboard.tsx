'use client';

import { useEffect } from 'react';
import { useOperatorStore } from '../stores/operatorStore';
import { TransactionForm } from './transactionForm';
import { SimulationDisplay } from './simulationDisplay';
import { FilterPanel } from './filterPanel';
import { TransactionGrid } from './transactionGrid';

export function OperatorDashboard() {
  const { error, loadReferenceData } = useOperatorStore();

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
          <img
            src="/srmLogo.png"
            alt="SRM Credit Engine"
            width={48}
            height={48}
            className="rounded-xl"
          />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">SRM Credit Engine</h1>
            <p className="text-sm text-slate-600">Painel do Operador — Cessão de Crédito Multimoedas</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TransactionForm />
          <SimulationDisplay />
        </div>

        <FilterPanel />
        <TransactionGrid />
      </main>
    </div>
  );
}
