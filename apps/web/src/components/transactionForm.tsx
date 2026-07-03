'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOperatorStore } from '../stores/operatorStore';

const schema = z.object({
  assetTypeId: z.string().uuid(),
  currencyId: z.string().uuid(),
  targetCurrencyId: z.string().uuid().optional().or(z.literal('')),
  faceValue: z.coerce.number().positive(),
  daysToMaturity: z.coerce.number().int().positive(),
  externalReference: z.string().optional(),
  createdBy: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

export function TransactionForm() {
  const {
    currencies,
    assetTypes,
    simulating,
    loading,
    runSimulation,
    submitTransaction,
    loadReferenceData,
  } = useOperatorStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      createdBy: 'operator',
      faceValue: 10000,
      daysToMaturity: 30,
    },
  });

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  const watched = watch();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (watched.assetTypeId && watched.currencyId && watched.faceValue > 0) {
        runSimulation({
          assetTypeId: watched.assetTypeId,
          currencyId: watched.currencyId,
          targetCurrencyId: watched.targetCurrencyId || undefined,
          faceValue: Number(watched.faceValue),
          daysToMaturity: Number(watched.daysToMaturity),
          externalReference: watched.externalReference,
          createdBy: watched.createdBy,
        });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [
    watched.assetTypeId,
    watched.currencyId,
    watched.targetCurrencyId,
    watched.faceValue,
    watched.daysToMaturity,
    watched.externalReference,
    watched.createdBy,
    runSimulation,
  ]);

  const onSubmit = handleSubmit(async (data) => {
    await submitTransaction({
      ...data,
      targetCurrencyId: data.targetCurrencyId || undefined,
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Nova Operação</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Tipo de Recebível</label>
          <select
            {...register('assetTypeId')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Selecione...</option>
            {assetTypes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          {errors.assetTypeId && (
            <p className="mt-1 text-xs text-red-600">{errors.assetTypeId.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Moeda</label>
          <select
            {...register('currencyId')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Selecione...</option>
            {currencies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Moeda de Pagamento</label>
          <select
            {...register('targetCurrencyId')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Mesma moeda</option>
            {currencies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Valor de Face</label>
          <input
            type="number"
            step="0.01"
            {...register('faceValue')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Dias até Vencimento</label>
          <input
            type="number"
            {...register('daysToMaturity')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Referência Externa</label>
          <input
            type="text"
            {...register('externalReference')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || simulating}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Registrando...' : 'Registrar Liquidação'}
        </button>
        {simulating && <span className="text-sm text-slate-500">Calculando...</span>}
      </div>
    </form>
  );
}
