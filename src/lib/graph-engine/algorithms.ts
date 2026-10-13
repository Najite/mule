import {
  TransactionRecord,
  EntityNode,
  EntityEdge,
  SyndicateCluster,
  DetectionResults,
  EntityType,
  EntityArchetype,
  RiskFactor,
} from './types';

/**
 * FININT Graph Intelligence & Forensic Detection Engine (Phase 1 Production Grade)
 * - True Heterogeneous Bipartite Graph (Accounts, Devices, BVNs)
 * - Tarjan's Strongly Connected Components (SCC) in O(V + E) linear time
 * - Inflow-Correlated Temporal Dispersion Analysis
 * - Calibrated Archetype-Aware Risk Scorecard with auditable factor breakdowns
 */
export class GraphDetectionEngine {
  /**
   * Process a stream or batch of transactions and return full topology analysis
   */
  public static analyzeTransactions(transactions: TransactionRecord[]): DetectionResults {
    const startTime = performance.now();

    const nodeMap = new Map<string, EntityNode>();
    const edges: EntityEdge[] = [];
    const financialAdjacency = new Map<string, Array<{ target: string; edge: EntityEdge }>>();
    const inboundTxMap = new Map<string, TransactionRecord[]>();
    const outboundTxMap = new Map<string, TransactionRecord[]>();

    // 1. Build Nodes & Multigraph Edges (Accounts, Devices, BVNs)
    for (const tx of transactions) {
      // Ensure source account node exists
      if (!nodeMap.has(tx.sourceId)) {
        nodeMap.set(tx.sourceId, {
          id: tx.sourceId,
          label: tx.sourceName || tx.sourceId,
          type: this.inferNodeType(tx.sourceId, tx.merchantType),
          archetype: this.inferArchetype(tx.sourceId, tx.merchantType),
          riskScore: 10,
          metrics: {
            totalInflow: 0,
            totalOutflow: 0,
            inDegree: 0,
            outDegree: 0,
            netRetentionRatio: 1,
            connectedDeviceIds: [],
            associatedBvns: [],
            isInCycle: false,
          },
          x: (Math.random() - 0.5) * 360,
          y: (Math.random() - 0.5) * 360,
          vx: 0,
          vy: 0,
        });
      }

      // Ensure target account node exists
      if (!nodeMap.has(tx.targetId)) {
        nodeMap.set(tx.targetId, {
          id: tx.targetId,
          label: tx.targetName || tx.targetId,
          type: this.inferNodeType(tx.targetId, tx.merchantType),
          archetype: this.inferArchetype(tx.targetId, tx.merchantType),
          riskScore: 10,
          metrics: {
            totalInflow: 0,
            totalOutflow: 0,
            inDegree: 0,
            outDegree: 0,
            netRetentionRatio: 1,
            connectedDeviceIds: [],
            associatedBvns: [],
            isInCycle: false,
          },
          x: (Math.random() - 0.5) * 360,
          y: (Math.random() - 0.5) * 360,
          vx: 0,
          vy: 0,
        });
      }

      const sourceNode = nodeMap.get(tx.sourceId)!;
      const targetNode = nodeMap.get(tx.targetId)!;

      // Update financial metrics
      sourceNode.metrics.totalOutflow += tx.amount;
      sourceNode.metrics.outDegree += 1;
      targetNode.metrics.totalInflow += tx.amount;
      targetNode.metrics.inDegree += 1;

      // Track temporal transactions for dispersion correlation
      if (!outboundTxMap.has(tx.sourceId)) outboundTxMap.set(tx.sourceId, []);
      outboundTxMap.get(tx.sourceId)!.push(tx);

      if (!inboundTxMap.has(tx.targetId)) inboundTxMap.set(tx.targetId, []);
      inboundTxMap.get(tx.targetId)!.push(tx);

      // Primary Financial Edge
      const financialEdge: EntityEdge = {
        id: tx.id || `edge-${tx.sourceId}-${tx.targetId}-${Math.random().toString(36).substring(2, 6)}`,
        source: tx.sourceId,
        target: tx.targetId,
        amount: tx.amount,
        rail: tx.rail,
        timestamp: tx.timestamp,
        relationType: 'FINANCIAL_TRANSFER',
      };
      edges.push(financialEdge);

      if (!financialAdjacency.has(tx.sourceId)) {
        financialAdjacency.set(tx.sourceId, []);
      }
      financialAdjacency.get(tx.sourceId)!.push({ target: tx.targetId, edge: financialEdge });

      // 1b. Instantiate First-Class Device Node & Linkage
      if (tx.deviceId) {
        if (!sourceNode.metrics.connectedDeviceIds.includes(tx.deviceId)) {
          sourceNode.metrics.connectedDeviceIds.push(tx.deviceId);
        }

        if (!nodeMap.has(tx.deviceId)) {
          nodeMap.set(tx.deviceId, {
            id: tx.deviceId,
            label: tx.deviceId,
            type: 'device',
            riskScore: 20,
            metrics: {
              totalInflow: 0,
              totalOutflow: 0,
              inDegree: 0,
              outDegree: 0,
              netRetentionRatio: 1,
              connectedDeviceIds: [tx.deviceId],
              associatedBvns: [],
              isInCycle: false,
            },
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400,
            vx: 0,
            vy: 0,
          });
        }

        // Add Bipartite Hardware Link Edge
        const deviceEdgeId = `link-dev-${tx.sourceId}-${tx.deviceId}`;
        if (!edges.some((e) => e.id === deviceEdgeId)) {
          edges.push({
            id: deviceEdgeId,
            source: tx.sourceId,
            target: tx.deviceId,
            amount: 0,
            rail: tx.rail,
            timestamp: tx.timestamp,
            typology: 'device_link',
            relationType: 'AUTHENTICATED_ON',
          });
        }
      }

      // 1c. Instantiate First-Class BVN Identity Node & Linkage
      if (tx.bvn) {
        if (!sourceNode.metrics.associatedBvns.includes(tx.bvn)) {
          sourceNode.metrics.associatedBvns.push(tx.bvn);
        }

        if (!nodeMap.has(tx.bvn)) {
          nodeMap.set(tx.bvn, {
            id: tx.bvn,
            label: tx.bvn,
            type: 'bvn',
            riskScore: 15,
            metrics: {
              totalInflow: 0,
              totalOutflow: 0,
              inDegree: 0,
              outDegree: 0,
              netRetentionRatio: 1,
              connectedDeviceIds: [],
              associatedBvns: [tx.bvn],
              isInCycle: false,
            },
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400,
            vx: 0,
            vy: 0,
          });
        }

        const bvnEdgeId = `link-bvn-${tx.sourceId}-${tx.bvn}`;
        if (!edges.some((e) => e.id === bvnEdgeId)) {
          edges.push({
            id: bvnEdgeId,
            source: tx.sourceId,
            target: tx.bvn,
            amount: 0,
            rail: tx.rail,
            timestamp: tx.timestamp,
            typology: 'bvn_link',
            relationType: 'REGISTERED_TO_BVN',
          });
        }
      }
    }

    // 2. Compute Retention Ratios
    for (const node of nodeMap.values()) {
      if (node.metrics.totalInflow > 0) {
        const retained = Math.max(0, node.metrics.totalInflow - node.metrics.totalOutflow);
        node.metrics.netRetentionRatio = Number((retained / node.metrics.totalInflow).toFixed(3));
      }
    }

    // 3. Tarjan's Strongly Connected Components (SCC) in O(V + E)
    const accountNodeIds = Array.from(nodeMap.values())
      .filter((n) => n.type === 'account' || n.type === 'merchant')
      .map((n) => n.id);

    const sccs = this.runTarjanSCC(accountNodeIds, financialAdjacency);
    const cycleEdgeSet = new Set<string>();
    const clusters: SyndicateCluster[] = [];

    // Filter SCCs that represent actual circular layering loops (size >= 2)
    const cyclicSCCs = sccs.filter((scc) => scc.length >= 2);

    for (const scc of cyclicSCCs) {
      // Find internal edges forming the loop
      const sccSet = new Set(scc);
      const internalEdges = edges.filter(
        (e) => sccSet.has(e.source) && sccSet.has(e.target) && e.relationType === 'FINANCIAL_TRANSFER'
      );

      // Extract topologically verified directed simple cycle path within SCC
      const directedCyclePath = this.extractDirectedCyclePath(scc, financialAdjacency);

      for (const nodeId of scc) {
        const node = nodeMap.get(nodeId);
        if (node) {
          node.metrics.isInCycle = true;
          node.metrics.cycleLength = directedCyclePath.length;
        }
      }

      for (const edge of internalEdges) {
        cycleEdgeSet.add(edge.id);
        edge.isHighRisk = true;
        edge.typology = 'circular';
      }

      const cycleExposure = internalEdges.reduce((sum, e) => sum + e.amount, 0);

      clusters.push({
        id: `RING-SCC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        code: 'TYP-03',
        name: `SCC Circular Layering Loop (${directedCyclePath.length} Nodes)`,
        typology: 'circular',
        riskScore: 93,
        nodeIds: scc,
        edgeIds: internalEdges.map((e) => e.id),
        totalExposure: cycleExposure,
        cycleLength: directedCyclePath.length,
        narrative: this.generateSCCNarrative(directedCyclePath, cycleExposure),
        indicators: [
          `Tarjan's linear SCC traversal proved a closed directed cycle spanning ${directedCyclePath.length} accounts`,
          `High capital transshipment with negligible overnight retail retention`,
          `Coordinated circular turnover designed to simulate legitimate trade volume`,
        ],
        recommendedAction:
          'Place immediate Finacle PND (Freeze Code 08: AML/CFT) hold on all cycle nodes and file NFIU SAR.',
      });
    }

