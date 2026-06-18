import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "@/lib/api";

// Import functions to test
import {
  companiesList,
  companyCreate,
  companyUpdate,
  companyDelete,
  accountsList,
  accountDetail,
  accountCreate,
  accountUpdate,
  accountDelete,
  acGroupMastersList,
  accountsDropdown,
  subaccountsList,
  subaccountCreate,
  subaccountDetail,
  subaccountUpdate,
  subaccountDelete,
  acGroupsList,
  acGroupCreate,
  acGroupDetail,
  acGroupUpdate,
  acGroupDelete,
  approvalLooseCreate,
  approvalLooseList,
  approvalTagCreate,
  approvalTagList,
  purAndApprovalCreate,
  purAndApprovalList,
  purchaseDiamondCreate,
  purchaseDiamondList,
  purchaseMCreate,
  purchaseMList,
  purchaseMDetail,
  purchaseMUpdate,
  purchaseMDelete,
  purchaseTagwiseCreate,
  purchaseTagwiseList,
  purchaseTagwiseDetail,
  purchaseTagwiseUpdate,
  purchaseTagwiseDelete,
  repairCreate,
  repairList,
  repairDetail,
  repairUpdate,
  repairDelete,
} from "@/lib/backend";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  apiFetch: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      public code: string,
      message: string
    ) {
      super(message);
    }
  },
  getAuthToken: vi.fn(() => "mock-token"),
  setAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
}));

describe("backend.ts - Company Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("companiesList returns array of companies", async () => {
    const mockCompanies = [
      { id: "1", name: "Company A", is_active: true, created_at: "2024-01-01" },
    ];
    (api.get as any).mockResolvedValue({ items: mockCompanies });
    const result = await companiesList();
    expect(result).toEqual(mockCompanies);
  });

  it("companyCreate creates a company", async () => {
    const mockCompany = {
      id: "1",
      name: "New Company",
      is_active: true,
      created_at: "2024-01-01",
    };
    (api.post as any).mockResolvedValue(mockCompany);
    const result = await companyCreate({ name: "New Company" });
    expect(result).toEqual(mockCompany);
  });

  it("companyUpdate updates a company", async () => {
    const mockCompany = {
      id: "1",
      name: "Updated Company",
      is_active: true,
      created_at: "2024-01-01",
    };
    (api.put as any).mockResolvedValue(mockCompany);
    const result = await companyUpdate("1", { name: "Updated Company" });
    expect(result).toEqual(mockCompany);
  });

  it("companyDelete deletes a company", async () => {
    (api.delete as any).mockResolvedValue(undefined);
    await companyDelete("1");
    expect(api.delete).toHaveBeenCalled();
  });
});

describe("backend.ts - Account Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accountsList returns paginated accounts", async () => {
    const mockResponse = {
      count: 1,
      next: null,
      previous: null,
      results: [{ id: "1", account_name: "Test" }],
    };
    (api.get as any).mockResolvedValue(mockResponse);
    const result = await accountsList();
    expect(result).toEqual(mockResponse);
  });

  it("accountDetail returns account details", async () => {
    const mockAccount = { id: "1", account_name: "Test Account" };
    (api.get as any).mockResolvedValue(mockAccount);
    const result = await accountDetail("1");
    expect(result).toEqual(mockAccount);
  });

  it("accountCreate creates an account", async () => {
    const mockAccount = { id: "1", account_name: "New Account" };
    (api.post as any).mockResolvedValue(mockAccount);
    const result = await accountCreate({ account_name: "New Account" });
    expect(result).toEqual(mockAccount);
  });

  it("accountUpdate updates an account", async () => {
    const mockAccount = { id: "1", account_name: "Updated Account" };
    (api.patch as any).mockResolvedValue(mockAccount);
    const result = await accountUpdate("1", {
      account_name: "Updated Account",
    });
    expect(result).toEqual(mockAccount);
  });

  it("accountDelete deletes an account", async () => {
    (api.delete as any).mockResolvedValue(undefined);
    await accountDelete("1");
    expect(api.delete).toHaveBeenCalled();
  });

  it("acGroupMastersList returns AC group masters", async () => {
    const mockGroups = [{ id: "1", name: "Group A" }];
    (api.get as any).mockResolvedValue({ ac_groups: mockGroups });
    const result = await acGroupMastersList();
    expect(result).toEqual(mockGroups);
  });

  it("accountsDropdown returns accounts dropdown", async () => {
    const mockAccounts = [{ id: "1", name: "Account A" }];
    (api.get as any).mockResolvedValue({ accounts: mockAccounts });
    const result = await accountsDropdown();
    expect(result).toEqual(mockAccounts);
  });
});

