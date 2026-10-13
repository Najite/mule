import { TransactionRecord, PaymentRail } from './types';

/**
 * ISO 20022 Financial Messaging Engine (pacs.008.001.08 & camt.053)
 * Standard interbank customer credit transfer message specification
 * used across NIBSS Instant Payment (NIP) and RTGS settlement networks.
 */
export class Iso20022Parser {
  /**
   * Parse pacs.008 XML message into typed TransactionRecord items
   */
  public static parsePacs008(xmlString: string): { records: TransactionRecord[]; error?: string } {
    try {
      const records: TransactionRecord[] = [];

      // Extract Credit Transfer Transaction Information blocks (<CdtTrfTxInf>)
      const txRegex = /<CdtTrfTxInf>([\s\S]*?)<\/CdtTrfTxInf>/g;
      let match: RegExpExecArray | null;

      let index = 1;
      while ((match = txRegex.exec(xmlString)) !== null) {
        const txXml = match[1];

        // EndToEndId
        const endToEndIdMatch = txXml.match(/<EndToEndId>([\s\S]*?)<\/EndToEndId>/);
        const txId = endToEndIdMatch ? endToEndIdMatch[1].trim() : `ISO-TXN-${index.toString().padStart(4, '0')}`;

        // Amount & Currency
        const amtMatch = txXml.match(/<IntrBkSttlmAmt[^>]*>([\s\S]*?)<\/IntrBkSttlmAmt>/);
        const amount = amtMatch ? parseFloat(amtMatch[1].trim()) : 0;

        // Settlement Date
        const dateMatch = txXml.match(/<IntrBkSttlmDt>([\s\S]*?)<\/IntrBkSttlmDt>/);
        const timestamp = dateMatch ? new Date(dateMatch[1].trim()).toISOString() : new Date().toISOString();

        // Debtor (Source)
        const dbtrAcctMatch = txXml.match(/<DbtrAcct>[\s\S]*?<Id>[\s\S]*?<Othr>[\s\S]*?<Id>([\s\S]*?)<\/Id>/);
        const sourceId = dbtrAcctMatch ? dbtrAcctMatch[1].trim() : `ACC-SRC-${index}`;

        const dbtrNmMatch = txXml.match(/<Dbtr>[\s\S]*?<Nm>([\s\S]*?)<\/Nm>/);
        const sourceName = dbtrNmMatch ? dbtrNmMatch[1].trim() : undefined;

        // Creditor (Target)
        const cdtrAcctMatch = txXml.match(/<CdtrAcct>[\s\S]*?<Id>[\s\S]*?<Othr>[\s\S]*?<Id>([\s\S]*?)<\/Id>/);
        const targetId = cdtrAcctMatch ? cdtrAcctMatch[1].trim() : `ACC-TGT-${index}`;

        const cdtrNmMatch = txXml.match(/<Cdtr>[\s\S]*?<Nm>([\s\S]*?)<\/Nm>/);
        const targetName = cdtrNmMatch ? cdtrNmMatch[1].trim() : undefined;

        // Channel / Payment Rail
        const railMatch = txXml.match(/<ClrSysPrtry>([\s\S]*?)<\/ClrSysPrtry>/);
        const rawRail = railMatch ? railMatch[1].trim().toUpperCase() : 'NIP';
        const rail: PaymentRail = ['NIP', 'POS', 'ATM', 'MOBILE', 'WEB', 'INTERNAL'].includes(rawRail)
          ? (rawRail as PaymentRail)
          : 'NIP';

        // Remittance Info / Narration
        const rmtMatch = txXml.match(/<RmtInf>[\s\S]*?<Ustrd>([\s\S]*?)<\/Ustrd>/);
        const narration = rmtMatch ? rmtMatch[1].trim() : 'ISO 20022 Interbank Settlement';

        // Supplementary Data (BVN, Device IMEI)
        const deviceMatch = txXml.match(/<Envlp>[\s\S]*?<DeviceId>([\s\S]*?)<\/DeviceId>/);
        const deviceId = deviceMatch ? deviceMatch[1].trim() : undefined;

        const bvnMatch = txXml.match(/<Envlp>[\s\S]*?<BVN>([\s\S]*?)<\/BVN>/);
        const bvn = bvnMatch ? bvnMatch[1].trim() : undefined;

        if (amount > 0) {
          records.push({
            id: txId,
            timestamp,
            sourceId,
            sourceName,
            targetId,
            targetName,
            amount,
            rail,
            narration,
            deviceId,
            bvn,
          });
        }

        index++;
      }

      if (records.length === 0) {
        return { records: [], error: 'No valid pacs.008 transaction blocks found in XML' };
      }

      return { records };
    } catch (err) {
      return { records: [], error: err instanceof Error ? err.message : 'Failed to parse ISO 20022 message' };
    }
  }

  /**
   * Generates a sample pacs.008.001.08 XML batch for testing and demonstration
   */
  public static generateSamplePacs008(): string {
    const timestamp = new Date().toISOString();
    return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>NIBSS-NIP-20261013-09821</MsgId>
      <CreDtTm>${timestamp}</CreDtTm>
      <NbOfTxs>3</NbOfTxs>
      <SttlmInf>
        <SttlmMtd>CLRG</SttlmMtd>
        <ClrSys>
          <Prtry>NIBSS_NIP</Prtry>
        </ClrSys>
      </SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <EndToEndId>NIP-ZENITH-TX-001</EndToEndId>
      </PmtId>
      <IntrBkSttlmAmt Ccy="NGN">4200000.00</IntrBkSttlmAmt>
      <IntrBkSttlmDt>2026-10-13T09:12:00Z</IntrBkSttlmDt>
      <ClrSysPrtry>NIP</ClrSysPrtry>
      <Dbtr>
        <Nm>O. Adeyemi (Retail Checking)</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id><Othr><Id>2081940192</Id></Othr></Id>
      </DbtrAcct>
      <Cdtr>
        <Nm>Apex Swift Logistics Ltd</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id><Othr><Id>1019284910</Id></Othr></Id>
      </CdtrAcct>
      <RmtInf>
        <Ustrd>Interbank clearing tranche 01</Ustrd>
      </RmtInf>
      <SplmtryData>
        <Envlp>
          <DeviceId>DEV-IOS-22</DeviceId>
          <BVN>BVN-2281940192</BVN>
        </Envlp>
      </SplmtryData>
    </CdtTrfTxInf>
    <CdtTrfTxInf>
      <PmtId>
        <EndToEndId>NIP-ZENITH-TX-002</EndToEndId>
      </PmtId>
      <IntrBkSttlmAmt Ccy="NGN">3850000.00</IntrBkSttlmAmt>
      <IntrBkSttlmDt>2026-10-13T09:16:30Z</IntrBkSttlmDt>
      <ClrSysPrtry>NIP</ClrSysPrtry>
      <Dbtr>
        <Nm>Apex Swift Logistics Ltd</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id><Othr><Id>1019284910</Id></Othr></Id>
      </DbtrAcct>
      <Cdtr>
        <Nm>K. Balogun Consulting</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id><Othr><Id>2048910291</Id></Othr></Id>
      </CdtrAcct>
      <RmtInf>
        <Ustrd>Vendor settlement invoice 992</Ustrd>
      </RmtInf>
      <SplmtryData>
        <Envlp>
          <DeviceId>DEV-IOS-22</DeviceId>
          <BVN>BVN-2281940192</BVN>
        </Envlp>
      </SplmtryData>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;
  }
}
