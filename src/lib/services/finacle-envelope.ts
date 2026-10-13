/**
 * Official Infosys Finacle Core Banking Integration Contract
 * Generates and parses Finacle Integrator (FI) XML/SOAP ModifyAccountFreeze envelopes
 * for Zenith Bank Plc (Bank ID: 057).
 */

export interface FinacleFreezeRequest {
  accountNumber: string;
  reasonCode: string; // '08' for CBN AML/CFT 2022
  reasonDescription: string;
  caseReference: string;
  initiatorOfficer: string;
  freezeType?: 'TOTAL_PND' | 'DEBIT_ONLY';
}

export interface FinacleResponseEnvelope {
  status: 'SUCCESS' | 'REJECTED' | 'INVALID_ACCOUNT';
  hostTransactionId: string;
  responseCode: string;
  message: string;
  timestamp: string;
  rawXml: string;
}

export class FinacleCoreConnector {
  /**
   * Generates production-ready Finacle FI XML SOAP envelope
   */
  public static buildModifyAccountFreezeXml(params: FinacleFreezeRequest): string {
    const timestamp = new Date().toISOString();
    const reqUuid = `FI-REQ-${Date.now().toString(36).toUpperCase()}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:fi="http://www.infosys.com/finacle/FI">
  <soapenv:Header>
    <fi:MessageKey>
      <fi:RequestUUID>${reqUuid}</fi:RequestUUID>
      <fi:ServiceRequestId>ModifyAccountFreeze</fi:ServiceRequestId>
      <fi:ServiceRequestVersion>11.0</fi:ServiceRequestVersion>
      <fi:ChannelId>ZENITH_AML_FININT_CORE</fi:ChannelId>
    </fi:MessageKey>
    <fi:SecurityInfo>
      <fi:BankId>057</fi:BankId>
      <fi:SignOnRole>AML_FRAUD_PREVENTION_ADMIN</fi:SignOnRole>
      <fi:Initiator>${escapeXml(params.initiatorOfficer)}</fi:Initiator>
    </fi:SecurityInfo>
  </soapenv:Header>
  <soapenv:Body>
    <fi:FI_ModifyAccountFreeze_Req>
      <fi:AccountFreezeAddRq>
        <fi:AcctId>
          <fi:AcctNum>${escapeXml(params.accountNumber)}</fi:AcctNum>
        </fi:AcctId>
        <fi:FreezeDetails>
          <fi:FreezeType>${params.freezeType || 'TOTAL_PND'}</fi:FreezeType>
          <fi:FreezeReasonCode>${escapeXml(params.reasonCode)}</fi:FreezeReasonCode>
          <fi:FreezeRemarks>${escapeXml(params.reasonDescription)} [Case Ref: ${escapeXml(params.caseReference)}]</fi:FreezeRemarks>
          <fi:EffectiveDate>${timestamp}</fi:EffectiveDate>
          <fi:StatutoryAuthority>CBN AML/CFT REGULATIONS 2022</fi:StatutoryAuthority>
        </fi:FreezeDetails>
      </fi:AccountFreezeAddRq>
    </fi:FI_ModifyAccountFreeze_Req>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Simulates Finacle Host processing and generates valid FI response envelope
   */
  public static simulateHostExecution(params: FinacleFreezeRequest): FinacleResponseEnvelope {
    const timestamp = new Date().toISOString();
    const hostTxId = `FIN-HOST-TX-${Date.now().toString(36).toUpperCase()}`;

    const isValidFormat = params.accountNumber.length === 10 && /^\d+$/.test(params.accountNumber);

    if (!isValidFormat) {
      return {
        status: 'INVALID_ACCOUNT',
        hostTransactionId: hostTxId,
        responseCode: '14',
        message: 'Finacle Host: Invalid NUBAN account format',
        timestamp,
        rawXml: `<FI_ModifyAccountFreeze_Res><Status>FAILURE</Status><HostCode>14</HostCode></FI_ModifyAccountFreeze_Res>`,
      };
    }

    const responseXml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <FI_ModifyAccountFreeze_Res>
      <Status>SUCCESS</Status>
      <HostTransactionId>${hostTxId}</HostTransactionId>
      <HostResponseCode>00</HostResponseCode>
      <AcctNum>${params.accountNumber}</AcctNum>
      <FreezeApplied>TOTAL_PND</FreezeApplied>
      <EffectiveDateTime>${timestamp}</EffectiveDateTime>
    </FI_ModifyAccountFreeze_Res>
  </soapenv:Body>
</soapenv:Envelope>`;

    return {
      status: 'SUCCESS',
      hostTransactionId: hostTxId,
      responseCode: '00',
      message: `Finacle Host: Post-No-Debit (PND) hold placed successfully on ${params.accountNumber}`,
      timestamp,
      rawXml: responseXml,
    };
  }
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
