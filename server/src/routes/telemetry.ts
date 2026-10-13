import { Router, Request, Response } from 'express';
import { TelemetryService } from '@/lib/services/telemetry-api';

export const telemetryRouter = Router();

/**
 * POST /api/v1/telemetry/ip-scan
 * Server-side IP telemetry evaluation
 */
telemetryRouter.post('/ip-scan', async (req: Request, res: Response) => {
  try {
    const { ip } = req.body;
    const result = await TelemetryService.fetchIpTelemetry(ip);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Telemetry lookup failed',
    });
  }
});