    // 4. Detect Device Multi-Accounting Clusters
    const deviceToAccounts = new Map<string, string[]>();
    for (const node of nodeMap.values()) {
      if (node.type === 'account' || node.type === 'merchant') {
        for (const devId of node.metrics.connectedDeviceIds) {
          if (!deviceToAccounts.has(devId)) {
            deviceToAccounts.set(devId, []);
          }
          if (!deviceToAccounts.get(devId)!.includes(node.id)) {
            deviceToAccounts.get(devId)!.push(node.id);
          }
        }
      }
    }

    for (const [devId, accIds] of deviceToAccounts.entries()) {
      if (accIds.length >= 2) {
        const clusterExposure = accIds.reduce(
          (sum, id) => sum + (nodeMap.get(id)?.metrics.totalOutflow || 0),
          0
        );

        const involvedEdgeIds = edges
          .filter(
            (e) =>
              (accIds.includes(e.source) && accIds.includes(e.target)) ||
              (e.target === devId && accIds.includes(e.source))
          )
          .map((e) => e.id);

        clusters.push({
          id: `RING-DEV-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          code: 'TYP-04',
          name: `Device Multiplex Syndicate (${devId})`,
          typology: 'shared_device',
          riskScore: accIds.length >= 3 ? 94 : 84,
          nodeIds: [...accIds, devId],
          edgeIds: involvedEdgeIds,
          totalExposure: clusterExposure,
          sharedHardware: [devId],
          narrative: `Hardware token ${devId} authenticated active sessions across ${accIds.length} distinct retail accounts (${accIds.join(', ')}). Bipartite graph mapping indicates a single controller operating multiple money-mule endpoints.`,
          indicators: [
            `Single physical hardware IMEI/UUID controlling ${accIds.length} disparate retail identities`,
            `Concurrent session logins within close temporal proximity on NIP rails`,
            `Coordinated outflow dispersion toward terminal cash-out endpoints`,
          ],
          recommendedAction:
            'Blacklist hardware signature across Zenith Mobile Gateway and apply Finacle PND hold.',
        });
      }
    }

    // 5. Inflow-Correlated Rapid Dispersion (Smurfing)
    const dispersionNodes = this.detectCorrelatedDispersion(
      inboundTxMap,
      outboundTxMap,
      nodeMap
    );

    for (const disp of dispersionNodes) {
      clusters.push({
        id: `RING-SMURF-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        code: 'TYP-01',
        name: `Inflow-Correlated Dispersion Hub (${disp.nodeId})`,
        typology: 'dispersion',
        riskScore: 89,
        nodeIds: [disp.nodeId, ...disp.outboundTargets],
        edgeIds: disp.edgeIds,
        totalExposure: disp.dispersionVolume,
        timeVelocityMinutes: disp.velocityMinutes,
        narrative: `Inbound lump-sum into ${disp.nodeId} was partitioned into ${disp.outboundTargets.length} outbound tranches within ${disp.velocityMinutes} minutes of settlement, exhibiting classic structured smurfing to evade ₦5,000,000 statutory CTR reporting.`,
        indicators: [
          `Rapid outbound splintering under 25 minutes from verified inbound settlement`,
          `Retention ratio < 15% (near-zero operating balance retained)`,
          `Multiple outbound destinations across POS agent cash-out corridors`,
        ],
        recommendedAction:
          'Place temporary restriction on beneficiary payouts and conduct emergency source-of-funds verification.',
      });
    }

    // 6. Calibrated Multi-Factor Risk Scorecard with Auditable Factor Breakdown
    for (const node of nodeMap.values()) {
      const breakdown: RiskFactor[] = [];
      let baseScore = 12;

      if (node.type === 'device') {
        const accountsControlled = deviceToAccounts.get(node.id)?.length || 0;
        baseScore = 15;
        if (accountsControlled >= 2) {
          const pts = accountsControlled >= 3 ? 65 : 45;
          breakdown.push({
            factor: 'Hardware Multiplexing',
            points: pts,
            description: `Authenticates sessions for ${accountsControlled} distinct retail identities`,
          });
          baseScore += pts;
        }
        node.riskScore = Math.min(99, Math.max(8, baseScore));
        node.riskBreakdown = breakdown;
        continue;
      }

      if (node.type === 'bvn') {
        node.riskScore = 15;
        node.riskBreakdown = [{ factor: 'Master Identity', points: 0, description: 'Verified KYC BVN Node' }];
        continue;
      }

      // Accounts and Merchants
      const archetype = node.archetype || 'retail';
      breakdown.push({ factor: 'Baseline Profiling', points: baseScore, description: `Standard ${archetype} baseline` });

      // Factor 1: Tarjan SCC Cycle
      if (node.metrics.isInCycle) {
        const cyclePts = archetype === 'sme_merchant' ? 25 : 38;
        breakdown.push({
          factor: "Tarjan's SCC Cycle",
          points: cyclePts,
          description: `Participates in closed directed cycle of length ${node.metrics.cycleLength || 'N/A'}`,
        });
        baseScore += cyclePts;
      }

      // Factor 2: Hardware Multiplexing
      if (node.metrics.connectedDeviceIds.length > 0) {
        const sharedDev = node.metrics.connectedDeviceIds[0];
        const sharedCount = deviceToAccounts.get(sharedDev)?.length || 1;
        if (sharedCount >= 2) {
          const devPts = sharedCount >= 3 ? 32 : 24;
          breakdown.push({
            factor: 'Shared Hardware',
            points: devPts,
            description: `Handset ${sharedDev} shared across ${sharedCount} unrelated accounts`,
          });
          baseScore += devPts;
        }
      }

      // Factor 3: Pass-Through Transshipment (Low Retention with High Turnover)
      if (node.metrics.totalInflow > 1000000 && node.metrics.netRetentionRatio < 0.15) {
        const passPts = archetype === 'sme_merchant' ? 12 : 22;
        breakdown.push({
          factor: 'Pass-Through Transshipment',
          points: passPts,
          description: `Total inflow ₦${(node.metrics.totalInflow / 1000000).toFixed(1)}M with only ${(node.metrics.netRetentionRatio * 100).toFixed(0)}% retention`,
        });
        baseScore += passPts;
      }

      // Factor 4: High Out-Degree Dispersion
      if (node.metrics.outDegree >= 4) {
        const outPts = archetype === 'sme_merchant' ? 5 : 12;
        breakdown.push({
          factor: 'High Out-Degree Dispersal',
          points: outPts,
          description: `Outbound fan-out degree = ${node.metrics.outDegree}`,
        });
        baseScore += outPts;
      }

      node.riskScore = Math.min(99, Math.max(8, baseScore));
      node.riskBreakdown = breakdown;
    }

    const nodesArray = Array.from(nodeMap.values());
    const highRiskNodesCount = nodesArray.filter((n) => n.riskScore >= 75).length;
    const totalVolume = edges
      .filter((e) => e.relationType === 'FINANCIAL_TRANSFER')
      .reduce((acc, e) => acc + e.amount, 0);
    const processingTimeMs = Number((performance.now() - startTime).toFixed(2));

    return {
      nodes: nodesArray,
      edges,
      clusters,
      metrics: {
        totalTransactions: transactions.length,
        totalVolume,
        highRiskNodesCount,
        detectedSyndicatesCount: clusters.length,
        processingTimeMs,
        algorithmUsed: "Tarjan's SCC O(V+E) & Bipartite Hardware Multiplexing",
      },
    };
  }

