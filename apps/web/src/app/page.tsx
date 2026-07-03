export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">SRM Credit Engine</h1>
        <p className="text-xl text-gray-600 mb-8">
          Plataforma de Cessão de Crédito Multimoedas
        </p>
        <div className="flex gap-4 justify-center">
          <div className="px-6 py-3 bg-blue-600 text-white rounded-lg">
            <span className="font-semibold">Status:</span> Em Desenvolvimento
          </div>
          <div className="px-6 py-3 bg-green-600 text-white rounded-lg">
            <span className="font-semibold">Milestone:</span> M0 - Foundation
          </div>
        </div>
      </div>
    </main>
  );
}
