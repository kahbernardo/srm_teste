import prisma from '../../persistence/prisma-client';
import { AssetType } from '@prisma/client';

export class AssetTypeService {
  async listAssetTypes(activeOnly = true): Promise<AssetType[]> {
    return await prisma.assetType.findMany({
      where: activeOnly ? { active: true } : {},
      include: {
        pricingStrategies: {
          where: {
            active: true,
            validFrom: { lte: new Date() },
            OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
          },
          orderBy: { validFrom: 'desc' },
          take: 1,
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async getAssetType(id: string): Promise<AssetType | null> {
    return await prisma.assetType.findUnique({
      where: { id },
      include: {
        pricingStrategies: {
          where: { active: true },
          orderBy: { validFrom: 'desc' },
        },
      },
    });
  }

  async getAssetTypeByCode(code: string): Promise<AssetType | null> {
    return await prisma.assetType.findUnique({
      where: { code },
    });
  }
}
