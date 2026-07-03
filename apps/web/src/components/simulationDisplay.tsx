'use client';

import { useOperatorStore } from '../stores/operatorStore';

function formatMoney(value: number | string | undefined) {
  const num = Number(value ?? 0);
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatRate(value: number | string | undefined) {
  const num = Number(value ?? 0);
  return `${(num * 100).toFixed(4)}%`;
}

export function SimulationDisplay() {
  const { simulation, simulating } = useOperatorStore();

  if (!simulation && !simulating) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
        Preencha o formulário para simular o valor líquido
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
      <h2 className="mb-4 text-lg font-semibold text-emerald-900">Simulação em Tempo Real</h2>
      {simulating ? (
        <p className="text-sm text-emerald-700">Calculando precificação...</p>
      ) : simulation ? (
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-600">Valor de Face</dt>
            <dd className="text-lg font-semibold text-slate-900">
              R$ {formatMoney(simulation.faceValue)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-600">Taxa de Desconto</dt>
            <dd className="text-lg font-semibold text-slate-900">
              {formatRate(simulation.discountRate)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-600">Deságio</dt>
            <dd className="text-lg font-semibold text-red-600">
              R$ {formatMoney(simulation.discountAmount)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-600">Valor Líquido</dt>
            <dd className="text-2xl font-bold text-emerald-700">
              R$ {formatMoney(simulation.netAmount)}
            </dd>
          </div>
          {simulation.convertedAmount && (
            <div className="col-span-2">
              <dt className="text-slate-600">Valor Convertido</dt>
              <dd className="text-lg font-semibold text-blue-700">
                {formatMoney(simulation.convertedAmount)}
                {simulation.exchangeRateApplied && (
                  <span className="ml-2 text-sm text-slate-500">
                    (câmbio: {Number(simulation.exchangeRateApplied).toFixed(4)})
                  </span>
                )}
              </dd>
            </div>
          )}
        </dl>
      ) : null}
    </div>
  );
}
