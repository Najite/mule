import { Router, Request, Response } from 'express';
import { ServerCopilotService } from '../services/copilot-service';

export const copilotRouter = Router();

/**
 * POST /api/v1/copilot/synthesize
 * Synthesizes forensic case dossier using Gemini LLM if key available, or deterministic rule engine
 */
copilotRouter.post('/synthesize', async (req: Request, res: Response) => {
  try {
    const { cluster, nodes, edges } = req.body;

    if (!cluster || !Array.isArray(nodes) || !Array.isArray(edges)) {
      return res.status(400).json({
        success: false,
        error: 'cluster, nodes array, and edges array are required in request body',
      });
    }

    const dossier = await ServerCopilotService.synthesize({
      cluster,
      nodes,
      edges,
    });

    res.json({ success: true, data: dossier });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Dossier synthesis failed',
    });
  }
});
