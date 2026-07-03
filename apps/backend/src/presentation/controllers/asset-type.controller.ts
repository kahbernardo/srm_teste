import { FastifyRequest, FastifyReply } from 'fastify';
import { AssetTypeService } from '../../business/services/asset-type.service';

const assetTypeService = new AssetTypeService();

export class AssetTypeController {
  async listAssetTypes(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { active } = request.query as { active?: string };
      const activeOnly = active !== 'false';

      const assetTypes = await assetTypeService.listAssetTypes(activeOnly);

      reply.code(200).send({
        success: true,
        data: assetTypes,
        count: assetTypes.length,
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  async getAssetType(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params as { id: string };
      const assetType = await assetTypeService.getAssetType(id);

      if (!assetType) {
        reply.code(404).send({
          success: false,
          error: 'Asset type not found',
        });
        return;
      }

      reply.code(200).send({
        success: true,
        data: assetType,
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  async getAssetTypeByCode(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { code } = request.params as { code: string };
      const assetType = await assetTypeService.getAssetTypeByCode(code.toUpperCase());

      if (!assetType) {
        reply.code(404).send({
          success: false,
          error: 'Asset type not found',
        });
        return;
      }

      reply.code(200).send({
        success: true,
        data: assetType,
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
}
