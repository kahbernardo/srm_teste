'use client';

import { useOperatorStore } from '../stores/operatorStore';

export function FilterPanel() {
  const { filters, currencies, assetTypes, setFilters } = useOperatorStore();

  return (
    <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <select
        value={filters.status ?? ''}
        onChange={(e) => setFilters({ status: e.target.value || undefined, page: 1 })}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">Todos os status</option>
        <option value="PENDING">Pendente</option>
        <option value="SETTLED">Liquidado</option>
        <option value="FAILED">Falhou</option>
        <option value="CANCELLED">Cancelado</option>
      </select>

      <select
        value={filters.currencyId ?? ''}
        onChange={(e) => setFilters({ currencyId: e.target.value || undefined, page: 1 })}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">Todas as moedas</option>
        {currencies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.code}
          </option>
        ))}
      </select>

      <select
        value={filters.assetTypeId ?? ''}
        onChange={(e) => setFilters({ assetTypeId: e.target.value || undefined, page: 1 })}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">Todos os tipos</option>
        {assetTypes.map((a) => (
          <option key={a.id} value={a.id}>
            {a.code}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Cedente"
        value={filters.cedente ?? ''}
        onChange={(e) =>
          setFilters({ cedente: e.target.value || undefined, page: 1 })
        }
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

      <input
        type="date"
        value={filters.startDate?.slice(0, 10) ?? ''}
        onChange={(e) =>
          setFilters({
            startDate: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined,
            page: 1,
          })
        }
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

      <input
        type="date"
        value={filters.endDate?.slice(0, 10) ?? ''}
        onChange={(e) =>
          setFilters({
            endDate: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined,
            page: 1,
          })
        }
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
