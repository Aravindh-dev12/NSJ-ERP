import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Helper function to generate Order Tracking Sheet PDF
export async function generateOrderTrackingPDF(data: {
  orderId: string;
  queryInDate: string;
  accountName: string;
  subaccount?: string;
  itemName: string;
  goldCarat: string;
  size: string;
  location?: string;
  deliveryType?: string;
  phoneNumber?: string;
  referenceImage?: string;
  referenceImageType?: string;
}) {
  // Sanitize order ID for filename
  const sanitizedOrderId = data.orderId
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
  const filename = `${sanitizedOrderId}_tracking.pdf`;

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
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
      <div>
        <h1 style="font-size: 24px; color: #8B4513; margin-bottom: 5px;">ORDER TRACKING SHEET</h1>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 32px; font-style: italic; color: #8B4513; font-weight: bold;">NitiSHAH</div>
        <div style="font-size: 10px; color: #666; margin-top: 5px;">CRAFTING LEGACIES — 2844</div>
        <div style="border: 2px solid #D2B48C; background: #FFF8DC; padding: 15px; text-align: center; margin-top: 10px;">
          <h2 style="font-size: 14px; color: #8B4513; margin-bottom: 5px;">ORDER ID</h2>
          <div style="font-size: 18px; font-weight: bold; color: #333;">${data.orderId}</div>
        </div>
      </div>
    </div>

    <div style="border: 2px solid #D2B48C; margin-bottom: 15px;">
      <div style="background: #D2B48C; padding: 8px 15px; font-weight: bold; font-size: 13px; color: #333; text-align: center;">IMPORTANT DATES</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr;">
        <div style="display: flex; border-bottom: 1px solid #D2B48C; border-right: 1px solid #D2B48C; min-height: 40px;">
          <div style="width: 50%; padding: 10px 15px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #D2B48C; color: #555;">SHIPMENT DATE</div>
          <div style="width: 50%; padding: 10px 15px; color: #333;"></div>
        </div>
        <div style="display: flex; border-bottom: 1px solid #D2B48C; min-height: 40px;">
          <div style="width: 50%; padding: 10px 15px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #D2B48C; color: #555;">QUERY IN</div>
          <div style="width: 50%; padding: 10px 15px; color: #333;">${new Date(data.queryInDate).toLocaleDateString("en-IN")}</div>
        </div>
        <div style="display: flex; border-bottom: 1px solid #D2B48C; border-right: 1px solid #D2B48C; min-height: 40px;">
          <div style="width: 50%; padding: 10px 15px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #D2B48C; color: #555;">FINAL DELIVERY DATE</div>
          <div style="width: 50%; padding: 10px 15px; color: #333;"></div>
        </div>
        <div style="display: flex; border-bottom: 1px solid #D2B48C; min-height: 40px;">
          <div style="width: 50%; padding: 10px 15px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #D2B48C; color: #555;">CONFIRMATION + ADVANCE</div>
          <div style="width: 50%; padding: 10px 15px; color: #333;">✓</div>
        </div>
        <div style="display: flex; grid-column: span 2; min-height: 40px;">
          <div style="width: 25%; padding: 10px 15px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #D2B48C; color: #555;">STOCK IN DEADLINE</div>
          <div style="width: 75%; padding: 10px 15px; color: #333;"></div>
        </div>
      </div>
    </div>

    <div style="border: 2px solid #D2B48C; margin-bottom: 15px;">
      <div style="background: #D2B48C; padding: 8px 15px; font-weight: bold; font-size: 13px; color: #333; text-align: center;">ORDER DETAILS & REFERENCE IMAGE</div>
      <div style="display: flex; min-height: 200px;">
        <div style="flex: 1; border-right: 2px solid #D2B48C; display: flex; flex-direction: column;">
          <div style="display: flex; border-bottom: 1px solid #D2B48C; min-height: 35px; align-items: center;">
            <div style="width: 180px; padding: 10px 15px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #D2B48C; color: #555;">ITEM NAME</div>
            <div style="flex: 1; padding: 10px 15px; color: #333;">${data.itemName}</div>
          </div>
          <div style="display: flex; border-bottom: 1px solid #D2B48C; min-height: 35px; align-items: center;">
            <div style="width: 180px; padding: 10px 15px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #D2B48C; color: #555;">GOLD KT</div>
            <div style="flex: 1; padding: 10px 15px; color: #333;">${data.goldCarat}</div>
          </div>
          <div style="display: flex; border-bottom: 1px solid #D2B48C; min-height: 35px; align-items: center;">
            <div style="width: 180px; padding: 10px 15px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #D2B48C; color: #555;">SIZE</div>
            <div style="flex: 1; padding: 10px 15px; color: #333;">${data.size}</div>
          </div>
          <div style="display: flex; border-bottom: 1px solid #D2B48C; min-height: 35px; align-items: center;">
            <div style="width: 180px; padding: 10px 15px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #D2B48C; color: #555;">PACKAGING</div>
            <div style="flex: 1; padding: 10px 15px; color: #333;"></div>
          </div>
          <div style="display: flex; border-bottom: 1px solid #D2B48C; min-height: 35px; align-items: center;">
            <div style="width: 180px; padding: 10px 15px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #D2B48C; color: #555;">TAG ID</div>
            <div style="flex: 1; padding: 10px 15px; color: #333;"></div>
          </div>
          <div style="display: flex; border-bottom: 1px solid #D2B48C; min-height: 35px; align-items: center;">
            <div style="width: 180px; padding: 10px 15px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #D2B48C; color: #555;">NSJ DESIGN ID</div>
            <div style="flex: 1; padding: 10px 15px; color: #333;"></div>
          </div>
          <div style="display: flex; flex: 1; align-items: center;">
            <div style="width: 180px; padding: 10px 15px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #D2B48C; color: #555;"></div>
            <div style="flex: 1; padding: 10px 15px; color: #333;"></div>
          </div>
        </div>
        <div style="width: 350px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; background: #FFFAF0;">
          <div style="font-size: 12px; color: #8B4513; font-weight: bold; margin-bottom: 10px;">REFERENCE IMAGE</div>
          ${
            data.referenceImage && data.referenceImageType !== "application/pdf"
              ? `
            <img src="${data.referenceImage}" alt="Reference Design" style="max-width: 100%; max-height: 300px; border: 2px solid #D2B48C; border-radius: 4px;" />
          `
              : `
            <div style="width: 300px; height: 300px; border: 2px dashed #D2B48C; display: flex; align-items: center; justify-content: center; color: #999; font-style: italic;">
              ${data.referenceImageType === "application/pdf" ? "PDF Reference Attached" : "No Image"}
            </div>
          `
          }
        </div>
      </div>
    </div>

    <div style="border: 2px solid #D2B48C; margin-bottom: 15px;">
      <div style="background: #D2B48C; padding: 8px 15px; font-weight: bold; font-size: 13px; color: #333; text-align: center;">CLIENT INFORMATION</div>
      <div style="display: flex; min-height: 200px;">
        <div style="flex: 1;">
          <div style="display: flex; border-bottom: 1px solid #D2B48C; min-height: 35px; align-items: center;">
            <div style="width: 180px; padding: 10px 15px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #D2B48C; color: #555;">MAIN A/C NAME</div>
            <div style="flex: 1; padding: 10px 15px; color: #333;">${data.accountName}</div>
          </div>
          <div style="display: flex; border-bottom: 1px solid #D2B48C; min-height: 35px; align-items: center;">
            <div style="width: 180px; padding: 10px 15px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #D2B48C; color: #555;">SUB A/C</div>
            <div style="flex: 1; padding: 10px 15px; color: #333;">${data.subaccount || ""}</div>
          </div>
          <div style="display: flex; min-height: 35px; align-items: center;">
            <div style="width: 180px; padding: 10px 15px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #D2B48C; color: #555;">PHONE NUMBER</div>
            <div style="flex: 1; padding: 10px 15px; color: #333;">${data.phoneNumber || ""}</div>
          </div>
        </div>
        <div style="flex: 1;">
          <div style="display: flex; border-bottom: 1px solid #D2B48C; min-height: 35px; align-items: center;">
            <div style="width: 180px; padding: 10px 15px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #D2B48C; color: #555;">LOCATION</div>
            <div style="flex: 1; padding: 10px 15px; color: #333;">${data.location || ""}</div>
          </div>
          <div style="display: flex; border-bottom: 1px solid #D2B48C; min-height: 35px; align-items: center;">
            <div style="width: 180px; padding: 10px 15px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #D2B48C; color: #555;">DELIVERY TYPE</div>
            <div style="flex: 1; padding: 10px 15px; color: #333;">${data.deliveryType || ""}</div>
          </div>
          <div style="display: flex; min-height: 35px; align-items: center;">
            <div style="width: 180px; padding: 10px 15px; font-weight: 600; background: #FFF8DC; border-right: 1px solid #D2B48C; color: #555;"></div>
            <div style="flex: 1; padding: 10px 15px; color: #333;"></div>
          </div>
        </div>
      </div>
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
