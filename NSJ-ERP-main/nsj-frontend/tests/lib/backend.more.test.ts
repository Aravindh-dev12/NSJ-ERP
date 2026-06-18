import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "@/lib/api";

import {
  repairIssueCreate,
  repairIssueList,
  repairIssueDetail,
  repairIssueUpdate,
  repairIssueDelete,
  orderIssueCreate,
  orderIssueList,
  orderIssueDetail,
  orderIssueUpdate,
  orderIssueDelete,
  accountReportList,
  vouchersList,
  vouchersArchivesList,
  vouchersAggregates,
  vouchersMasters,
  vouchersItemNames,
  vouchersClarities,
  vouchersShapes,
  vouchersUnits,
  voucherDetail,
  voucherCreate,
  voucherUpdate,
  voucherDelete,
  archiveDelete,
  queryList,
  queryDetail,
  queryCreate,
  queryUpdate,
  queryDelete,
  queryArchive,
  queryReopen,
  queryAddFollowUp,
  queryConvertToOrder,
  queryAutoArchive,
  salesList,
  saleDetail,
  saleCreate,
  saleUpdate,
  saleDelete,
  purReturnOverview,
  purReturnList,
  purReturnDetail,
  purReturnCreate,
  purReturnUpdate,
  purReturnDelete,
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

describe("backend.ts - Repair Issue Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("repairIssueCreate creates repair issue", async () => {
    const mockData = { id: "1", issue: "Broken" };
    (api.post as any).mockResolvedValue(mockData);
    const result = await repairIssueCreate({ issue: "Broken" });
    expect(result).toEqual(mockData);
  });

  it("repairIssueList returns paginated list", async () => {
    const mockList = [{ id: "1", issue: "Broken" }];
    (api.get as any).mockResolvedValue({ items: mockList });
    const result = await repairIssueList();
    expect(result.items).toEqual(mockList);
  });

  it("repairIssueDetail returns repair issue details", async () => {
    const mockData = { id: "1", issue: "Broken" };
    (api.get as any).mockResolvedValue(mockData);
    const result = await repairIssueDetail("1");
    expect(result).toEqual(mockData);
  });

  it("repairIssueUpdate updates repair issue", async () => {
    const mockData = { id: "1", issue: "Fixed" };
    (api.patch as any).mockResolvedValue(mockData);
    const result = await repairIssueUpdate("1", { issue: "Fixed" });
    expect(result).toEqual(mockData);
  });

  it("repairIssueDelete deletes repair issue", async () => {
    (api.delete as any).mockResolvedValue(undefined);
    await repairIssueDelete("1");
    expect(api.delete).toHaveBeenCalled();
  });
});

describe("backend.ts - Order Issue Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("orderIssueCreate creates order issue", async () => {
    const mockData = { id: "1", issue: "Delayed" };
    (api.post as any).mockResolvedValue(mockData);
    const result = await orderIssueCreate({ issue: "Delayed" });
    expect(result).toEqual(mockData);
  });

  it("orderIssueList returns paginated list", async () => {
    const mockList = [{ id: "1", issue: "Delayed" }];
    (api.get as any).mockResolvedValue({ items: mockList });
    const result = await orderIssueList();
    expect(result.items).toEqual(mockList);
  });

  it("orderIssueDetail returns order issue details", async () => {
    const mockData = { id: "1", issue: "Delayed" };
    (api.get as any).mockResolvedValue(mockData);
    const result = await orderIssueDetail("1");
    expect(result).toEqual(mockData);
  });

  it("orderIssueUpdate updates order issue", async () => {
    const mockData = { id: "1", issue: "Resolved" };
    (api.patch as any).mockResolvedValue(mockData);
    const result = await orderIssueUpdate("1", { issue: "Resolved" });
    expect(result).toEqual(mockData);
  });

  it("orderIssueDelete deletes order issue", async () => {
    (api.delete as any).mockResolvedValue(undefined);
    await orderIssueDelete("1");
    expect(api.delete).toHaveBeenCalled();
  });
});

describe("backend.ts - Account Report Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accountReportList returns paginated list", async () => {
    const mockList = [{ id: "1", report_type: "Monthly" }];
    (api.get as any).mockResolvedValue({ items: mockList });
    const result = await accountReportList();
    expect(result.items).toEqual(mockList);
  });
});