describe("backend.ts - Subaccount Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("subaccountsList returns paginated subaccounts", async () => {
    const mockSubaccounts = [{ id: "1", sub_account_name: "Sub A" }];
    (api.get as any).mockResolvedValue({ items: mockSubaccounts });
    const result = await subaccountsList();
    expect(result.items).toEqual(mockSubaccounts);
  });

  it("subaccountCreate creates a subaccount", async () => {
    const mockSubaccount = { id: "1", sub_account_name: "New Sub" };
    (api.post as any).mockResolvedValue(mockSubaccount);
    const result = await subaccountCreate({ sub_account_name: "New Sub" });
    expect(result).toEqual(mockSubaccount);
  });

  it("subaccountDetail returns subaccount details", async () => {
    const mockSubaccount = { id: "1", sub_account_name: "Sub A" };
    (api.get as any).mockResolvedValue(mockSubaccount);
    const result = await subaccountDetail("1");
    expect(result).toEqual(mockSubaccount);
  });

  it("subaccountUpdate updates a subaccount", async () => {
    const mockSubaccount = { id: "1", sub_account_name: "Updated Sub" };
    (api.patch as any).mockResolvedValue(mockSubaccount);
    const result = await subaccountUpdate("1", {
      sub_account_name: "Updated Sub",
    });
    expect(result).toEqual(mockSubaccount);
  });

  it("subaccountDelete deletes a subaccount", async () => {
    (api.delete as any).mockResolvedValue(undefined);
    await subaccountDelete("1");
    expect(api.delete).toHaveBeenCalled();
  });
});

describe("backend.ts - AC Group Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("acGroupsList returns paginated AC groups", async () => {
    const mockGroups = [{ id: "1", ac_group_id: "grp1" }];
    (api.get as any).mockResolvedValue({ items: mockGroups });
    const result = await acGroupsList();
    expect(result.items).toEqual(mockGroups);
  });

  it("acGroupCreate creates an AC group", async () => {
    const mockGroup = { id: "1", ac_group_id: "grp1" };
    (api.post as any).mockResolvedValue(mockGroup);
    const result = await acGroupCreate({ ac_group_id: "grp1" });
    expect(result).toEqual(mockGroup);
  });

  it("acGroupDetail returns AC group details", async () => {
    const mockGroup = { id: "1", ac_group_id: "grp1" };
    (api.get as any).mockResolvedValue(mockGroup);
    const result = await acGroupDetail("1");
    expect(result).toEqual(mockGroup);
  });

  it("acGroupUpdate updates an AC group", async () => {
    const mockGroup = { id: "1", ac_group_id: "grp2" };
    (api.patch as any).mockResolvedValue(mockGroup);
    const result = await acGroupUpdate("1", { ac_group_id: "grp2" });
    expect(result).toEqual(mockGroup);
  });

  it("acGroupDelete deletes an AC group", async () => {
    (api.delete as any).mockResolvedValue(undefined);
    await acGroupDelete("1");
    expect(api.delete).toHaveBeenCalled();
  });
});

describe("backend.ts - Approval Loose Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("approvalLooseCreate creates approval loose", async () => {
    const mockApproval = { id: "1", piece: 10 };
    (api.post as any).mockResolvedValue(mockApproval);
    const result = await approvalLooseCreate({ piece: 10 });
    expect(result).toEqual(mockApproval);
  });

  it("approvalLooseList returns paginated approval loose", async () => {
    const mockList = [{ id: "1", piece: 10 }];
    (api.get as any).mockResolvedValue({ items: mockList });
    const result = await approvalLooseList();
    expect(result.items).toEqual(mockList);
  });
});

describe("backend.ts - Approval Tag Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("approvalTagCreate creates approval tag", async () => {
    const mockTag = { id: "1", tag: "TAG1" };
    (api.post as any).mockResolvedValue(mockTag);
    const result = await approvalTagCreate({ tag: "TAG1" });
    expect(result).toEqual(mockTag);
  });

  it("approvalTagList returns paginated approval tags", async () => {
    const mockList = [{ id: "1", tag: "TAG1" }];
    (api.get as any).mockResolvedValue({ items: mockList });
    const result = await approvalTagList();
    expect(result.items).toEqual(mockList);
  });
});

