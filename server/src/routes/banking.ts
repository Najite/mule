import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { BankingService } from '@/lib/services/banking-api';

export const bankingRouter = Router();

// In-memory active PND holds database on server
const activePndHolds = new Map<
  string,
  {
    accountId: string;
    bankId: string;
    reasonCode: string;
    description: string;
    frozenAt: string;
    signature: string;
    transactionId: string;
  }
>();

/**
 * GET /api/v1/banking/banks
 * Proxies and caches Nigerian banks directory
 */
bankingRouter.get('/banks', async (_req: Request, res: Response) => {
  try {
    const banks = await BankingService.fetchNigerianBanks();
    res.json({ success: true, count: banks.length, data: banks });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed to fetch banks' });
  }
});

/**
 * POST /api/v1/banking/verify-nuban
 * Evaluates CBN Modulo-10 checksum
 */
bankingRouter.post('/verify-nuban', async (req: Request, res: Response) => {
  try {
    const { accountNumber, bankCode } = req.body;
    if (!accountNumber || !bankCode) {
      return res.status(400).json({ success: false, error: 'accountNumber and bankCode are required' });
    }

    const result = await BankingService.resolveAccount(accountNumber, bankCode);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Verification failed' });
  }
});

/**
 * POST /api/v1/banking/finacle-pnd
 * Executes Finacle Core Banking Post-No-Debit (PND) Hold with cryptographic HMAC signature
 */
bankingRouter.post('/finacle-pnd', (req: Request, res: Response) => {
  try {
    const { accountNumbers, reasonCode = '08', description, initiatorId = 'FININT_AML_OFFICER_L2' } = req.body;

    if (!Array.isArray(accountNumbers) || accountNumbers.length === 0) {
      return res.status(400).json({ success: false, error: 'accountNumbers array is required' });
    }

    const timestamp = new Date().toISOString();
    const transactionId = `FI-PND-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Cryptographic signature simulating Finacle FI Mutual Authentication & HSM Signing
    const signingPayload = `${transactionId}|057|${accountNumbers.join(',')}|${reasonCode}|${timestamp}`;
    const hmacSecret = process.env.FINACLE_SECRET || 'zenith_core_finacle_mock_key_2026';
    const signature = crypto.createHmac('sha256', hmacSecret).update(signingPayload).digest('hex');

    const frozenResults: string[] = [];

    for (const acc of accountNumbers) {
      activePndHolds.set(acc, {
        accountId: acc,
        bankId: '057',
        reasonCode,
        description: description || 'CBN AML/CFT 2022 - SUSPECTED MONEY MULE RING',
        frozenAt: timestamp,
        signature,
        transactionId,
      });
      frozenResults.push(acc);
    }

    res.json({
      success: true,
      service: 'Finacle_FI_ModifyAccountFreeze',
      status: 'SUCCESS',
      responseCode: '00',
      transactionId,
      timestamp,
      hmacSignature: signature,
      frozenAccounts: frozenResults,
      message: `Finacle Core Banking: Post-No-Debit (PND) hold placed successfully on ${frozenResults.length} accounts.`,
      directive: {
        freezeType: 'TOTAL_PND',
        reasonCode,
        description: description || 'CBN AML/CFT 2022 - SUSPECTED MONEY MULE RING',
        initiatorId,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'PND execution failed' });
  }
});

/**
 * GET /api/v1/banking/frozen-accounts
 * Lists all accounts currently on PND freeze
 */
bankingRouter.get('/frozen-accounts', (_req: Request, res: Response) => {
  const records = Array.from(activePndHolds.values());
  res.json({ success: true, count: records.length, data: records });
});

/**
 * DELETE /api/v1/banking/finacle-pnd/:accountId
 * Lifts a PND restriction
 */
bankingRouter.delete('/finacle-pnd/:accountId', (req: Request, res: Response) => {
  const { accountId } = req.params;
  const existed = activePndHolds.delete(accountId);

  res.json({
    success: true,
    accountId,
    action: 'UNFREEZE',
    existed,
    timestamp: new Date().toISOString(),
    message: existed
      ? `Finacle Core: PND restriction lifted on ${accountId}.`
      : `Account ${accountId} was not on active hold.`,
  });
});
