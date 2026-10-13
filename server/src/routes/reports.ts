import { Router, Request, Response } from 'express';
import { GoAmlReportGenerator } from '@/lib/services/goaml-generator';

export const reportsRouter = Router();

/**
 * POST /api/v1/reports/goaml
 * Generates official UNODC goAML v5 XML filing
 */
reportsRouter.post('/goaml', (req: Request, res: Response) => {
  try {
    const { cluster, nodes, edges, caseReference, reportingOfficer } = req.body;

    if (!cluster || !Array.isArray(nodes) || !Array.isArray(edges)) {
      return res.status(400).json({
        success: false,
        error: 'cluster, nodes, and edges are required',
      });
    }

    const xml = GoAmlReportGenerator.generateGoAmlXml({
      cluster,
      nodes,
      edges,
      caseReference,
      reportingOfficer,
    });

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'goAML XML generation failed',
    });
  }
});
