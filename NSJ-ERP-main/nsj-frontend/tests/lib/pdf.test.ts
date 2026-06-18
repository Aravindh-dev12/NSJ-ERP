import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock jsPDF and html2canvas
vi.mock("jspdf", () => {
  const mockPDF = {
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    },
    addImage: vi.fn(),
    save: vi.fn(),
  };

  return {
    default: vi.fn(() => mockPDF),
  };
});

vi.mock("html2canvas", () => ({
  default: vi.fn(() => {
    return Promise.resolve({
      toDataURL: vi.fn(() => "data:image/png;base64,mock"),
      width: 800,
      height: 1000,
    });
  }),
}));

import { generateEstimatePDF } from "@/lib/estimatePDF";
import { generateOrderIssuePDF } from "@/lib/orderIssuePDF";
import { generateQueryPDF } from "@/lib/queryPDF";
import { generateOrderTrackingPDF } from "@/lib/orderTrackingPDF";

describe("PDF Generation - estimatePDF", () => {
  let mockBody: HTMLElement;

  beforeEach(() => {
    mockBody = document.body;
    vi.spyOn(document.body, "appendChild");
    vi.spyOn(document.body, "removeChild");
    vi.spyOn(document, "createElement");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates estimate PDF with basic data", async () => {
    const data = {
      itemName: "Gold Ring",
      accountName: "Test Customer",
      date: "2024-01-15",
      lineItems: [
        {
          particulars: "Main Stone",
          shape: "Round",
          colour: "D",
          clarity: "VS1",
          pc: 1,
          weight: 1.5,
          unit: "CT" as const,
          rate: 50000,
          amount: 75000,
        },
      ],
      totalTaxableValue: 75000,
      gstAmount: 2250,
      grandTotal: 77250,
    };

    await generateEstimatePDF(data);

    expect(document.createElement).toHaveBeenCalledWith("div");
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
  });

  it("handles estimate PDF with image URL", async () => {
    const data = {
      itemName: "Diamond Necklace",
      accountName: "VIP Customer",
      date: "2024-01-20",
      lineItems: [
        {
          particulars: "Diamond",
          amount: 100000,
        },
      ],
      totalTaxableValue: 100000,
      gstAmount: 3000,
      grandTotal: 103000,
      imageUrl: "https://example.com/image.jpg",
    };

    await generateEstimatePDF(data);

    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
  });

  it("handles multiple line items", async () => {
    const data = {
      itemName: "Custom Jewelry",
      accountName: "Test Account",
      date: "2024-01-15",
      lineItems: [
        { particulars: "Item 1", amount: 10000 },
        { particulars: "Item 2", amount: 20000 },
        { particulars: "Item 3", amount: 30000 },
      ],
      totalTaxableValue: 60000,
      gstAmount: 1800,
      grandTotal: 61800,
    };

    await generateEstimatePDF(data);

    expect(document.body.appendChild).toHaveBeenCalled();
  });

  it("handles empty line items", async () => {
    const data = {
      itemName: "Test Item",
      accountName: "Test Account",
      date: "2024-01-15",
      lineItems: [],
      totalTaxableValue: 0,
      gstAmount: 0,
      grandTotal: 0,
    };

    await generateEstimatePDF(data);

    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
  });
});

describe("PDF Generation - orderIssuePDF", () => {
  let mockBody: HTMLElement;

  beforeEach(() => {
    mockBody = document.body;
    vi.spyOn(document.body, "appendChild");
    vi.spyOn(document.body, "removeChild");
    vi.spyOn(document, "createElement");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates order issue PDF with basic data", async () => {
    const data = {
      orderId: "ORD-001",
      accountName: "Test Customer",
      itemName: "Gold Ring",
      goldKarat: "18K",
      size: "7",
      baseMetalColor: "Yellow Gold",
      finalFinish: "High Polish",
    };

    await generateOrderIssuePDF(data);

    expect(document.createElement).toHaveBeenCalledWith("div");
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
  });

  it("handles order issue PDF with all optional fields", async () => {
    const data = {
      orderId: "ORD-002",
      accountName: "VIP Customer",
      itemName: "Diamond Necklace",
      goldKarat: "22K",
      size: "16",
      baseMetalColor: "Rose Gold",
      rhodiumInstructions: "Full rhodium plating",
      prongStyle: "4-prong",
      lockingSystem: "Box clasp",
      finalFinish: "Matte",
      additionalNotes: "Handle with care",
      referenceImage: "https://example.com/image.jpg",
      referenceImageType: "image/jpeg",
    };

    await generateOrderIssuePDF(data);

    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
  });

  it("handles PDF reference image type", async () => {
    const data = {
      orderId: "ORD-003",
      accountName: "Test Account",
      itemName: "Custom Ring",
      goldKarat: "14K",
      size: "8",
      baseMetalColor: "White Gold",
      finalFinish: "Brushed",
      referenceImageType: "application/pdf",
    };

    await generateOrderIssuePDF(data);

    expect(document.body.appendChild).toHaveBeenCalled();
  });

  it("sanitizes order ID for filename", async () => {
    const data = {
      orderId: "ORD/001-TEST",
      accountName: "Test",
      itemName: "Ring",
      goldKarat: "18K",
      size: "7",
      baseMetalColor: "Yellow",
      finalFinish: "Polish",
    };

    await generateOrderIssuePDF(data);

    expect(document.body.appendChild).toHaveBeenCalled();
  });
});

