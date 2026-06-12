import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Helper function to generate Order Issue PDF
export async function generateOrderIssuePDF(data: {
  orderId: string;
  accountName: string;
  itemName: string;
  goldKarat: string;
  size: string;
  baseMetalColor: string;
  rhodiumInstructions?: string;
  prongStyle?: string;
  lockingSystem?: string;
  finalFinish: string;
  additionalNotes?: string;
  referenceImage?: string;
  referenceImageType?: string;
}) {
  // Sanitize order ID for filename
  const sanitizedOrderId = data.orderId
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
  const filename = `${sanitizedOrderId}_order_issue.pdf`;

  // Create a temporary container for the PDF content
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.width = "210mm"; // A4 width
  container.style.background = "white";
  container.style.padding = "20px";
  container.style.fontFamily = "Arial, sans-serif";
  container.style.fontSize = "11px";

  container.innerHTML = `
    <div style="display: flex; gap: 0; height: 100%; min-height: 800px;">
      <!-- Left Column: 2D Design -->
      <div style="flex: 1; border: 2px solid #8B4513; display: flex; flex-direction: column;">
        <div style="background: #D2B48C; color: #333; padding: 12px; font-weight: bold; font-size: 16px; text-align: center; border-bottom: 2px solid #8B4513;">
          2D DESIGN
        </div>
        <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; background: #FFF8DC;">
          ${
            data.referenceImage && data.referenceImageType !== "application/pdf"
              ? `
            <img src="${data.referenceImage}" alt="2D Design" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          `
              : `
            <div style="width: 100%; height: 400px; border: 2px dashed #D2B48C; display: flex; align-items: center; justify-content: center; color: #999; font-style: italic; font-size: 14px;">
              ${data.referenceImageType === "application/pdf" ? "PDF Design Attached" : "Design Image Area"}
            </div>
          `
          }
        </div>
      </div>

      <!-- Right Column: Order Details -->
      <div style="flex: 1; border: 2px solid #8B4513; border-left: none; display: flex; flex-direction: column;">
        <div style="background: #D2B48C; color: #333; padding: 12px; font-weight: bold; font-size: 16px; text-align: center; border-bottom: 2px solid #8B4513;">
          ORDER DETAILS
        </div>
        
        <!-- Header Row -->
        <div style="display: flex; border-bottom: 2px solid #8B4513;">
          <div style="flex: 1; background: #E8D5C4; padding: 8px 12px; font-weight: bold; font-size: 12px; text-align: center; border-right: 2px solid #8B4513; color: #333;">
            DESCRIPTION
          </div>
          <div style="flex: 1; background: #E8D5C4; padding: 8px 12px; font-weight: bold; font-size: 12px; text-align: center; color: #333;">
            DETAILS
          </div>
        </div>

        <!-- Order ID -->
        <div style="display: flex; border-bottom: 1px solid #8B4513; min-height: 40px;">
          <div style="flex: 1; padding: 10px 12px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #8B4513; color: #333; display: flex; align-items: center;">
            ORDER ID
          </div>
          <div style="flex: 1; padding: 10px 12px; color: #333; display: flex; align-items: center;">
            ${data.orderId}
          </div>
        </div>

        <!-- Item Name -->
        <div style="display: flex; border-bottom: 1px solid #8B4513; min-height: 40px;">
          <div style="flex: 1; padding: 10px 12px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #8B4513; color: #333; display: flex; align-items: center;">
            ITEM NAME
          </div>
          <div style="flex: 1; padding: 10px 12px; color: #333; display: flex; align-items: center;">
            ${data.itemName}
          </div>
        </div>

        <!-- Size -->
        <div style="display: flex; border-bottom: 1px solid #8B4513; min-height: 40px;">
          <div style="flex: 1; padding: 10px 12px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #8B4513; color: #333; display: flex; align-items: center;">
            SIZE
          </div>
          <div style="flex: 1; padding: 10px 12px; color: #333; display: flex; align-items: center;">
            ${data.size}
          </div>
        </div>

        <!-- Gold KT -->
        <div style="display: flex; border-bottom: 1px solid #8B4513; min-height: 40px;">
          <div style="flex: 1; padding: 10px 12px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #8B4513; color: #333; display: flex; align-items: center;">
            GOLD KT
          </div>
          <div style="flex: 1; padding: 10px 12px; color: #333; display: flex; align-items: center;">
            ${data.goldKarat}
          </div>
        </div>

        <!-- Base Gold Colour -->
        <div style="display: flex; border-bottom: 2px solid #8B4513; min-height: 40px;">
          <div style="flex: 1; padding: 10px 12px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #8B4513; color: #333; display: flex; align-items: center;">
            BASE GOLD COLOUR
          </div>
          <div style="flex: 1; padding: 10px 12px; color: #333; display: flex; align-items: center;">
            ${data.baseMetalColor}
          </div>
        </div>

        <!-- Rhodium Instructions Header -->
        <div style="background: #E8D5C4; padding: 8px 12px; font-weight: bold; font-size: 12px; text-align: center; border-bottom: 1px solid #8B4513; color: #333;">
          RHODIUM INSTRUCTIONS
        </div>

        <!-- Rhodium Instructions Content -->
        <div style="padding: 12px; min-height: 80px; border-bottom: 2px solid #8B4513; color: #333; font-size: 11px; line-height: 1.5;">
          ${data.rhodiumInstructions || "—"}
        </div>

        <!-- Prong Style -->
        <div style="display: flex; border-bottom: 1px solid #8B4513; min-height: 40px;">
          <div style="flex: 1; padding: 10px 12px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #8B4513; color: #333; display: flex; align-items: center;">
            PRONG STYLE
          </div>
          <div style="flex: 1; padding: 10px 12px; color: #333; display: flex; align-items: center;">
            ${data.prongStyle || "—"}
          </div>
        </div>

        <!-- Locking System -->
        <div style="display: flex; border-bottom: 2px solid #8B4513; min-height: 40px;">
          <div style="flex: 1; padding: 10px 12px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #8B4513; color: #333; display: flex; align-items: center;">
            LOCKING SYSTEM
          </div>
          <div style="flex: 1; padding: 10px 12px; color: #333; display: flex; align-items: center;">
            ${data.lockingSystem || "—"}
          </div>
        </div>

        <!-- Final Finish Instructions Header -->
        <div style="background: #E8D5C4; padding: 8px 12px; font-weight: bold; font-size: 12px; text-align: center; border-bottom: 1px solid #8B4513; color: #333;">
          FINAL FINISH INSTRUCTIONS
        </div>

        <!-- Final Finish Instructions Content -->
        <div style="flex: 1; padding: 12px; color: #333; font-size: 11px; line-height: 1.5;">
          <div style="margin-bottom: 8px;"><strong>Finish Type:</strong> ${data.finalFinish}</div>
          ${
            data.additionalNotes
              ? `
          <div><strong>Additional Notes:</strong></div>
          <div style="margin-top: 4px;">${data.additionalNotes}</div>
          `
              : ""
          }
        </div>
      </div>
    </div>

    <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #8B4513; text-align: center; font-size: 9px; color: #666;">
      <p><strong>Generated:</strong> ${new Date().toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</p>
      <p style="margin-top: 5px; font-style: italic;">Order Issue Form - Manufacturing Instructions</p>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    // Create PDF
    const pdf = new jsPDF("p", "mm", "a4");
    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    // Download the PDF
    pdf.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
}
