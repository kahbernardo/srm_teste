import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.transaction.deleteMany();
  await prisma.pricingStrategy.deleteMany();
  await prisma.assetType.deleteMany();
  await prisma.exchangeRate.deleteMany();
  await prisma.currency.deleteMany();

  // Create currencies
  console.log('Creating currencies...');
  const brl = await prisma.currency.create({
    data: {
      code: 'BRL',
      name: 'Brazilian Real',
      symbol: 'R$',
      active: true,
    },
  });

  const usd = await prisma.currency.create({
    data: {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      active: true,
    },
  });

  console.log(`✅ Created currencies: ${brl.code}, ${usd.code}`);

  // Create exchange rates
  console.log('Creating exchange rates...');
  await prisma.exchangeRate.create({
    data: {
      fromCurrencyId: brl.id,
      toCurrencyId: usd.id,
      rate: 0.2, // 1 BRL = 0.20 USD
      validFrom: new Date('2024-01-01'),
      validUntil: null,
      source: 'BCB',
    },
  });

  await prisma.exchangeRate.create({
    data: {
      fromCurrencyId: usd.id,
      toCurrencyId: brl.id,
      rate: 5.0, // 1 USD = 5.00 BRL
      validFrom: new Date('2024-01-01'),
      validUntil: null,
      source: 'BCB',
    },
  });

  console.log('✅ Created exchange rates');

  // Create asset types
  console.log('Creating asset types...');
  const duplicata = await prisma.assetType.create({
    data: {
      code: 'DUPLICATA',
      name: 'Duplicata Mercantil',
      description: 'Título de crédito emitido pelo vendedor contra o comprador',
      active: true,
    },
  });

  const cheque = await prisma.assetType.create({
    data: {
      code: 'CHEQUE',
      name: 'Cheque Pré-datado',
      description: 'Ordem de pagamento à vista',
      active: true,
    },
  });

  const ccb = await prisma.assetType.create({
    data: {
      code: 'CCB',
      name: 'Cédula de Crédito Bancário',
      description: 'Título executivo extrajudicial representativo de operação de crédito',
      active: true,
    },
  });

  console.log(`✅ Created asset types: ${duplicata.code}, ${cheque.code}, ${ccb.code}`);

  // Create pricing strategies
  console.log('Creating pricing strategies...');
  await prisma.pricingStrategy.create({
    data: {
      assetTypeId: duplicata.id,
      strategyName: 'DuplicataStrategy',
      baseSpread: 0.015, // 1.5% ao ano
      minSpread: 0.01,
      maxSpread: 0.03,
      riskMultiplier: 1.0,
      validFrom: new Date('2024-01-01'),
      validUntil: null,
      active: true,
    },
  });

  await prisma.pricingStrategy.create({
    data: {
      assetTypeId: cheque.id,
      strategyName: 'ChequeStrategy',
      baseSpread: 0.025, // 2.5% ao ano (maior risco)
      minSpread: 0.02,
      maxSpread: 0.05,
      riskMultiplier: 1.2, // 20% adicional
      validFrom: new Date('2024-01-01'),
      validUntil: null,
      active: true,
    },
  });

  await prisma.pricingStrategy.create({
    data: {
      assetTypeId: ccb.id,
      strategyName: 'DuplicataStrategy', // Reutiliza estratégia de duplicata
      baseSpread: 0.012, // 1.2% ao ano (menor risco)
      minSpread: 0.008,
      maxSpread: 0.02,
      riskMultiplier: 0.9, // 10% desconto
      validFrom: new Date('2024-01-01'),
      validUntil: null,
      active: true,
    },
  });

  console.log('✅ Created pricing strategies');

  // Create sample transactions
  console.log('Creating sample transactions...');
  await prisma.transaction.create({
    data: {
      externalReference: 'DUP-2024-001',
      assetTypeId: duplicata.id,
      currencyId: brl.id,
      faceValue: 100000.0,
      daysToMaturity: 90,
      discountRate: 0.00375, // Calculado
      discountAmount: 375.0,
      netAmount: 99625.0,
      status: 'SETTLED',
      settledAt: new Date(),
      createdBy: 'system',
    },
  });

  await prisma.transaction.create({
    data: {
      externalReference: 'CHQ-2024-002',
      assetTypeId: cheque.id,
      currencyId: brl.id,
      faceValue: 50000.0,
      daysToMaturity: 60,
      discountRate: 0.005,
      discountAmount: 250.0,
      netAmount: 49750.0,
      status: 'PENDING',
      createdBy: 'system',
    },
  });

  console.log('✅ Created sample transactions');
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