describe("backend.ts - Voucher Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("vouchersList returns paginated vouchers", async () => {
    const mockResponse = {
      count: 1,
      next: null,
      previous: null,
      results: [{ id: "1", voucher_number: "V001" }],
    };
    (api.get as any).mockResolvedValue(mockResponse);
    const result = await vouchersList();
    expect(result).toEqual(mockResponse);
  });

  it("vouchersArchivesList returns archived vouchers", async () => {
    const mockResponse = {
      count: 1,
      next: null,
      previous: null,
      results: [{ id: "1", voucher_number: "V001" }],
    };
    (api.get as any).mockResolvedValue(mockResponse);
    const result = await vouchersArchivesList();
    expect(result).toEqual(mockResponse);
  });

  it("vouchersAggregates returns aggregates", async () => {
    const mockData = { total: 100, with_advance: 50, recent_7_days: 10 };
    (api.get as any).mockResolvedValue(mockData);
    const result = await vouchersAggregates();
    expect(result).toEqual(mockData);
  });

  it("vouchersMasters returns masters data", async () => {
    const mockData = { series: [], stamps: [], base_metals: [] };
    (api.get as any).mockResolvedValue(mockData);
    const result = await vouchersMasters();
    expect(result).toEqual(mockData);
  });

  it("vouchersItemNames returns item names", async () => {
    const mockData = { item_names: [{ id: "1", name: "Ring" }] };
    (api.get as any).mockResolvedValue(mockData);
    const result = await vouchersItemNames();
    expect(result).toEqual(mockData);
  });

  it("vouchersClarities returns clarities", async () => {
    const mockData = { clarities: [{ id: "1", name: "VS1" }] };
    (api.get as any).mockResolvedValue(mockData);
    const result = await vouchersClarities();
    expect(result).toEqual(mockData);
  });

  it("vouchersShapes returns shapes", async () => {
    const mockData = { shapes: [{ id: "1", name: "Round" }] };
    (api.get as any).mockResolvedValue(mockData);
    const result = await vouchersShapes();
    expect(result).toEqual(mockData);
  });

  it("vouchersUnits returns units", async () => {
    const mockData = { units: [{ id: "1", name: "Gram" }] };
    (api.get as any).mockResolvedValue(mockData);
    const result = await vouchersUnits();
    expect(result).toEqual(mockData);
  });

  it("voucherDetail returns voucher details", async () => {
    const mockVoucher = { id: "1", voucher_number: "V001" };
    (api.get as any).mockResolvedValue(mockVoucher);
    const result = await voucherDetail("1");
    expect(result).toEqual(mockVoucher);
  });

  it("voucherCreate creates a voucher", async () => {
    const mockVoucher = { id: "1", voucher_number: "V001" };
    (api.post as any).mockResolvedValue(mockVoucher);
    const result = await voucherCreate({ voucher_number: "V001" });
    expect(result).toEqual(mockVoucher);
  });

  it("voucherUpdate updates a voucher", async () => {
    const mockVoucher = { id: "1", voucher_number: "V002" };
    (api.patch as any).mockResolvedValue(mockVoucher);
    const result = await voucherUpdate("1", { voucher_number: "V002" });
    expect(result).toEqual(mockVoucher);
  });

  it("voucherDelete deletes a voucher", async () => {
    (api.delete as any).mockResolvedValue(undefined);
    await voucherDelete("1");
    expect(api.delete).toHaveBeenCalled();
  });

  it("archiveDelete deletes an archive", async () => {
    (api.delete as any).mockResolvedValue(undefined);
    await archiveDelete("1");
    expect(api.delete).toHaveBeenCalled();
  });
});

