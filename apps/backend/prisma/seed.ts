import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

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
      rate: new Decimal('0.200000'), // 1 BRL = 0.20 USD
      validFrom: new Date('2024-01-01'),
      validUntil: null,
      source: 'BCB',
    },
  });

  await prisma.exchangeRate.create({
    data: {
      fromCurrencyId: usd.id,
      toCurrencyId: brl.id,
      rate: new Decimal('5.000000'), // 1 USD = 5.00 BRL
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
      baseSpread: new Decimal('0.015000'), // 1.5% ao ano
      minSpread: new Decimal('0.010000'),
      maxSpread: new Decimal('0.030000'),
      riskMultiplier: new Decimal('1.000'),
      validFrom: new Date('2024-01-01'),
      validUntil: null,
      active: true,
    },
  });

  await prisma.pricingStrategy.create({
    data: {
      assetTypeId: cheque.id,
      strategyName: 'ChequeStrategy',
      baseSpread: new Decimal('0.025000'), // 2.5% ao ano (maior risco)
      minSpread: new Decimal('0.020000'),
      maxSpread: new Decimal('0.050000'),
      riskMultiplier: new Decimal('1.200'), // 20% adicional
      validFrom: new Date('2024-01-01'),
      validUntil: null,
      active: true,
    },
  });

  await prisma.pricingStrategy.create({
    data: {
      assetTypeId: ccb.id,
      strategyName: 'DuplicataStrategy', // Reutiliza estratégia de duplicata
      baseSpread: new Decimal('0.012000'), // 1.2% ao ano (menor risco)
      minSpread: new Decimal('0.008000'),
      maxSpread: new Decimal('0.020000'),
      riskMultiplier: new Decimal('0.900'), // 10% desconto
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
      faceValue: new Decimal('100000.00'),
      daysToMaturity: 90,
      discountRate: new Decimal('0.003750'), // Calculado
      discountAmount: new Decimal('375.00'),
      netAmount: new Decimal('99625.00'),
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
      faceValue: new Decimal('50000.00'),
      daysToMaturity: 60,
      discountRate: new Decimal('0.005000'),
      discountAmount: new Decimal('250.00'),
      netAmount: new Decimal('49750.00'),
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
