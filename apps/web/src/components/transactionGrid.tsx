'use client';

import { useEffect } from 'react';
import { useOperatorStore } from '../stores/operatorStore';

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    SETTLED: 'bg-emerald-100 text-emerald-800',
    FAILED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-slate-100 text-slate-800',
  };
  return colors[status] ?? 'bg-slate-100 text-slate-800';
}

export function TransactionGrid() {
  const { transactions, pagination, loading, loadTransactions, settle, setFilters } =
    useOperatorStore();

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Extrato de Liquidações</h2>
        <p className="text-sm text-slate-500">
          {pagination.total} transações — página {pagination.page} de {pagination.totalPages}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Moeda</th>
              <th className="px-4 py-3 text-right">Valor Face</th>
              <th className="px-4 py-3 text-right">Valor Líquido</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Carregando...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Nenhuma transação encontrada
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">{tx.assetType?.code ?? '-'}</td>
                  <td className="px-4 py-3">{tx.currency?.code ?? '-'}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(tx.faceValue)}</td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-700">
                    {formatMoney(tx.netAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadge(tx.status)}`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {tx.status === 'PENDING' && (
                      <button
                        onClick={() => settle(tx.id)}
                        className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                      >
                        Liquidar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
        <button
          disabled={pagination.page <= 1}
          onClick={() => setFilters({ page: pagination.page - 1 })}
          className="rounded-lg border border-slate-300 px-3 py-1 text-sm disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="text-sm text-slate-600">
          Página {pagination.page} / {pagination.totalPages}
        </span>
        <button
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => setFilters({ page: pagination.page + 1 })}
          className="rounded-lg border border-slate-300 px-3 py-1 text-sm disabled:opacity-40"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
