import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Helper function to generate Customer Query Form PDF with proper tabular structure
export async function generateQueryPDF(data: {
  accountName: string;
  subaccount?: string;
  location?: string;
  itemName: string;
  goldCarat: string;
  size: string;
  gender?: string;
  deliveryType?: string;
  queryInDate: string;
  expiryDate?: string;
  referenceImage?: string;
  referenceImageType?: string;
}) {
  // Sanitize account name for filename
  const sanitizedAccountName = data.accountName
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
  const filename = `${sanitizedAccountName}_query.pdf`;

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
    <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px;">
      <h1 style="font-size: 22px; color: #333; margin-bottom: 8px;">CUSTOMER QUERY FORM</h1>
      <div style="font-size: 10px; color: #666;">
        <strong>Query Date:</strong> ${new Date(data.queryInDate).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
        ${data.expiryDate ? ` | <strong>Valid Until:</strong> ${new Date(data.expiryDate).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}` : ""}
      </div>
    </div>

    <div style="display: flex; gap: 15px;">
      <div style="flex: 1;">
        <div style="border: 2px solid #333; margin-bottom: 15px;">
          <div style="background: #D2B48C; color: #333; padding: 8px 12px; font-weight: bold; font-size: 12px; text-align: center;">ACCOUNT INFORMATION</div>
          <div style="display: flex; border-bottom: 1px solid #333; min-height: 32px; align-items: center;">
            <div style="width: 140px; padding: 8px 12px; font-weight: 600; background: #f5f5f5; border-right: 1px solid #333; color: #333;">Customer Account:</div>
            <div style="flex: 1; padding: 8px 12px; color: #333;">${data.accountName}</div>
          </div>
          ${
            data.subaccount
              ? `
          <div style="display: flex; border-bottom: 1px solid #333; min-height: 32px; align-items: center;">
            <div style="width: 140px; padding: 8px 12px; font-weight: 600; background: #f5f5f5; border-right: 1px solid #333; color: #333;">Subaccount:</div>
            <div style="flex: 1; padding: 8px 12px; color: #333;">${data.subaccount}</div>
          </div>
          `
              : ""
          }
          ${
            data.location
              ? `
          <div style="display: flex; min-height: 32px; align-items: center;">
            <div style="width: 140px; padding: 8px 12px; font-weight: 600; background: #f5f5f5; border-right: 1px solid #333; color: #333;">Delivery Location:</div>
            <div style="flex: 1; padding: 8px 12px; color: #333;">${data.location}</div>
          </div>
          `
              : ""
          }
        </div>

        <div style="border: 2px solid #333; margin-bottom: 15px;">
          <div style="background: #D2B48C; color: #333; padding: 8px 12px; font-weight: bold; font-size: 12px; text-align: center;">ITEM SPECIFICATIONS</div>
          <div style="display: flex; border-bottom: 1px solid #333; min-height: 32px; align-items: center;">
            <div style="width: 140px; padding: 8px 12px; font-weight: 600; background: #f5f5f5; border-right: 1px solid #333; color: #333;">Item Name:</div>
            <div style="flex: 1; padding: 8px 12px; color: #333;">${data.itemName}</div>
          </div>
          <div style="display: flex; border-bottom: 1px solid #333; min-height: 32px; align-items: center;">
            <div style="width: 140px; padding: 8px 12px; font-weight: 600; background: #f5f5f5; border-right: 1px solid #333; color: #333;">Gold Carat:</div>
            <div style="flex: 1; padding: 8px 12px; color: #333;">${data.goldCarat}</div>
          </div>
          <div style="display: flex; border-bottom: 1px solid #333; min-height: 32px; align-items: center;">
            <div style="width: 140px; padding: 8px 12px; font-weight: 600; background: #f5f5f5; border-right: 1px solid #333; color: #333;">Size:</div>
            <div style="flex: 1; padding: 8px 12px; color: #333;">${data.size}</div>
          </div>
          ${
            data.gender
              ? `
          <div style="display: flex; min-height: 32px; align-items: center;">
            <div style="width: 140px; padding: 8px 12px; font-weight: 600; background: #f5f5f5; border-right: 1px solid #333; color: #333;">Gender:</div>
            <div style="flex: 1; padding: 8px 12px; color: #333;">${data.gender}</div>
          </div>
          `
              : ""
          }
        </div>

        ${
          data.deliveryType
            ? `
        <div style="border: 2px solid #333; margin-bottom: 15px;">
          <div style="background: #D2B48C; color: #333; padding: 8px 12px; font-weight: bold; font-size: 12px; text-align: center;">DELIVERY INFORMATION</div>
          <div style="display: flex; min-height: 32px; align-items: center;">
            <div style="width: 140px; padding: 8px 12px; font-weight: 600; background: #f5f5f5; border-right: 1px solid #333; color: #333;">Delivery Type:</div>
            <div style="flex: 1; padding: 8px 12px; color: #333;">${data.deliveryType}</div>
          </div>
        </div>
        `
            : ""
        }

        <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #333; text-align: center; font-size: 9px; color: #666;">
          <p><strong>Generated:</strong> ${new Date().toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</p>
          <p style="margin-top: 5px; font-style: italic;">This is a customer query. Order will be created after advance payment.</p>
        </div>
      </div>

      <div style="width: 280px;">
        <div style="border: 2px solid #333; padding: 15px; text-align: center; background: #f9f9f9; min-height: 350px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="font-size: 12px; font-weight: bold; color: #333; margin-bottom: 10px;">Reference Design</div>
          ${
            data.referenceImage && data.referenceImageType !== "application/pdf"
              ? `
            <img src="${data.referenceImage}" alt="Reference Design" style="max-width: 100%; max-height: 300px; border: 1px solid #333;" />
          `
              : `
            <div style="width: 250px; height: 300px; border: 2px dashed #999; display: flex; align-items: center; justify-content: center; color: #999; font-style: italic;">
              ${data.referenceImageType === "application/pdf" ? "PDF Reference Attached" : "No Image"}
            </div>
          `
          }
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
