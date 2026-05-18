import { createHash, createSign, X509Certificate } from "node:crypto";
import { canonicalizeXml } from "./xml-canonicalizer";
import type { ZatcaCertificateBundle, ZatcaSignatureResult } from "./types";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSignatureXml(input: {
  signatureValue: string;
  digestValue: string;
  certificatePem: string;
  certificateFingerprint: string;
}) {
  const certBody = input.certificatePem
    .replace(/-----BEGIN CERTIFICATE-----/g, "")
    .replace(/-----END CERTIFICATE-----/g, "")
    .replace(/\s+/g, "");

  return `
<ext:UBLExtension>
  <ext:ExtensionContent>
    <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
      <ds:SignedInfo>
        <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
        <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256"/>
        <ds:Reference URI="">
          <ds:Transforms>
            <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
          </ds:Transforms>
          <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
          <ds:DigestValue>${escapeXml(input.digestValue)}</ds:DigestValue>
        </ds:Reference>
      </ds:SignedInfo>
      <ds:SignatureValue>${escapeXml(input.signatureValue)}</ds:SignatureValue>
      <ds:KeyInfo>
        <ds:X509Data>
          <ds:X509Certificate>${certBody}</ds:X509Certificate>
          <ds:X509SubjectName>${escapeXml(input.certificateFingerprint)}</ds:X509SubjectName>
        </ds:X509Data>
      </ds:KeyInfo>
    </ds:Signature>
  </ext:ExtensionContent>
</ext:UBLExtension>`.trim();
}

export function signZatcaXml(xml: string, bundle: ZatcaCertificateBundle): ZatcaSignatureResult {
  if (!bundle.available || !bundle.privateKeyPem || !bundle.certificatePem) {
    return {
      available: false,
      xml,
      blockers: bundle.blockers.length ? bundle.blockers : ["certificate-bundle-missing"],
    };
  }

  const canonical = canonicalizeXml(xml);
  const digestValue = createHash("sha256").update(canonical).digest("base64");
  const signer = createSign("sha256");
  signer.update(canonical);
  signer.end();

  const signatureValue = signer.sign(bundle.privateKeyPem, "base64");
  const certificateFingerprint = new X509Certificate(bundle.certificatePem).fingerprint256 ?? null;
  const signatureXml = buildSignatureXml({
    signatureValue,
    digestValue,
    certificatePem: bundle.certificatePem,
    certificateFingerprint: certificateFingerprint ?? "unknown",
  });

  const signedXml = xml.replace(/<ext:UBLExtensions>[\s\S]*?<\/ext:UBLExtensions>\s*/m, "");
  const finalXml = signedXml.replace(/(<cbc:ProfileID>[\s\S]*?<\/cbc:ProfileID>)/, `$1\n  ${signatureXml}`);

  return {
    available: true,
    xml: finalXml,
    signatureValue,
    digestValue,
    certificateFingerprint,
    blockers: [],
  };
}

