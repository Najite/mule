import { Router, Request, Response } from 'express';
import { GraphDetectionEngine } from '@/lib/graph-engine/algorithms';
import { TransactionRecord } from '@/lib/graph-engine/types';

export const graphRouter = Router();

/**
 * POST /api/v1/graph/analyze
 * Analyzes transaction stream with Tarjan SCC, device multiplexing, and dispersion
 */
graphRouter.post('/analyze', (req: Request, res: Response) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        error: 'transactions array is required',
      });
    }

    const results = GraphDetectionEngine.analyzeTransactions(transactions as TransactionRecord[]);
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Graph analysis failed',
    });
  }
});
