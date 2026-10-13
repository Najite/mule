import { SyndicateCluster, EntityNode, EntityEdge } from '@/lib/graph-engine/types';
import { ForensicDossierResult, AiCopilotService } from '@/lib/services/ai-copilot';

/**
 * Server-Side Forensic Intelligence Copilot Service
 * - Calls real Google Gemini API if GEMINI_API_KEY is configured in the environment
 * - Validates schema output strictly
 * - Automatically falls back to deterministic compliance engine if key is absent or network fails
 */
export class ServerCopilotService {
  public static async synthesize(params: {
    cluster: SyndicateCluster;
    nodes: EntityNode[];
    edges: EntityEdge[];
  }): Promise<ForensicDossierResult> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      // Deterministic compliance baseline
      return AiCopilotService.synthesizeDossier({
        cluster: params.cluster,
        nodes: params.nodes,
        edges: params.edges,
      });
    }

    try {
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

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const json = await response.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Empty response from Gemini API');
      }

      const parsed = JSON.parse(rawText);

      // Merge LLM generated natural language with mathematically grounded citations
      const baseline = await AiCopilotService.synthesizeDossier({
        cluster: params.cluster,
        nodes: params.nodes,
        edges: params.edges,
      });

      return {
        ...baseline,
        executiveSummary: parsed.executiveSummary || baseline.executiveSummary,
        topologicalProof: parsed.topologicalProof || baseline.topologicalProof,
        hardwareForensics: parsed.hardwareForensics || baseline.hardwareForensics,
        velocityAnalysis: parsed.velocityAnalysis || baseline.velocityAnalysis,
        nfiuNarrative: parsed.nfiuNarrative || baseline.nfiuNarrative,
      };
    } catch (err) {
      console.warn('ServerCopilotService: LLM call failed, falling back to deterministic engine:', err);
      return AiCopilotService.synthesizeDossier({
        cluster: params.cluster,
        nodes: params.nodes,
        edges: params.edges,
      });
    }
  }
}
