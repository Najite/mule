import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import app from './index';

let testServer: Server;
let baseUrl: string;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    testServer = app.listen(0, () => {
      const addr = testServer.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://localhost:${addr.port}`;
      }
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    testServer.close(() => resolve());
  });
});

describe('FININT Backend API Test Suite', () => {
  it('GET /api/v1/health should return HEALTHY status and features', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('HEALTHY');
    expect(data.service).toBe('finint-intelligence-backend');
    expect(data.features.tarjanScc).toBe('O(V+E) Linear');
    expect(data.features.finaclePnd).toBe('HMAC-SHA256 Authenticated');
  });

  it('POST /api/v1/banking/verify-nuban should validate Zenith Bank NUBAN Modulo-10 checksum', async () => {
    const res = await fetch(`${baseUrl}/api/v1/banking/verify-nuban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountNumber: '2081940192',
        bankCode: '057',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.isValidNuban).toBe(true);
    expect(body.data.cbnCalculatedCheckDigit).toBe(2);
  });

  it('POST /api/v1/banking/finacle-pnd should execute authenticated PND hold with HMAC signature', async () => {
    const res = await fetch(`${baseUrl}/api/v1/banking/finacle-pnd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountNumbers: ['ACC-9901', 'ACC-9902'],
        reasonCode: '08',
        description: 'CBN AML/CFT 2022 - MONEY MULE RING',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe('SUCCESS');
    expect(body.responseCode).toBe('00');
    expect(body.hmacSignature).toBeDefined();
    expect(body.hmacSignature.length).toBe(64); // SHA256 hex is 64 chars
    expect(body.frozenAccounts).toContain('ACC-9901');
    expect(body.frozenAccounts).toContain('ACC-9902');
  });

  it('POST /api/v1/graph/analyze should run Tarjan SCC cycle detection server-side', async () => {
    const res = await fetch(`${baseUrl}/api/v1/graph/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactions: [
          {
            id: 'TXN-1',
            timestamp: '2026-10-08T10:00:00Z',
            sourceId: 'ACC-LOOP-1',
            targetId: 'ACC-LOOP-2',
            amount: 3000000,
            rail: 'NIP',
          },
          {
            id: 'TXN-2',
            timestamp: '2026-10-08T10:05:00Z',
            sourceId: 'ACC-LOOP-2',
            targetId: 'ACC-LOOP-1',
            amount: 2900000,
            rail: 'NIP',
          },
        ],
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.clusters.length).toBeGreaterThanOrEqual(1);
    expect(body.data.clusters[0].typology).toBe('circular');
    expect(body.data.metrics.algorithmUsed).toContain("Tarjan's SCC");
  });
});
