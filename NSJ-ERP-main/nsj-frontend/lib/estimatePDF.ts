import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Line Item interface for PDF generation
 */
export interface LineItem {
  id?: string;
  particulars: string;
  shape?: string;
  colour?: string;
  clarity?: string;
  pc?: number | null;
  weight?: number | null;
  unit?: "CT" | "GM" | "";
  rate?: number | null;
  amount: number;
}

/**
 * Generate Estimate Voucher PDF
 *
 * Creates a professional PDF document matching Nitishah Jewels branding
 * with company logo, detailed line items table, totals, and terms & conditions.
 * Design matches the official Nitishah Jewels estimate template.
 *
 * @param data - Estimate voucher data including line items and totals
 *
 * Requirements: 4.1, 4.2
 */
export async function generateEstimatePDF(data: {
  itemName: string;
  accountName: string;
  date: string;
  lineItems: LineItem[];
  totalTaxableValue: number;
  gstAmount: number;
  grandTotal: number;
  imageUrl?: string;
  nsjRepresentative?: string;
  expiryDate?: string;
}): Promise<void> {
  // Helper function to format currency with rupee symbol
  const formatCurrency = (value: number): string => {
    return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Sanitize item name for filename
  const sanitizedItemName = data.itemName
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
  const filename = `nitishah_estimate_${sanitizedItemName}_${new Date().toISOString().split("T")[0]}.pdf`;

  // Calculate row height based on number of line items
  const lineItemCount = data.lineItems.length;
  const rowHeight = 55; // Height per row in pixels
  const imageHeight = Math.max(lineItemCount * rowHeight, 120);

  // Build HTML template matching exact Nitishah Jewels format from template PDF
  const htmlTemplate = `
    <div style="width: 1191px; background: white; padding: 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #000;">
      <!-- Header Section with Logo and Company Info -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 30px 40px 25px 40px; border-bottom: 3px solid #C4A35A;">
        <!-- Logo Section (Left) -->
        <div style="flex: 0 0 45%;">
          <div style="font-family: Arial, Helvetica, sans-serif; font-size: 72px; color: #5D4E37; font-style: italic; line-height: 1;">
            Nitishah
          </div>
          <div style="display: flex; align-items: center; margin-top: 8px;">
            <span style="font-size: 14px; letter-spacing: 4px; color: #5D4E37; font-weight: 500;">CRAFTING LEGACIES</span>
            <span style="color: #C4A35A; margin: 0 15px; font-size: 14px;">——————————</span>
          </div>
          <div style="font-size: 16px; color: #5D4E37; font-weight: 500; margin-top: 5px; letter-spacing: 2px;">2044</div>
        </div>

        <!-- Company Details (Right) -->
        <div style="flex: 0 0 50%; text-align: right; font-size: 13px; line-height: 1.8; color: #333;">
          <div><span style="font-weight: bold;">ADDRESS:</span> 2/63 JVPD, N.S. ROAD NO. 1,</div>
          <div style="padding-left: 0;">JUHU SCHEME, VILE PARLE (W),</div>
          <div style="padding-left: 0;">MUMBAI - 400056</div>
          <div><span style="font-weight: bold;">GSTIN:</span> 27FSFPS4058J1Z5</div>
          <div><span style="font-weight: bold;">EMAIL:</span> HELLO@NITISHAHJEWELS.COM</div>
          <div><span style="font-weight: bold;">PHONE:</span> +91 9987620906</div>
        </div>
      </div>
      
      <!-- Item Name Header Bar -->
      <div style="background: #F5E6D3; padding: 15px 40px; text-align: center; font-weight: bold; font-size: 18px; letter-spacing: 2px; border-bottom: 1px solid #D4C4A8;">
        ${data.itemName.toUpperCase()}
      </div>

      <!-- Estimate Details Bar -->
      <div style="background: #fff; padding: 12px 40px; display: flex; justify-content: space-between; border-bottom: 1px solid #D4C4A8; font-size: 13px;">
        <div><span style="font-weight: bold;">Date:</span> ${data.date}</div>
        ${data.expiryDate ? `<div><span style="font-weight: bold;">Expiry Date:</span> ${data.expiryDate}</div>` : ""}
        ${data.nsjRepresentative ? `<div><span style="font-weight: bold;">NSJ Representative:</span> ${data.nsjRepresentative}</div>` : ""}
      </div>

      <!-- Main Content Table -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #D4C4A8;">
        <!-- Column Headers -->
        <thead>
          <tr style="background: #F5E6D3;">
            <th style="border: 1px solid #D4C4A8; padding: 12px 8px; font-weight: bold; font-size: 12px; text-align: center; width: 15%;">IMAGE</th>
            <th style="border: 1px solid #D4C4A8; padding: 12px 8px; font-weight: bold; font-size: 12px; text-align: center; width: 14%;">PARTICULARS</th>
            <th style="border: 1px solid #D4C4A8; padding: 12px 8px; font-weight: bold; font-size: 12px; text-align: center; width: 9%;">SHAPE</th>
            <th style="border: 1px solid #D4C4A8; padding: 12px 8px; font-weight: bold; font-size: 12px; text-align: center; width: 9%;">COLOUR</th>
            <th style="border: 1px solid #D4C4A8; padding: 12px 8px; font-weight: bold; font-size: 12px; text-align: center; width: 9%;">CLARITY</th>
            <th style="border: 1px solid #D4C4A8; padding: 12px 8px; font-weight: bold; font-size: 12px; text-align: center; width: 6%;">PC</th>
            <th style="border: 1px solid #D4C4A8; padding: 12px 8px; font-weight: bold; font-size: 12px; text-align: center; width: 10%;">WEIGHT</th>
            <th style="border: 1px solid #D4C4A8; padding: 12px 8px; font-weight: bold; font-size: 12px; text-align: center; width: 7%;">UNIT</th>
            <th style="border: 1px solid #D4C4A8; padding: 12px 8px; font-weight: bold; font-size: 12px; text-align: center; width: 10%;">RATE</th>
            <th style="border: 1px solid #D4C4A8; padding: 12px 8px; font-weight: bold; font-size: 12px; text-align: center; width: 11%;">AMOUNT<br/>(RS.)</th>
          </tr>
        </thead>
        
        <!-- Line Items -->
        <tbody>
          ${data.lineItems
            .map(
              (item, index) => `
            <tr style="background: #fff;">
              ${index === 0 ? `<td rowspan="${lineItemCount}" style="border: 1px solid #D4C4A8; padding: 10px; text-align: center; vertical-align: middle; background: #fff;">${data.imageUrl ? `<img src="${data.imageUrl}" style="max-width: 150px; max-height: ${imageHeight}px; object-fit: contain; border: 1px solid #eee;" />` : '<div style="color: #999; font-size: 11px; padding: 20px;">No Image</div>'}</td>` : ""}
              <td style="border: 1px solid #D4C4A8; padding: 10px 8px; text-align: center; font-size: 12px; vertical-align: middle; word-wrap: break-word; overflow-wrap: break-word;">${item.particulars || ""}</td>
              <td style="border: 1px solid #D4C4A8; padding: 10px 8px; text-align: center; font-size: 12px; vertical-align: middle;">${item.shape || ""}</td>
              <td style="border: 1px solid #D4C4A8; padding: 10px 8px; text-align: center; font-size: 12px; vertical-align: middle;">${item.colour || ""}</td>
              <td style="border: 1px solid #D4C4A8; padding: 10px 8px; text-align: center; font-size: 12px; vertical-align: middle;">${item.clarity || ""}</td>
              <td style="border: 1px solid #D4C4A8; padding: 10px 8px; text-align: center; font-size: 12px; vertical-align: middle;">${item.pc != null ? item.pc : ""}</td>
              <td style="border: 1px solid #D4C4A8; padding: 10px 8px; text-align: center; font-size: 12px; vertical-align: middle;">${item.weight != null ? item.weight.toFixed(2) : ""}</td>
              <td style="border: 1px solid #D4C4A8; padding: 10px 8px; text-align: center; font-size: 12px; vertical-align: middle;">${item.unit || ""}</td>
              <td style="border: 1px solid #D4C4A8; padding: 10px 8px; text-align: center; font-size: 12px; vertical-align: middle;">${item.rate != null ? formatCurrency(item.rate) : ""}</td>
              <td style="border: 1px solid #D4C4A8; padding: 10px 8px; text-align: center; font-size: 12px; font-weight: bold; vertical-align: middle;">${formatCurrency(item.amount)}</td>
            </tr>
          `
            )
            .join("")}
          
          <!-- Total Taxable Value Row -->
          <tr style="background: #F5E6D3;">
            <td colspan="9" style="border: 1px solid #D4C4A8; padding: 12px 15px; text-align: right; font-weight: bold; font-size: 13px;">TOTAL TAXABLE VALUE</td>
            <td style="border: 1px solid #D4C4A8; padding: 12px 8px; text-align: right; font-weight: bold; font-size: 13px;">${formatCurrency(data.totalTaxableValue)}</td>
          </tr>
          
          <!-- GST Row -->
          <tr style="background: #fff;">
            <td colspan="9" style="border: 1px solid #D4C4A8; padding: 12px 15px; text-align: right; font-weight: bold; font-size: 13px;">GST @ 3%</td>
            <td style="border: 1px solid #D4C4A8; padding: 12px 8px; text-align: right; font-weight: bold; font-size: 13px;">${formatCurrency(data.gstAmount)}</td>
          </tr>
          
          <!-- Grand Total Row -->
          <tr style="background: #F5E6D3;">
            <td colspan="9" style="border: 1px solid #D4C4A8; padding: 14px 15px; text-align: right; font-weight: bold; font-size: 14px;">GRAND TOTAL</td>
            <td style="border: 1px solid #D4C4A8; padding: 14px 8px; text-align: right; font-weight: bold; font-size: 14px;">${formatCurrency(data.grandTotal)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Terms & Conditions Section -->
      <div style="padding: 25px 40px 30px 40px; font-size: 12px; line-height: 2; border-top: 2px solid #D4C4A8; margin-top: 0;">
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 15px; text-decoration: underline;">TERMS & CONDITIONS:</div>
        <div style="margin-bottom: 8px;">
          <span style="font-weight: bold;">1.</span> The Estimate is Valid for <span style="font-weight: bold;">7 days</span> from the date of issue. You may request a fresh estimate thereafter.
        </div>
        <div style="margin-bottom: 8px; color: #CC0000; font-weight: bold;">
          <span>2.</span> We only process an order after a 50% Deposit on total Estimate or 100% Gold Value Advance - whichever is higher.
        </div>
        <div style="margin-bottom: 8px;">
          <span style="font-weight: bold;">4.</span> Payment Terms are COD. We offer no CREDIT TERMS whatsoever.
        </div>
        <div style="margin-bottom: 8px;">
          <span style="font-weight: bold;">5.</span> All payments to be made in Mumbai.
        </div>
        <div style="margin-bottom: 8px;">
          <span style="font-weight: bold;">6.</span> Production timelines for all items are 45 days, however we shall attempt to deliver the orders to the best of our abilities.
        </div>
      </div>
    </div>
  `;

  // Create temporary DOM container
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.width = "1191px"; // Match template width (landscape A4 at 96dpi)
  container.style.background = "white";

  // Render HTML template with data
  container.innerHTML = htmlTemplate;

  document.body.appendChild(container);

  try {
    // Convert to canvas with html2canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      allowTaint: true,
    });

    // Generate PDF with jsPDF - landscape orientation to match template
    const pdf = new jsPDF("l", "mm", "a4"); // 'l' for landscape
    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = pdf.internal.pageSize.getWidth(); // 297mm for landscape A4
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm for landscape A4

    // Calculate image dimensions to fit the page
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    // If content is taller than page, scale to fit
    if (imgHeight > pdfHeight) {
      const scaledWidth = (canvas.width * pdfHeight) / canvas.height;
      pdf.addImage(
        imgData,
        "PNG",
        (pdfWidth - scaledWidth) / 2,
        0,
        scaledWidth,
        pdfHeight
      );
    } else {
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    }

    // Trigger download
    pdf.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
    throw error;
  } finally {
    // Clean up temporary elements
    document.body.removeChild(container);
  }
}
