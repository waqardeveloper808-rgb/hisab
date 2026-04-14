export type BranchRecord = {
  id: string;
  code: string;
  name: string;
  city: string;
  manager: string;
  projects: number;
  receivables: number;
  status: "active" | "planned";
};

export type ProjectRecord = {
  id: string;
  code: string;
  name: string;
  customerName: string;
  branchCode: string;
  status: "active" | "billed" | "watch";
  openInvoices: number;
  openBills: number;
  margin: number;
};

export const previewBranches: BranchRecord[] = [
  {
    id: "branch-ryd",
    code: "RYD-HQ",
    name: "Riyadh HQ",
    city: "Riyadh",
    manager: "Finance desk",
    projects: 3,
    receivables: 4600,
    status: "active",
  },
  {
    id: "branch-jed",
    code: "JED-BR",
    name: "Jeddah Branch",
    city: "Jeddah",
    manager: "Operations lead",
    projects: 2,
    receivables: 2300,
    status: "active",
  },
  {
    id: "branch-dmm",
    code: "DMM-NEW",
    name: "Dammam Expansion",
    city: "Dammam",
    manager: "Unassigned",
    projects: 1,
    receivables: 0,
    status: "planned",
  },
];

export const previewProjects: ProjectRecord[] = [
  {
    id: "project-redsea",
    code: "PRJ-2401",
    name: "Red Sea rollout",
    customerName: "Red Sea Projects",
    branchCode: "JED-BR",
    status: "active",
    openInvoices: 1,
    openBills: 1,
    margin: 1800,
  },
  {
    id: "project-alnoor",
    code: "PRJ-2404",
    name: "Al Noor retail migration",
    customerName: "Al Noor Trading",
    branchCode: "RYD-HQ",
    status: "billed",
    openInvoices: 1,
    openBills: 0,
    margin: 2400,
  },
  {
    id: "project-eastern",
    code: "PRJ-2409",
    name: "Eastern supply optimization",
    customerName: "Eastern Paper Supply",
    branchCode: "RYD-HQ",
    status: "watch",
    openInvoices: 0,
    openBills: 1,
    margin: 600,
  },
];