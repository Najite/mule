import { Groq } from 'groq-sdk';
import { SyndicateCluster, EntityNode, EntityEdge } from '../graph-engine/types';
import { ForensicDossierResult, AiCopilotService, GroqInferenceMetadata } from './ai-copilot';

export type EnrichedDossierResult = ForensicDossierResult;

/**
 * High-Speed AML Forensic Dossier Synthesizer powered by Groq LPU Hardware Inference
 * Uses official `groq-sdk` with LPU acceleration (~100-300ms inference).
 */
export class GroqForensicService {
  private static client: Groq | null = null;

  /**
   * Primary model: 120B parameter reasoning model on Groq LPU
   * Fallback model: Qwen 27B ultra-fast LPU model
   */
  public static readonly PRIMARY_MODEL = 'openai/gpt-oss-120b';
  public static readonly FALLBACK_MODEL = 'qwen/qwen3.8-27b';

  private static getClient(): Groq {
    if (!this.client) {
      const apiKey =
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GROQ_API_KEY) ||
        (typeof process !== 'undefined' && process.env?.GROQ_API_KEY) ||
        '';

      if (!apiKey) {
        throw new Error('GROQ_API_KEY is not configured in environment variables');
      }

      this.client = new Groq({
        apiKey,
        dangerouslyAllowBrowser: true,
        timeout: 3500,
        maxRetries: 1,
      });
    }
    return this.client;
  }

  /**
   * Synthesize an authoritative forensic AML dossier using Groq LPU
   */
  public static async synthesizeDossier(params: {
    cluster: SyndicateCluster;
    nodes: EntityNode[];
    edges: EntityEdge[];
    modelOverride?: string;
  }): Promise<EnrichedDossierResult> {
    const { cluster, nodes, edges, modelOverride } = params;

    // First generate the deterministic mathematical baseline (guaranteed zero-hallucination ground truth)
    const baseline = await AiCopilotService.synthesizeDossier({
      cluster,
      nodes,
      edges,
    });

    const clusterNodes = nodes.filter((n) => cluster.nodeIds.includes(n.id));
    const accountNodes = clusterNodes.filter((n) => n.type === 'account' || n.type === 'merchant');
    const deviceNodes = clusterNodes.filter((n) => n.type === 'device');

    const totalExposureNGN = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(cluster.totalExposure);

    const startTime = performance.now();

    const groq = this.getClient();
    const modelToUse = modelOverride || this.PRIMARY_MODEL;

    try {
      const systemPrompt = `You are a Principal AML/CFT Forensic Auditor and Central Bank of Nigeria (CBN) Special Enforcement Advisor for Zenith Bank Plc.
Your role is to produce rigorous, institutional-grade AML Dossiers for suspicious financial syndicates detected on NIBSS Instant Payment (NIP) rails.
Ground all reasoning strictly on:
1. Central Bank of Nigeria (CBN) AML/CFT Regulations 2022.
2. Section 6 of the Money Laundering (Prevention and Prohibition) Act (MLPA) 2022.
3. Nigerian Financial Intelligence Unit (NFIU) Suspicious Activity Reporting (SAR) guidelines.
4. The provided multigraph topological telemetry (do NOT invent account numbers or modify amounts).

Respond ONLY with a valid, parseable JSON object matching this schema:
{
  "executiveSummary": "Concise high-level institutional summary of the syndicate operation and laundering modus operandi",
  "topologicalProof": "Deep technical analysis of the graph topology (e.g. Tarjan SCC cycle, hub-and-spoke layering, or device clustering)",
  "hardwareForensics": "Forensic evaluation of shared IMEI/UUID hardware fingerprints, device multiplexing, and concurrent NIP sessions",
  "velocityAnalysis": "Evaluation of capital transshipment speed, rapid pass-through ratios, and structuring to bypass ₦5,000,000 CTR statutory limits",
  "nfiuNarrative": "Official SAR filing narrative for the Nigerian Financial Intelligence Unit citing statutory violations and recommending immediate PND"
}`;

      const userPrompt = `ANALYZE SYNDICATE TELEMETRY:
- Cluster Identifier: ${cluster.id} (${cluster.name})
- Detected Typology: ${cluster.typology.toUpperCase()}
- Composite Risk Score: ${cluster.riskScore}/99
- Total Verified Exposure: ${totalExposureNGN} (${cluster.totalExposure} NGN)
- Inbound Settlement Velocity: ${cluster.timeVelocityMinutes ? `${cluster.timeVelocityMinutes} minutes` : 'Rapid (<30 mins)'}
- Participating Accounts (${accountNodes.length}): ${accountNodes.map((a) => `${a.id} [${a.label}]`).join(', ')}
- Shared Hardware Tokens (${deviceNodes.length || cluster.sharedHardware?.length || 0}): ${
        cluster.sharedHardware?.join(', ') || deviceNodes.map((d) => d.label).join(', ') || 'N/A'
      }
- Cycle Path: ${cluster.typology === 'circular' ? cluster.nodeIds.join(' → ') : 'Directed Layering Tree'}

Produce the authoritative forensic report in pure JSON format.`;

      let completion;
      let finalModel = modelToUse;

      try {
        completion = await groq.chat.completions.create({
          model: modelToUse,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_completion_tokens: 2048,
        });
      } catch (primaryErr) {
        // Fallback to secondary fast model if primary fails
        console.warn(`Groq primary model (${modelToUse}) failed, attempting fallback (${this.FALLBACK_MODEL}):`, primaryErr);
        finalModel = this.FALLBACK_MODEL;
        completion = await groq.chat.completions.create({
          model: this.FALLBACK_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_completion_tokens: 800,
        });
      }

      const latencyMs = Math.round(performance.now() - startTime);
      const rawContent = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawContent);

      const metadata: GroqInferenceMetadata = {
        model: finalModel,
        provider: 'groq',
        latencyMs,
        totalTokens: completion.usage?.total_tokens,
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        queueTimeSec: completion.usage?.queue_time,
      };

      return {
        ...baseline,
        executiveSummary: parsed.executiveSummary || baseline.executiveSummary,
        topologicalProof: parsed.topologicalProof || baseline.topologicalProof,
        hardwareForensics: parsed.hardwareForensics || baseline.hardwareForensics,
        velocityAnalysis: parsed.velocityAnalysis || baseline.velocityAnalysis,
        nfiuNarrative: parsed.nfiuNarrative || baseline.nfiuNarrative,
        groqMetadata: metadata,
      };
    } catch (err) {
      console.warn('GroqForensicService: Groq LPU synthesis failed, falling back to deterministic compliance engine:', err);
      return {
        ...baseline,
        groqMetadata: {
          model: 'deterministic-fallback',
          provider: 'groq',
          latencyMs: Math.round(performance.now() - startTime),
        },
      };
    }
  }
}