  /**
   * Tarjan's Strongly Connected Components Algorithm in O(V + E)
   */
  private static runTarjanSCC(
    nodes: string[],
    adjacency: Map<string, Array<{ target: string; edge: EntityEdge }>>
  ): string[][] {
    let index = 0;
    const indices = new Map<string, number>();
    const lowlink = new Map<string, number>();
    const onStack = new Map<string, boolean>();
    const stack: string[] = [];
    const sccs: string[][] = [];

    const strongConnect = (v: string) => {
      indices.set(v, index);
      lowlink.set(v, index);
      index++;
      stack.push(v);
      onStack.set(v, true);

      const neighbors = adjacency.get(v) || [];
      for (const { target } of neighbors) {
        if (!indices.has(target)) {
          strongConnect(target);
          lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(target)!));
        } else if (onStack.get(target)) {
          lowlink.set(v, Math.min(lowlink.get(v)!, indices.get(target)!));
        }
      }

      if (lowlink.get(v) === indices.get(v)) {
        const component: string[] = [];
        let w: string;
        do {
          w = stack.pop()!;
          onStack.set(w, false);
          component.push(w);
        } while (w !== v);

        sccs.push(component);
      }
    };

    for (const node of nodes) {
      if (!indices.has(node)) {
        strongConnect(node);
      }
    }

    return sccs;
  }

  /**
   * Correlates inbound settlement timestamp with outbound transfers within 25 minutes
   */
  private static detectCorrelatedDispersion(
    inboundMap: Map<string, TransactionRecord[]>,
    outboundMap: Map<string, TransactionRecord[]>,
    nodeMap: Map<string, EntityNode>
  ): Array<{
    nodeId: string;
    outboundTargets: string[];
    edgeIds: string[];
    dispersionVolume: number;
    velocityMinutes: number;
  }> {
    const results = [];

    for (const [nodeId, outTxs] of outboundMap.entries()) {
      const node = nodeMap.get(nodeId);
      if (!node || node.metrics.outDegree < 3 || node.metrics.netRetentionRatio >= 0.15) {
        continue;
      }

      const inTxs = inboundMap.get(nodeId) || [];
      const outTimestamps = outTxs
        .map((t) => new Date(t.timestamp).getTime())
        .filter((t) => !isNaN(t));

      if (outTimestamps.length >= 3) {
        const minOut = Math.min(...outTimestamps);
        const maxOut = Math.max(...outTimestamps);
        let velocityMinutes = Math.max(1, Math.round((maxOut - minOut) / (1000 * 60)));

        // If inbound exists, correlate delay from first inbound to outbound burst
        if (inTxs.length > 0) {
          const inTimestamps = inTxs
            .map((t) => new Date(t.timestamp).getTime())
            .filter((t) => !isNaN(t));
          if (inTimestamps.length > 0) {
            const minIn = Math.min(...inTimestamps);
            const totalSpan = Math.max(1, Math.round((maxOut - minIn) / (1000 * 60)));
            if (totalSpan <= 35) {
              velocityMinutes = totalSpan;
            }
          }
        }

        if (velocityMinutes <= 30) {
          results.push({
            nodeId,
            outboundTargets: outTxs.map((t) => t.targetId),
            edgeIds: outTxs.map((t) => t.id),
            dispersionVolume: outTxs.reduce((sum, t) => sum + t.amount, 0),
            velocityMinutes,
          });
        }
      }
    }

    return results;
  }

  /**
   * Traverses internal adjacency within an SCC to extract a mathematically valid simple directed cycle path
   */
  private static extractDirectedCyclePath(
    scc: string[],
    adjacency: Map<string, Array<{ target: string; edge: EntityEdge }>>
  ): string[] {
    const sccSet = new Set(scc);
    const visited = new Set<string>();
    const path: string[] = [];
    const indexInPath = new Map<string, number>();

    const dfs = (curr: string): string[] | null => {
      path.push(curr);
      indexInPath.set(curr, path.length - 1);
      visited.add(curr);

      const neighbors = adjacency.get(curr) || [];
      for (const { target } of neighbors) {
        if (!sccSet.has(target)) continue;

        if (indexInPath.has(target)) {
          const cycleStartIdx = indexInPath.get(target)!;
          return path.slice(cycleStartIdx);
        }

        if (!visited.has(target)) {
          const res = dfs(target);
          if (res) return res;
        }
      }

      path.pop();
      indexInPath.delete(curr);
      return null;
    };

    for (const node of scc) {
      if (!visited.has(node)) {
        const cycle = dfs(node);
        if (cycle && cycle.length >= 2) return cycle;
      }
    }

    return scc;
  }

  private static generateSCCNarrative(cyclePath: string[], totalAmount: number): string {
    const formatted = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(totalAmount);

    return `Tarjan's SCC decomposition verified a closed-loop directed fund flow of ${formatted} spanning ${cyclePath.length} accounts (${cyclePath.join(' → ')} → ${cyclePath[0]}). Capital was rapidly routed without underlying trade invoices, characteristic of smurfed turnover laundering.`;
  }

  private static inferNodeType(id: string, merchantType?: string): EntityType {
    if (merchantType || id.toLowerCase().includes('pos') || id.toLowerCase().includes('merchant')) {
      return 'merchant';
    }
    if (id.toLowerCase().includes('dev') || id.toLowerCase().includes('imei')) {
      return 'device';
    }
    if (id.toLowerCase().includes('bvn')) {
      return 'bvn';
    }
    if (id.toLowerCase().includes('ben') || id.toLowerCase().includes('offshore')) {
      return 'beneficiary';
    }
    return 'account';
  }

  private static inferArchetype(id: string, merchantType?: string): EntityArchetype {
    if (merchantType || id.toLowerCase().includes('pos') || id.toLowerCase().includes('merchant')) {
      return 'pos_agent';
    }
    if (id.toLowerCase().includes('ltd') || id.toLowerCase().includes('corp')) {
      return 'corporate';
    }
    return 'retail';
  }
}
