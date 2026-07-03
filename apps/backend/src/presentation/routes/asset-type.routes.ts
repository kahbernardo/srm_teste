import { FastifyInstance } from 'fastify';
import { AssetTypeController } from '../controllers/asset-type.controller';

const assetTypeController = new AssetTypeController();

export async function assetTypeRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/asset-types',
    {
      schema: {
        description: 'List all asset types',
        tags: ['asset-types'],
        querystring: {
          type: 'object',
          properties: {
            active: { type: 'boolean', default: true },
          },
        },
      },
    },
    assetTypeController.listAssetTypes
  );

  fastify.get(
    '/asset-types/:id',
    {
      schema: {
        description: 'Get asset type by ID',
        tags: ['asset-types'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    assetTypeController.getAssetType
  );

  fastify.get(
    '/asset-types/code/:code',
    {
      schema: {
        description: 'Get asset type by code (DUPLICATA, CHEQUE, etc)',
        tags: ['asset-types'],
        params: {
          type: 'object',
          properties: {
            code: { type: 'string' },
          },
        },
      },
    },
    assetTypeController.getAssetTypeByCode
  );
}
