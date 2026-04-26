import type { VendorRecord } from "@/lib/workspace/types";

export const vendors: VendorRecord[] = [
  {
    id: "vend-001",
    vendorCode: "V-10442",
    legalName: "Najim Electrical Supply Co. Ltd",
    status: "active",
    vatNumber: "300123456700003",
    city: "Dammam",
    lastActivity: "2026-04-20",
  },
  {
    id: "vend-002",
    vendorCode: "V-20188",
    legalName: "Red Sea Packaging LLC",
    status: "active",
    vatNumber: "300987654300012",
    city: "Jeddah",
    lastActivity: "2026-04-18",
  },
  {
    id: "vend-003",
    vendorCode: "V-30002",
    legalName: "Al Maha Office Wholesale",
    status: "on_hold",
    city: "Riyadh",
    lastActivity: "2026-03-12",
  },
  {
    id: "vend-004",
    vendorCode: "V-41009",
    legalName: "Desert Date Farms Cooperative",
    status: "active",
    vatNumber: "300112233400055",
    city: "Al Qassim",
    lastActivity: "2026-04-19",
  },
];

export function findVendor(id: string) {
  return vendors.find((v) => v.id === id);
}
