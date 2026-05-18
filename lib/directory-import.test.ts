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
    const table = parseImportTable([
      "customer,email,phone,city,country,vat_number,street,building_number,district,postal_code,secondary_number",
      "Acme Trading,ops@acme.test,+966500000001,Riyadh,Saudi Arabia,312345678900003,King Fahd Road,1234,Al Olaya,12345,5678",
    ].join("\n"));
    const mapping = buildDirectoryImportMapping(table.headers, getCustomerImportFields());
    const analysis = analyzeDirectoryImportMapping(table.headers, mapping, getDirectoryImportRequiredFields("customer"));
    const preview = buildCustomerImportPreview(table, mapping, []);

    expect(analysis.missingRequiredTargets).toHaveLength(0);
    expect(preview.rows).toHaveLength(1);
    expect(preview.rows[0]?.displayName).toBe("Acme Trading");
  });

  it("understands contact and supplier name variants", () => {
    const table = parseImportTable([
      "supplier_name,email_address,phone_number,city,country,vat_number,street,building_number,district,postal_code,secondary_number",
      "Alpha Gulf,ops@alpha.test,+966500000001,Riyadh,Saudi Arabia,312345678900003,King Fahd Road,1234,Al Olaya,12345,5678",
    ].join("\n"));
    const mapping = buildDirectoryImportMapping(table.headers, getCustomerImportFields());
    const preview = buildCustomerImportPreview(table, mapping, []);

    expect(mapping.displayName).toBe("supplier_name");
    expect(mapping.email).toBe("email_address");
    expect(mapping.phone).toBe("phone_number");
    expect(preview.rows).toHaveLength(1);
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

  it("auto-maps commercial registration column variants to CR number", () => {
    const csv = [
      "customer,Commercial Registration Number,email,phone,city,country,vat_number,street,building_number,district,postal_code,secondary_number",
      "Acme Trading,7080905544,ops@acme.test,+966500000001,Riyadh,Saudi Arabia,312345678900003,King Fahd Road,1234,Al Olaya,12345,5678",
    ].join("\n");
    const table = parseImportTable(csv);
    const mapping = buildDirectoryImportMapping(table.headers, getCustomerImportFields());
    expect(mapping.commercialRegistrationNumber).toBeTruthy();
    const preview = buildCustomerImportPreview(table, mapping, []);
    expect(preview.rows).toHaveLength(1);
    expect(preview.rows[0]?.crNumber).toBe("7080905544");

    const altCsv = [
      "display_name,CR Number,email,phone,city,country,vat_number,street,building_number,district,postal_code,secondary_number",
      "Jane Ltd,99100223,jane@example.test,+966500000004,Riyadh,Saudi Arabia,312345678900003,King Fahd Road,1235,Al Olaya,12345,5679",
    ].join("\n");
    const alt = parseImportTable(altCsv);
    const m2 = buildDirectoryImportMapping(alt.headers, getCustomerImportFields());
    expect(m2.commercialRegistrationNumber).toBeTruthy();
    const p2 = buildCustomerImportPreview(alt, m2, []);
    expect(p2.rows).toHaveLength(1);
    expect(p2.rows[0]?.crNumber).toBe("99100223");
  });

  it("maps opening balance, type, and as-of columns when recognizable", () => {
    const table = parseImportTable(
      [
        "display_name,Opening Balance,Opening Balance Type,Opening Balance Date,email,phone,city,country,vat_number,street,building_number,district,postal_code,secondary_number",
        "Opening Co,5420,normal_credit,2026-03-31,open@opening.test,+966500000002,Riyadh,Saudi Arabia,312345678900003,King Fahd Road,1236,Al Olaya,12346,5610",
      ].join("\n")
    );
    const mapping = buildDirectoryImportMapping(table.headers, getCustomerImportFields());
    expect(mapping.openingBalance).toBeTruthy();
    expect(mapping.openingBalanceType).toBeTruthy();
    expect(mapping.openingBalanceAsOf).toBeTruthy();

    const preview = buildCustomerImportPreview(table, mapping, []);
    expect(preview.rows).toHaveLength(1);
    expect(preview.rows[0]?.openingBalance).toBe(5420);
    expect(preview.rows[0]?.openingBalanceType).toBe("normal_credit");
    expect(preview.rows[0]?.openingBalanceAsOf).toBe("2026-03-31");
  });

  it("reports an error when opening balance type text is not debit nor credit", () => {
    const table = parseImportTable(
      [
        "display_name,email,Opening Balance,Opening Balance Type,phone,city,country,vat_number,street,building_number,district,postal_code,secondary_number",
        "Bad OB,bad@hisab.ae,100,mystery_type,+966500000003,Riyadh,Saudi Arabia,312345678900003,King Fahd Road,1237,Al Olaya,12347,5611",
      ].join("\n")
    );
    const mapping = buildDirectoryImportMapping(table.headers, getCustomerImportFields());
    const preview = buildCustomerImportPreview(table, mapping, []);
    expect(preview.rows).toHaveLength(0);
    expect(preview.issues.some((i) => i.message.includes("Opening balance type"))).toBe(true);
  });
});
