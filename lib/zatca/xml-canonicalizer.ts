export function canonicalizeXml(xml: string): string {
  return xml
    .replace(/\r\n/g, "\n")
    .replace(/>\s+</g, "><")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

export function normalizeXmlWhitespace(xml: string): string {
  return xml.replace(/\r\n/g, "\n").trim();
}