describe("backend.ts - Purchase Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("purAndApprovalCreate creates pur and approval", async () => {
    const mockData = { id: "1", amount: 100 };
    (api.post as any).mockResolvedValue(mockData);
    const result = await purAndApprovalCreate({ amount: 100 });
    expect(result).toEqual(mockData);
  });

  it("purAndApprovalList returns paginated list", async () => {
    const mockList = [{ id: "1", amount: 100 }];
    (api.get as any).mockResolvedValue({ items: mockList });
    const result = await purAndApprovalList();
    expect(result.items).toEqual(mockList);
  });

  it("purchaseDiamondCreate creates purchase diamond", async () => {
    const mockData = { id: "1", diamond_type: "Round" };
    (api.post as any).mockResolvedValue(mockData);
    const result = await purchaseDiamondCreate({ diamond_type: "Round" });
    expect(result).toEqual(mockData);
  });

  it("purchaseDiamondList returns paginated list", async () => {
    const mockList = [{ id: "1", diamond_type: "Round" }];
    (api.get as any).mockResolvedValue({ items: mockList });
    const result = await purchaseDiamondList();
    expect(result.items).toEqual(mockList);
  });
});

describe("backend.ts - Purchase M Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("purchaseMCreate creates purchase M", async () => {
    const mockData = { id: "1", metal: "Gold" };
    (api.post as any).mockResolvedValue(mockData);
    const result = await purchaseMCreate({ metal: "Gold" });
    expect(result).toEqual(mockData);
  });

  it("purchaseMList returns paginated list", async () => {
    const mockList = [{ id: "1", metal: "Gold" }];
    (api.get as any).mockResolvedValue({ items: mockList });
    const result = await purchaseMList();
    expect(result.items).toEqual(mockList);
  });

  it("purchaseMDetail returns purchase M details", async () => {
    const mockData = { id: "1", metal: "Gold" };
    (api.get as any).mockResolvedValue(mockData);
    const result = await purchaseMDetail("1");
    expect(result).toEqual(mockData);
  });

  it("purchaseMUpdate updates purchase M", async () => {
    const mockData = { id: "1", metal: "Silver" };
    (api.patch as any).mockResolvedValue(mockData);
    const result = await purchaseMUpdate("1", { metal: "Silver" });
    expect(result).toEqual(mockData);
  });

  it("purchaseMDelete deletes purchase M", async () => {
    (api.delete as any).mockResolvedValue(undefined);
    await purchaseMDelete("1");
    expect(api.delete).toHaveBeenCalled();
  });
});

describe("backend.ts - Purchase Tagwise Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("purchaseTagwiseCreate creates purchase tagwise", async () => {
    const mockData = { id: "1", tag: "TAG1" };
    (api.post as any).mockResolvedValue(mockData);
    const result = await purchaseTagwiseCreate({ tag: "TAG1" });
    expect(result).toEqual(mockData);
  });

  it("purchaseTagwiseList returns paginated list", async () => {
    const mockList = [{ id: "1", tag: "TAG1" }];
    (api.get as any).mockResolvedValue({ items: mockList });
    const result = await purchaseTagwiseList();
    expect(result.items).toEqual(mockList);
  });

  it("purchaseTagwiseDetail returns purchase tagwise details", async () => {
    const mockData = { id: "1", tag: "TAG1" };
    (api.get as any).mockResolvedValue(mockData);
    const result = await purchaseTagwiseDetail("1");
    expect(result).toEqual(mockData);
  });

  it("purchaseTagwiseUpdate updates purchase tagwise", async () => {
    const mockData = { id: "1", tag: "TAG2" };
    (api.patch as any).mockResolvedValue(mockData);
    const result = await purchaseTagwiseUpdate("1", { tag: "TAG2" });
    expect(result).toEqual(mockData);
  });

  it("purchaseTagwiseDelete deletes purchase tagwise", async () => {
    (api.delete as any).mockResolvedValue(undefined);
    await purchaseTagwiseDelete("1");
    expect(api.delete).toHaveBeenCalled();
  });
});

describe("backend.ts - Repair Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("repairCreate creates repair", async () => {
    const mockData = { id: "1", repair_type: "Polish" };
    (api.post as any).mockResolvedValue(mockData);
    const result = await repairCreate({ repair_type: "Polish" });
    expect(result).toEqual(mockData);
  });

  it("repairList returns paginated list", async () => {
    const mockList = [{ id: "1", repair_type: "Polish" }];
    (api.get as any).mockResolvedValue({ items: mockList });
    const result = await repairList();
    expect(result.items).toEqual(mockList);
  });

  it("repairDetail returns repair details", async () => {
    const mockData = { id: "1", repair_type: "Polish" };
    (api.get as any).mockResolvedValue(mockData);
    const result = await repairDetail("1");
    expect(result).toEqual(mockData);
  });

  it("repairUpdate updates repair", async () => {
    const mockData = { id: "1", repair_type: "Resize" };
    (api.patch as any).mockResolvedValue(mockData);
    const result = await repairUpdate("1", { repair_type: "Resize" });
    expect(result).toEqual(mockData);
  });

  it("repairDelete deletes repair", async () => {
    (api.delete as any).mockResolvedValue(undefined);
    await repairDelete("1");
    expect(api.delete).toHaveBeenCalled();
  });
});
