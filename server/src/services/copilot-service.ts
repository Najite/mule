import { Groq } from 'groq-sdk';
import { SyndicateCluster, EntityNode, EntityEdge } from '@/lib/graph-engine/types';
import { ForensicDossierResult, AiCopilotService } from '@/lib/services/ai-copilot';

/**
 * Server-Side Forensic Intelligence Copilot Service
 * - Powered by Groq LPU Hardware Acceleration via groq-sdk
 * - Fallback to deterministic compliance engine if key is absent or network fails
 */
export class ServerCopilotService {
  private static groqClient: Groq | null = null;

  private static getGroq(): Groq {
    if (!this.groqClient) {
      const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '';
      if (!apiKey) {
        throw new Error('GROQ_API_KEY is not configured in server environment');
      }
      this.groqClient = new Groq({ apiKey });
    }
    return this.groqClient;
  }

  public static async synthesize(params: {
    cluster: SyndicateCluster;
    nodes: EntityNode[];
    edges: EntityEdge[];
  }): Promise<ForensicDossierResult> {
    const baseline = await AiCopilotService.synthesizeDossier({
      cluster: params.cluster,
      nodes: params.nodes,
      edges: params.edges,
    });

    const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '';

    if (!apiKey) {
      return baseline;
    }

    const startTime = Date.now();

    try {
      const groq = this.getGroq();

      const prompt = `You are a Senior AML Forensic Investigator and Central Bank of Nigeria (CBN) AML/CFT 2022 Compliance Expert for Zenith Bank Plc.
Analyze the following financial multigraph cluster and generate an authoritative regulatory investigation dossier.

CLUSTER DATA:
- ID: ${params.cluster.id}
- Name: ${params.cluster.name}
- Typology: ${params.cluster.typology}
- Risk Score: ${params.cluster.riskScore}
- Total Exposure NGN: ${params.cluster.totalExposure}
- Nodes Involved: ${params.cluster.nodeIds.join(', ')}
- Hardware Tokens: ${params.cluster.sharedHardware?.join(', ') || 'None'}

Return ONLY a valid JSON object matching this exact structure:
{
  "executiveSummary": "Concise summary of syndicate operation",
  "topologicalProof": "Evidence citing Tarjan SCC or velocity dispersion",
  "hardwareForensics": "Analysis of shared IMEI/devices",
  "velocityAnalysis": "Capital transshipment timing analysis",
  "nfiuNarrative": "Official NFIU SAR narrative pursuant to Section 6 of MLPA 2022"
}`;

      let completion;
      let usedModel = 'openai/gpt-oss-120b';
      try {
        completion = await groq.chat.completions.create({
          model: usedModel,
          messages: [
            {
              role: 'system',
              content:
                'You are an institutional AML compliance AI for Zenith Bank Plc. Output only valid JSON.',
            },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        });
      } catch (err) {
        usedModel = 'qwen/qwen3.8-27b';
        completion = await groq.chat.completions.create({
          model: usedModel,
          messages: [
            {
              role: 'system',
              content:
                'You are an institutional AML compliance AI for Zenith Bank Plc. Output only valid JSON.',
            },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        });
      }

      const rawText = completion.choices[0]?.message?.content;
      if (!rawText) {
        throw new Error('Empty response from Groq API');
      }

      const parsed = JSON.parse(rawText);

      return {
        ...baseline,
        executiveSummary: parsed.executiveSummary || baseline.executiveSummary,
        topologicalProof: parsed.topologicalProof || baseline.topologicalProof,
        hardwareForensics: parsed.hardwareForensics || baseline.hardwareForensics,
        velocityAnalysis: parsed.velocityAnalysis || baseline.velocityAnalysis,
        nfiuNarrative: parsed.nfiuNarrative || baseline.nfiuNarrative,
        groqMetadata: {
          model: usedModel,
          provider: 'groq',
          latencyMs: Date.now() - startTime,
          totalTokens: completion.usage?.total_tokens,
          promptTokens: completion.usage?.prompt_tokens,
          completionTokens: completion.usage?.completion_tokens,
        },
      };
    } catch (err) {
      console.warn('ServerCopilotService: Groq LPU call failed, falling back to deterministic engine:', err);
      return baseline;
    }
  }
}
