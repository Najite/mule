import { SyndicateCluster, EntityNode, EntityEdge } from '../graph-engine/types';

/**
 * Official United Nations goAML XML Schema Generator
 * Compliant with Nigerian Financial Intelligence Unit (NFIU) AML/CFT 2022 filing standards.
 * Zenith Bank Institution Code: 057
 */
export class GoAmlReportGenerator {
  public static generateGoAmlXml(params: {
    cluster: SyndicateCluster;
    nodes: EntityNode[];
    edges: EntityEdge[];
    caseReference?: string;
    reportingOfficer?: string;
  }): string {
    const { cluster, nodes, edges, caseReference, reportingOfficer } = params;
    const ref = caseReference || `SAR-ZENITH-${Date.now().toString(36).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const officer = reportingOfficer || 'ZENITH_AML_INVESTIGATOR_L2';

    const involvedNodes = nodes.filter((n) => cluster.nodeIds.includes(n.id));
    const involvedEdges = edges.filter((e) => cluster.edgeIds.includes(e.id));

    // Construct valid goAML XML structure
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<report xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="goAML_v5.xsd">
  <rentity_id>ZENITH_BANK_057</rentity_id>
  <rentity_branch>ZENITH_HQ_VICTORIA_ISLAND</rentity_branch>
  <submission_code>SAR</submission_code>
  <report_code>STR_MULE_SYNDICATE</report_code>
  <case_id>${escapeXml(ref)}</case_id>
  <submission_date>${timestamp}</submission_date>
  <currency_code_local>NGN</currency_code_local>
  
  <report_indicators>
    <indicator>${escapeXml(cluster.code)}</indicator>
    <indicator>NIP_RAPID_DISPERSION</indicator>
    <indicator>DEVICE_HARDWARE_MULTIPLEX</indicator>
    <indicator>CBN_AML_CFT_REG_2022</indicator>
  </report_indicators>

  <reporting_institution>
    <institution_name>Zenith Bank Plc</institution_name>
    <institution_code>057</institution_code>
    <regulatory_body>CBN / NFIU</regulatory_body>
    <compliance_officer>${escapeXml(officer)}</compliance_officer>
  </reporting_institution>

  <suspicion_summary>
    <typology>${escapeXml(cluster.name)}</typology>
    <risk_score>${cluster.riskScore}</risk_score>
    <total_exposure_amount_ngn>${cluster.totalExposure.toFixed(2)}</total_exposure_amount_ngn>
    <narrative>
      <![CDATA[
${cluster.narrative}
      ]]>
    </narrative>
    <indicators_list>
${cluster.indicators.map((ind) => `      <indicator_item>${escapeXml(ind)}</indicator_item>`).join('\n')}
    </indicators_list>
  </suspicion_summary>

  <involved_accounts>
${involvedNodes
  .filter((n) => n.type === 'account' || n.type === 'merchant')
  .map(
    (node) => `    <t_account>
      <account_number>${escapeXml(node.id)}</account_number>
      <institution_code>057</institution_code>
      <institution_name>Zenith Bank Plc</institution_name>
      <account_name>${escapeXml(node.label)}</account_name>
      <entity_type>${escapeXml(node.type.toUpperCase())}</entity_type>
      <current_risk_score>${node.riskScore}</current_risk_score>
      <total_inflow_ngn>${node.metrics.totalInflow.toFixed(2)}</total_inflow_ngn>
      <total_outflow_ngn>${node.metrics.totalOutflow.toFixed(2)}</total_outflow_ngn>
      <retention_ratio>${(node.metrics.netRetentionRatio * 100).toFixed(1)}%</retention_ratio>
      <pnd_frozen>${node.isFrozen ? 'TRUE' : 'FALSE'}</pnd_frozen>
      ${node.metrics.associatedBvns.length > 0 ? `<bvn>${escapeXml(node.metrics.associatedBvns[0])}</bvn>` : ''}
    </t_account>`
  )
  .join('\n')}
  </involved_accounts>

  <transactions>
${involvedEdges
  .map(
    (edge, idx) => `    <transaction transactionnumber="${escapeXml(edge.id || `TX-${idx}`)}">
      <transaction_location>ZENITH_NIP_SWITCH</transaction_location>
      <date_transaction>${escapeXml(edge.timestamp || timestamp)}</date_transaction>
      <amount>${edge.amount.toFixed(2)}</amount>
      <currency_code>NGN</currency_code>
      <payment_rail>${escapeXml(edge.rail || 'NIP')}</payment_rail>
      <from_account>${escapeXml(edge.source)}</from_account>
      <to_account>${escapeXml(edge.target)}</to_account>
      <high_risk_flag>${edge.isHighRisk ? 'TRUE' : 'FALSE'}</high_risk_flag>
    </transaction>`
  )
  .join('\n')}
  </transactions>

  <recommended_actions>
    <action>${escapeXml(cluster.recommendedAction)}</action>
    <core_banking_instruction>EXECUTE FINACLE API MODIFY_ACCOUNT_FREEZE CODE 08</core_banking_instruction>
  </recommended_actions>
</report>`;

    return xml;
  }
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}
