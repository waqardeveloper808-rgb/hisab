import { describe, expect, it } from "vitest";
import {
  analyzeDirectoryImportMapping,
  buildCustomerImportPreview,
  buildDirectoryImportMapping,
  buildItemImportPreview,
  getCustomerImportFields,
  getDirectoryImportRequiredFields,
  getItemImportFields,
  parseImportTable,
} from "@/lib/directory-import";

describe("directory import", () => {
  it("maps and previews customer imports", () => {
    const table = parseImportTable("customer,email,city\nAcme Trading,ops@acme.test,Riyadh");
    const mapping = buildDirectoryImportMapping(table.headers, getCustomerImportFields());
    const analysis = analyzeDirectoryImportMapping(table.headers, mapping, getDirectoryImportRequiredFields("customer"));
    const preview = buildCustomerImportPreview(table, mapping, []);

    expect(analysis.missingRequiredTargets).toHaveLength(0);
    expect(preview.rows).toHaveLength(1);
    expect(preview.rows[0]?.displayName).toBe("Acme Trading");
  });

  it("blocks invalid customer emails", () => {
    const table = parseImportTable("customer,email\nBroken,bad-email");
    const mapping = buildDirectoryImportMapping(table.headers, getCustomerImportFields());
    const preview = buildCustomerImportPreview(table, mapping, []);

    expect(preview.rows).toHaveLength(0);
    expect(preview.issues[0]?.message).toContain("Email address");
  });

  it("maps and previews item imports", () => {
    const table = parseImportTable("product,sku,type,sale_price,purchase_price\nLED Panel,LED-10,product,250,180");
    const mapping = buildDirectoryImportMapping(table.headers, getItemImportFields());
    const preview = buildItemImportPreview(table, mapping, []);

    expect(preview.rows).toHaveLength(1);
    expect(preview.rows[0]?.kind).toBe("product");
    expect(preview.rows[0]?.salePrice).toBe(250);
  });

  it("flags invalid item numeric values", () => {
    const table = parseImportTable("name,sale_price\nConsulting,abc");
    const mapping = buildDirectoryImportMapping(table.headers, getItemImportFields());
    const preview = buildItemImportPreview(table, mapping, []);

    expect(preview.rows).toHaveLength(0);
    expect(preview.issues[0]?.message).toContain("numeric values");
  });
});