describe("backend.ts - Query Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queryList returns paginated queries", async () => {
    const mockResponse = {
      count: 1,
      next: null,
      previous: null,
      results: [{ id: "1", status: "pending" }],
    };
    (api.get as any).mockResolvedValue(mockResponse);
    const result = await queryList();
    expect(result).toEqual(mockResponse);
  });

  it("queryDetail returns query details", async () => {
    const mockQuery = { id: "1", status: "pending" };
    (api.get as any).mockResolvedValue(mockQuery);
    const result = await queryDetail("1");
    expect(result).toEqual(mockQuery);
  });

  it("queryCreate creates a query", async () => {
    const mockQuery = { id: "1", status: "pending" };
    (api.post as any).mockResolvedValue(mockQuery);
    const result = await queryCreate({ status: "pending" });
    expect(result).toEqual(mockQuery);
  });

  it("queryUpdate updates a query", async () => {
    const mockQuery = { id: "1", status: "archived" };
    (api.patch as any).mockResolvedValue(mockQuery);
    const result = await queryUpdate("1", { status: "archived" });
    expect(result).toEqual(mockQuery);
  });

  it("queryDelete deletes a query", async () => {
    (api.delete as any).mockResolvedValue(undefined);
    await queryDelete("1");
    expect(api.delete).toHaveBeenCalled();
  });

  it("queryArchive archives a query", async () => {
    const mockQuery = { id: "1", status: "archived" };
    (api.post as any).mockResolvedValue(mockQuery);
    const result = await queryArchive("1");
    expect(result).toEqual(mockQuery);
  });

  it("queryReopen reopens a query", async () => {
    const mockQuery = { id: "1", status: "pending" };
    (api.post as any).mockResolvedValue(mockQuery);
    const result = await queryReopen("1");
    expect(result).toEqual(mockQuery);
  });

  it("queryAddFollowUp adds follow up", async () => {
    const mockQuery = { id: "1", status: "pending" };
    (api.post as any).mockResolvedValue(mockQuery);
    const result = await queryAddFollowUp("1", {
      follow_up_note: "Call customer",
    });
    expect(result).toEqual(mockQuery);
  });

  it("queryConvertToOrder converts query to order", async () => {
    const mockResponse = {
      order_id: "O1",
      order_bill_no: "B001",
      query_id: "1",
      status: "converted",
      message: "Success",
    };
    (api.post as any).mockResolvedValue(mockResponse);
    const result = await queryConvertToOrder("1", { receipt_voucher_id: "R1" });
    expect(result).toEqual(mockResponse);
  });

  it("queryAutoArchive auto archives queries", async () => {
    const mockResponse = { message: "Archived 5 queries" };
    (api.post as any).mockResolvedValue(mockResponse);
    const result = await queryAutoArchive();
    expect(result).toEqual(mockResponse);
  });
});

describe("backend.ts - Sales Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("salesList returns paginated sales", async () => {
    const mockResponse = {
      count: 1,
      next: null,
      previous: null,
      results: [{ id: "1", amount: 1000 }],
    };
    (api.get as any).mockResolvedValue(mockResponse);
    const result = await salesList();
    expect(result).toEqual(mockResponse);
  });

  it("saleDetail returns sale details", async () => {
    const mockSale = { id: "1", amount: 1000 };
    (api.get as any).mockResolvedValue(mockSale);
    const result = await saleDetail("1");
    expect(result).toEqual(mockSale);
  });

  it("saleCreate creates a sale", async () => {
    const mockSale = { id: "1", amount: 1000 };
    (api.post as any).mockResolvedValue(mockSale);
    const result = await saleCreate({ amount: 1000 });
    expect(result).toEqual(mockSale);
  });

  it("saleUpdate updates a sale", async () => {
    const mockSale = { id: "1", amount: 1500 };
    (api.patch as any).mockResolvedValue(mockSale);
    const result = await saleUpdate("1", { amount: 1500 });
    expect(result).toEqual(mockSale);
  });

  it("saleDelete deletes a sale", async () => {
    (api.delete as any).mockResolvedValue(undefined);
    await saleDelete("1");
    expect(api.delete).toHaveBeenCalled();
  });
});

describe("backend.ts - Purchase Return Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("purReturnOverview returns overview", async () => {
    const mockData = { total: 100, pending: 10 };
    (api.get as any).mockResolvedValue(mockData);
    const result = await purReturnOverview();
    expect(result).toEqual(mockData);
  });

  it("purReturnList returns paginated list", async () => {
    const mockList = [{ id: "1", amount: 500 }];
    (api.get as any).mockResolvedValue({ items: mockList });
    const result = await purReturnList();
    expect(result.items).toEqual(mockList);
  });

  it("purReturnDetail returns details", async () => {
    const mockData = { id: "1", amount: 500 };
    (api.get as any).mockResolvedValue(mockData);
    const result = await purReturnDetail("1");
    expect(result).toEqual(mockData);
  });

  it("purReturnCreate creates purchase return", async () => {
    const mockData = { id: "1", amount: 500 };
    (api.post as any).mockResolvedValue(mockData);
    const result = await purReturnCreate({ amount: 500 });
    expect(result).toEqual(mockData);
  });

  it("purReturnUpdate updates purchase return", async () => {
    const mockData = { id: "1", amount: 600 };
    (api.patch as any).mockResolvedValue(mockData);
    const result = await purReturnUpdate("1", { amount: 600 });
    expect(result).toEqual(mockData);
  });

  it("purReturnDelete deletes purchase return", async () => {
    (api.delete as any).mockResolvedValue(undefined);
    await purReturnDelete("1");
    expect(api.delete).toHaveBeenCalled();
  });
});
