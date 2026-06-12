import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { OrderProcessStep } from "@/lib/backend";

/**
 * Premium Designer PDF Generator for Niti Shah Jewelers
 * Balanced luxury aesthetics with high-legibility technical tracking.
 */
export async function generateProcessPDF(data: {
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
  steps: OrderProcessStep[];
  progressPercentage: number;
}) {
  const sanitizedOrderId = data.orderId
    .toUpperCase()
    .replace(/[^A-Z0-9]/gi, "_");
  const filename = `${sanitizedOrderId}_Production_Process.pdf`;

  const root = document.createElement("div");
  root.style.position = "absolute";
  root.style.left = "-9999px";
  root.style.top = "0";
  root.style.width = "210mm";
  root.style.background = "#fff";
  document.body.appendChild(root);

  const pages: HTMLElement[] = [];

  const createPage = () => {
    const page = document.createElement("div");
    page.style.width = "210mm";
    page.style.height = "297mm";
    page.style.padding = "10mm";
    page.style.boxSizing = "border-box";
    page.style.background = "white";
    page.style.position = "relative";
    page.style.display = "flex";
    page.style.flexDirection = "column";
    page.style.fontFamily = "'Inter', 'Arial', sans-serif";

    const inner = document.createElement("div");
    inner.className = "page-inner";
    inner.style.border = "1.5px solid #111"; // Sharp professional border
    inner.style.padding = "25px";
    inner.style.height = "100%";
    inner.style.display = "flex";
    inner.style.flexDirection = "column";
    inner.style.position = "relative";
    page.appendChild(inner);

    root.appendChild(page);
    pages.push(page);
    return inner;
  };

  const headerHtml = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 35px; border-bottom: 2px solid #111; padding-bottom: 12px;">
      <div>
        <img src="/images/nitishah-script.png" style="height: 80px; width: auto;" />
      </div>
      <div style="text-align: right;">
        <div style="font-size: 18px; font-weight: 500; color: #111; margin: 0; letter-spacing: 3px; text-transform: uppercase;">Process Sheet</div>
        <div style="margin-top: 4px; font-size: 12px; font-weight: 500; color: #111; letter-spacing: 1.5px; text-transform: uppercase;">
          Order Ref: <span style="letter-spacing: 0.5px; font-weight: 700;">#${data.orderId.toUpperCase()}</span>
        </div>
      </div>
    </div>

    <!-- Information Section -->
    <div style="background: #fbfbfb; border: 1px solid #777; border-radius: 4px; padding: 20px; margin-bottom: 35px; display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 25px; align-items: stretch;">
      <div>
        <div style="font-size: 9px; font-weight: 800; color: #8B7355; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;">Client Information</div>
        <div style="font-size: 14px; font-weight: 700; color: #111; margin-bottom: 4px; letter-spacing: 0.3px; line-height: 1.3;">${data.accountName}</div>
        <div style="font-size: 11px; color: #666; font-weight: 500;">TEL: ${data.phoneNumber || "N/A"}</div>
      </div>
      
      <div>
        <div style="font-size: 9px; font-weight: 800; color: #8B7355; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;">Item Information</div>
        <div style="font-size: 14px; font-weight: 700; color: #111; margin-bottom: 4px; letter-spacing: 0.3px; line-height: 1.3;">${data.itemName}</div>
      </div>

      <div style="display: flex; flex-direction: column; justify-content: flex-start;">
        <div style="font-size: 9px; font-weight: 800; color: #8B7355; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Order Process Status</div>
        <div style="display: flex; flex-direction: column; gap: 3px;">
          <div style="font-size: 11px; font-weight: 700; color: #111; text-transform: uppercase; letter-spacing: 0.2px;">
            ${data.progressPercentage}% COMPLETED
          </div>
          <div style="font-size: 8px; font-weight: 700; color: #8B7355; text-transform: uppercase; letter-spacing: 0.5px;">
            REF DATE: ${new Date(data.queryInDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
          <div style="height: 5px; background: #e5e7eb; border-radius: 2px; overflow: hidden; width: 100%; margin-top: 8px;">
            <div style="height: 100%; width: ${data.progressPercentage}%; background: #111;"></div>
          </div>
        </div>
      </div>
    </div>

    <div style="font-size: 11px; font-weight: 800; color: #111; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 15px; border-bottom: 2px solid #111; padding-bottom: 6px;">Production Workflow</div>
  `;

  let currentInner = createPage();
  const headerDiv = document.createElement("div");
  headerDiv.innerHTML = headerHtml;
  currentInner.appendChild(headerDiv);

  let activeStepsContainer = document.createElement("div");
  activeStepsContainer.style.display = "grid";
  activeStepsContainer.style.gridTemplateColumns = "1fr 1fr";
  activeStepsContainer.style.width = "100%";
  activeStepsContainer.style.alignItems = "stretch"; // Ensure rows stretch to match height
  currentInner.appendChild(activeStepsContainer);

  data.steps.forEach((step, index) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.borderBottom = "1px solid #e0e0e0";
    row.style.height = "100%"; // Fill the stretched grid cell
    row.style.boxSizing = "border-box"; // Fix for right side overflow
    row.style.alignItems = "flex-start";

    // Add vertical divider on the left column
    if (index % 2 === 0) {
      row.style.borderRight = "1px solid #e0e0e0";
      row.style.padding = "10px 12px 10px 0";
    } else {
      row.style.padding = "10px 0 10px 12px";
    }

    // Position
    const posCol = document.createElement("div");
    posCol.style.width = "30px";
    posCol.style.fontWeight = "700";
    posCol.style.color = "#ccc";
    posCol.style.fontSize = "14px";
    posCol.style.fontFamily = "serif";
    posCol.innerText = String(step.position).padStart(2, "0");
    row.appendChild(posCol);

    // Info
    const infoCol = document.createElement("div");
    infoCol.style.flex = "1";
    infoCol.style.padding = "0 6px 0 0";

    const title = document.createElement("div");
    title.style.fontWeight = "700";
    title.style.fontSize = "11px";
    title.style.textTransform = "uppercase";
    title.style.letterSpacing = "0px"; // Normal spacing
    title.style.color = "#000";
    title.style.marginBottom = "3px";
    title.style.lineHeight = "1.3";
    title.style.wordBreak = "break-word";
    title.innerText = step.step_name || step.task_name;
    infoCol.appendChild(title);

    if (step.description) {
      const desc = document.createElement("div");
      desc.style.fontSize = "9px";
      desc.style.color = "#555";
      desc.style.lineHeight = "1.4";
      desc.style.marginBottom = "5px";
      desc.innerText = step.description;
      infoCol.appendChild(desc);
    }

    const dept = document.createElement("div");
    dept.style.fontSize = "8px";
    dept.style.color = "#8B7355";
    dept.style.fontWeight = "700";
    dept.style.textTransform = "uppercase";
    dept.style.letterSpacing = "0.5px";
    dept.innerText = `Dept: ${step.department || "Workshop"}`;
    infoCol.appendChild(dept);

    row.appendChild(infoCol);

    // Status
    const statusCol = document.createElement("div");
    statusCol.style.width = "95px"; // Increased width
    statusCol.style.display = "flex";
    statusCol.style.justifyContent = "flex-end";

    const badge = document.createElement("div");
    badge.style.display = "block"; // More reliable for PDF centering
    badge.style.marginTop = "5px";
    badge.style.textAlign = "center";
    badge.style.width = "90px";
    badge.style.height = "20px";
    badge.style.lineHeight = "20px"; // Match height for perfect vertical center
    badge.style.boxSizing = "border-box";
    badge.style.padding = "0";
    badge.style.borderRadius = "2px";
    badge.style.fontSize = "8px";
    badge.style.fontWeight = "800";
    badge.style.textTransform = "uppercase";
    badge.style.letterSpacing = "0.8px";
    badge.style.border = "1.5px solid";

    if (step.status === "COMPLETED") {
      badge.style.background = "#fff";
      badge.style.color = "#047857";
      badge.style.borderColor = "#10b981";
    } else if (step.status === "IN_PROGRESS") {
      badge.style.background = "#eff6ff";
      badge.style.color = "#1e40af";
      badge.style.borderColor = "#3b82f6";
    } else {
      badge.style.background = "#fff";
      badge.style.color = "#888";
      badge.style.borderColor = "#ddd";
      badge.style.borderWidth = "1px";
    }
    badge.innerText = step.status.replace("_", " ");
    statusCol.appendChild(badge);
    row.appendChild(statusCol);

    activeStepsContainer.appendChild(row);

    // Break logic using bounding rect for pixel-perfect page fill
    const currentInnerRect = currentInner.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const relativeBottom = rowRect.bottom - currentInnerRect.top;

    if (relativeBottom > 1055) {
      activeStepsContainer.removeChild(row);
      currentInner = createPage();

      const contHeader = document.createElement("div");
      contHeader.style.fontSize = "11px";
      contHeader.style.fontWeight = "800";
      contHeader.style.paddingBottom = "8px";
      contHeader.style.borderBottom = "2.5px solid #000";
      contHeader.style.marginBottom = "20px";
      contHeader.style.textTransform = "uppercase";
      contHeader.style.letterSpacing = "2px";
      contHeader.innerText = `ORDER #${data.orderId.toUpperCase()} - WORKFLOW (CONT)`;
      currentInner.appendChild(contHeader);

      activeStepsContainer = document.createElement("div");
      activeStepsContainer.style.display = "grid";
      activeStepsContainer.style.gridTemplateColumns = "1fr 1fr";
      activeStepsContainer.style.columnGap = "0px";
      activeStepsContainer.style.width = "100%";
      activeStepsContainer.style.alignItems = "stretch"; // Ensure rows stretch to match height
      currentInner.appendChild(activeStepsContainer);
      activeStepsContainer.appendChild(row);
    }
  });

  // --- REFERENCE ---
  if (data.referenceImage && data.referenceImageType !== "application/pdf") {
    const imgBox = document.createElement("div");
    imgBox.style.marginTop = "30px";
    imgBox.style.gridColumn = "1 / -1"; // Ensure it spans full width if ever placed in grid
    imgBox.style.textAlign = "center";
    imgBox.style.padding = "25px";
    imgBox.style.background = "#fcfcfc";
    imgBox.style.border = "1px solid #eee";
    imgBox.innerHTML = `
      <div style="font-size:10px; font-weight:800; color:#8B7355; margin-bottom:20px; text-transform:uppercase; letter-spacing:2px;">Production Reference Image</div>
      <img src="${data.referenceImage}" style="max-width: 90%; max-height: 380px; object-fit: contain; border: 4px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.05);" />
    `;

    currentInner.appendChild(imgBox);

    // Use consistent bounding math avoiding grid constraints
    const imgBottom = imgBox.offsetTop + imgBox.offsetHeight;
    if (imgBottom > 1010) {
      currentInner.removeChild(imgBox);
      currentInner = createPage();
      currentInner.appendChild(imgBox);
    }
  }

  // --- RENDERING ---
  try {
    const pdf = new jsPDF("p", "mm", "a4");
    for (let i = 0; i < pages.length; i++) {
      if (i > 0) pdf.addPage();
      const canvas = await html2canvas(pages[i], {
        scale: 2.2,
        useCORS: true,
        backgroundColor: "#fff",
        logging: false,
      });
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
      pdf.setFontSize(8);
      pdf.setTextColor(180, 180, 180);
      pdf.text(`Page ${i + 1} of ${pages.length}`, 105, 292, {
        align: "center",
      });
    }
    pdf.save(filename);
  } catch (err) {
    console.error("PDF Export failed:", err);
  } finally {
    if (document.body.contains(root)) document.body.removeChild(root);
  }
}