describe("PDF Generation - queryPDF", () => {
  let mockBody: HTMLElement;

  beforeEach(() => {
    mockBody = document.body;
    vi.spyOn(document.body, "appendChild");
    vi.spyOn(document.body, "removeChild");
    vi.spyOn(document, "createElement");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates query PDF with basic data", async () => {
    const data = {
      accountName: "Test Customer",
      itemName: "Gold Ring",
      goldCarat: "18K",
      size: "7",
      queryInDate: "2024-01-15",
    };

    await generateQueryPDF(data);

    expect(document.createElement).toHaveBeenCalledWith("div");
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
  });

  it("handles query PDF with all optional fields", async () => {
    const data = {
      accountName: "VIP Customer",
      subaccount: "Sub Account 1",
      location: "Mumbai",
      itemName: "Diamond Necklace",
      goldCarat: "22K",
      size: "16",
      gender: "Female",
      deliveryType: "Express",
      queryInDate: "2024-01-15",
      expiryDate: "2024-02-15",
      referenceImage: "https://example.com/image.jpg",
      referenceImageType: "image/jpeg",
    };

    await generateQueryPDF(data);

    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
  });

  it("handles PDF reference image", async () => {
    const data = {
      accountName: "Test Account",
      itemName: "Custom Ring",
      goldCarat: "14K",
      size: "8",
      queryInDate: "2024-01-15",
      referenceImageType: "application/pdf",
    };

    await generateQueryPDF(data);

    expect(document.body.appendChild).toHaveBeenCalled();
  });

  it("formats dates correctly", async () => {
    const data = {
      accountName: "Test Customer",
      itemName: "Ring",
      goldCarat: "18K",
      size: "7",
      queryInDate: "2024-01-15",
      expiryDate: "2024-03-15",
    };

    await generateQueryPDF(data);

    expect(document.body.appendChild).toHaveBeenCalled();
  });
});

describe("PDF Generation - orderTrackingPDF", () => {
  let mockBody: HTMLElement;

  beforeEach(() => {
    mockBody = document.body;
    vi.spyOn(document.body, "appendChild");
    vi.spyOn(document.body, "removeChild");
    vi.spyOn(document, "createElement");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates order tracking PDF with basic data", async () => {
    const data = {
      orderId: "ORD-001",
      queryInDate: "2024-01-15",
      accountName: "Test Customer",
      itemName: "Gold Ring",
      goldCarat: "18K",
      size: "7",
    };

    await generateOrderTrackingPDF(data);

    expect(document.createElement).toHaveBeenCalledWith("div");
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
  });

  it("handles order tracking PDF with all optional fields", async () => {
    const data = {
      orderId: "ORD-002",
      queryInDate: "2024-01-15",
      accountName: "VIP Customer",
      subaccount: "Sub Account 1",
      itemName: "Diamond Necklace",
      goldCarat: "22K",
      size: "16",
      location: "Mumbai",
      deliveryType: "Express",
      phoneNumber: "+91 9876543210",
      referenceImage: "https://example.com/image.jpg",
      referenceImageType: "image/jpeg",
    };

    await generateOrderTrackingPDF(data);

    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
  });

  it("handles PDF reference image type", async () => {
    const data = {
      orderId: "ORD-003",
      queryInDate: "2024-01-15",
      accountName: "Test Account",
      itemName: "Custom Ring",
      goldCarat: "14K",
      size: "8",
      referenceImageType: "application/pdf",
    };

    await generateOrderTrackingPDF(data);

    expect(document.body.appendChild).toHaveBeenCalled();
  });

  it("sanitizes order ID for filename", async () => {
    const data = {
      orderId: "ORD/001-TEST",
      queryInDate: "2024-01-15",
      accountName: "Test",
      itemName: "Ring",
      goldCarat: "18K",
      size: "7",
    };

    await generateOrderTrackingPDF(data);

    expect(document.body.appendChild).toHaveBeenCalled();
  });

  it("formats query in date correctly", async () => {
    const data = {
      orderId: "ORD-004",
      queryInDate: "2024-01-15T10:30:00Z",
      accountName: "Test Customer",
      itemName: "Ring",
      goldCarat: "18K",
      size: "7",
    };

    await generateOrderTrackingPDF(data);

    expect(document.body.appendChild).toHaveBeenCalled();
  });
});
