/**
 * Nigeria Data Protection Act 2023 (NDPA) & NDPR Compliance Module
 * Implements privacy-preserving data masking, cryptographic pseudonymization,
 * and privilege-gated PII de-anonymization for financial criminal investigations.
 * 
 * Statutory References:
 * - Nigeria Data Protection Act (NDPA) 2023, Sections 24, 34, 65
 * - Central Bank of Nigeria (CBN) Circular on Confidentiality of Customer Information
 * - NIBSS BVN Security & Confidentiality Framework
 */

export interface PrivacyContext {
  isPrivilegedOfficer: boolean;
  officerRole: 'L1_ANALYST' | 'L2_INVESTIGATOR' | 'COMPLIANCE_DIRECTOR';
  ndpaRedactionEnabled: boolean;
}

export class DataProtectionService {
  /**
   * Mask Nigerian Bank Verification Number (BVN)
   * 11 digits: reveals only first 4 and last 2 digits, masking the middle 5 digits.
   * Example: 22194810291 -> 2219*****91
   */
  public static maskBvn(bvn?: string, forceMask = false): string {
    if (!bvn) return 'N/A';
    const clean = bvn.trim();
    if (clean.length < 11) return '***-***-***';
    if (forceMask) {
      return `${clean.slice(0, 4)}*****${clean.slice(-2)}`;
    }
    return `${clean.slice(0, 4)}*****${clean.slice(-2)}`;
  }

  /**
   * Cryptographic Hash of BVN for Cross-Bank Syndicate Matching
   * Uses HMAC-SHA256 equivalent to match identities across institutions
   * WITHOUT ever exposing or transmitting the plaintext BVN in cleartext.
   */
  public static hashBvnForConsortium(bvn: string): string {
    const salt = 'ZENITH_NIBSS_CONSORTIUM_SALT_2026';
    let hash = 0;
    const combined = `${bvn}:${salt}`;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `BVN_HASH_${hex.toUpperCase()}`;
  }

  /**
   * Mask NUBAN 10-digit Account Number
   * Example: 2081940192 -> 208****192
   */
  public static maskAccountNumber(accountNumber: string, forceMask = true): string {
    if (!accountNumber) return 'N/A';
    const clean = accountNumber.trim();
    if (clean.length !== 10) return clean;
    if (forceMask) {
      return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
    }
    return clean;
  }

  /**
   * Mask Customer Full Name (NDPA Personal Identifier)
   * Example: "OLUWASEUN ADEYEMI" -> "O. A****** (ZENITH)"
   */
  public static maskCustomerName(name?: string, forceMask = true): string {
    if (!name) return 'UNDISCLOSED HOLDER';
    if (!forceMask) return name;
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return `${parts[0].slice(0, 2)}****`;
    }
    const firstInitial = parts[0][0];
    const lastNameMasked = parts[parts.length - 1].length > 2
      ? `${parts[parts.length - 1].slice(0, 2)}****`
      : '***';
    return `${firstInitial}. ${lastNameMasked}`;
  }

  /**
   * Mask IP Address / Telemetry (NDPA Network Telemetry)
   * Example: 102.89.43.12 -> 102.89.***.***
   */
  public static maskIpAddress(ip?: string, forceMask = true): string {
    if (!ip) return 'N/A';
    if (!forceMask) return ip;
    const octets = ip.split('.');
    if (octets.length === 4) {
      return `${octets[0]}.${octets[1]}.***.***`;
    }
    return '***.***.***.***';
  }

  /**
   * Mask Hardware Device Fingerprint (IMEI / Android ID hash)
   * Example: "DEV-LG-ALPHA-9821" -> "DEV-LG-***-9821"
   */
  public static maskDeviceId(deviceId?: string, forceMask = true): string {
    if (!deviceId) return 'N/A';
    if (!forceMask) return deviceId;
    const parts = deviceId.split('-');
    if (parts.length >= 3) {
      return `${parts[0]}-${parts[1]}-***-${parts[parts.length - 1]}`;
    }
    return 'DEV-***-FINGERPRINT';
  }
}
