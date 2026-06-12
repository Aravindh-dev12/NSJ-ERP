import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface VoucherEntry {
  type: string;
  partyName: string;
  subAc?: string;
  balance?: string;
  drAmount: number;
  crAmount: number;
  narration: string;
}

interface VoucherData {
  voucherType: "Receipt" | "Payment" | "Journal" | "Contra";
  date: string;
  voucherNo: string;
  series: string;
  entries: VoucherEntry[];
  generalRemarks?: string;
  totalDebit: number;
  totalCredit: number;
  amountInWords?: string;
}

export async function generateVoucherPDF(
  voucherType: VoucherData["voucherType"],
  data: VoucherData
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Modern color palette
  const colors = {
    primary: [25, 103, 210] as [number, number, number],
    primaryLight: [227, 242, 253] as [number, number, number],
    secondary: [244, 63, 94] as [number, number, number],
    darkText: [33, 43, 53] as [number, number, number],
    lightText: [107, 114, 128] as [number, number, number],
    tableHeaderBg: [25, 103, 210] as [number, number, number],
    successGreen: [22, 163, 74] as [number, number, number],
    dangerRed: [220, 38, 38] as [number, number, number],
    neutral: [248, 250, 252] as [number, number, number],
  };

  // Load logo from public/images
  const logoUrl = "/images/nitishah-script.png";
  let logoImg: HTMLImageElement | null = null;

  try {
    logoImg = await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = logoUrl;
    });
  } catch (e) {
    console.warn("Could not load logo:", e);
  }

  let yOffset = 12;

  // Header - Logo with enhanced styling
  if (logoImg) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = logoImg.width;
      canvas.height = logoImg.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(logoImg, 0, 0);
        const imgData = canvas.toDataURL("image/png");
        // Center the logo
        const logoWidth = 45;
        const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
        const logoX = (pageWidth - logoWidth) / 2;
        doc.addImage(imgData, "PNG", logoX, yOffset, logoWidth, logoHeight);
        yOffset += logoHeight + 6;
      }
    } catch (e) {
      console.warn("Could not add logo to PDF:", e);
    }
  }

  // Voucher type title - centered and prominent with modern styling
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  const voucherTitle = `${voucherType.toUpperCase()} VOUCHER`;
  const titleWidth = doc.getTextWidth(voucherTitle);
  doc.text(voucherTitle, (pageWidth - titleWidth) / 2, yOffset);
  yOffset += 6;

  // Elegant divider line
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(1.5);
  doc.line(20, yOffset, pageWidth - 20, yOffset);
  yOffset += 10;

  // Voucher info row with enhanced boxes
  const infoBoxWidth = 56;
  const infoBoxHeight = 16;
  const infoBoxY = yOffset;
  const boxSpacing = 7;
  const totalWidth = infoBoxWidth * 3 + boxSpacing * 2;
  const startX = (pageWidth - totalWidth) / 2;

  // Helper function to create info box with modern design
  const createInfoBox = (label: string, value: string, xPos: number) => {
    // Modern gradient-like effect with subtle shadow
    doc.setFillColor(...colors.primaryLight);
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.8);
    doc.roundedRect(xPos, infoBoxY, infoBoxWidth, infoBoxHeight, 2, 2, "FD");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.primary);
    doc.text(label, xPos + 4, infoBoxY + 5.5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.darkText);
    doc.setFontSize(10);
    doc.text(value, xPos + 4, infoBoxY + 12);
  };

  createInfoBox("Date:", data.date, startX);
  createInfoBox(
    "Voucher No:",
    data.voucherNo,
    startX + infoBoxWidth + boxSpacing
  );
  createInfoBox(
    "Series:",
    data.series,
    startX + (infoBoxWidth + boxSpacing) * 2
  );

  yOffset += infoBoxHeight + 13;

  // Table headers based on voucher type
  const isContra = voucherType === "Contra";
  const tableHeaders = isContra
    ? [["Type", "Party Name", "Balance", "DR Amount", "CR Amount", "Narration"]]
    : [
        [
          "Type",
          "Party Name",
          "Sub AC",
          "Balance",
          "DR Amount",
          "CR Amount",
          "Narration",
        ],
      ];

  // Table body - ensure all values are strings without extra spaces
  const tableBody = data.entries.map((entry) => {
    const drDisplay =
      entry.drAmount > 0 ? `Rs. ${entry.drAmount.toFixed(2)}` : "-";
    const crDisplay =
      entry.crAmount > 0 ? `Rs. ${entry.crAmount.toFixed(2)}` : "-";
    const balanceDisplay = entry.balance || "-";

    const row = [
      entry.type,
      entry.partyName,
      isContra ? "" : entry.subAc || "-",
      balanceDisplay,
      drDisplay,
      crDisplay,
      entry.narration || "-",
    ];
    return isContra ? [row[0], row[1], row[3], row[4], row[5], row[6]] : row;
  });

  // Generate table with modern styling
  autoTable(doc, {
    head: tableHeaders,
    body: tableBody,
    startY: yOffset,
    theme: "grid",
    margin: { left: 12, right: 12, top: 20, bottom: 50 },
    tableWidth: "wrap",
    pageBreak: "auto",
    didDrawPage: (hookData) => {
      // Footer on each page with improved styling
      const pageCount = doc.getNumberOfPages();
      const currentPage = hookData.pageNumber;

      // Generated date/time bottom left
      doc.setFontSize(7);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Generated: ${new Date().toLocaleString()}`,
        15,
        pageHeight - 10
      );

      // Page number bottom right
      doc.text(
        `Page ${currentPage} of ${pageCount}`,
        pageWidth - 35,
        pageHeight - 10
      );

      // General Remarks and Totals on last page only
      if (currentPage === pageCount) {
        let footerY = hookData.cursor.y + 15;

        // Check if we need a new page for footer
        if (footerY > pageHeight - 60) {
          doc.addPage();
          footerY = 20;

          // Add footer to new page too
          doc.setFontSize(7);
          doc.setTextColor(128, 128, 128);
          doc.text(
            `Generated: ${new Date().toLocaleString()}`,
            15,
            pageHeight - 10
          );
          doc.text(
            `Page ${doc.getNumberOfPages()} of ${doc.getNumberOfPages()}`,
            pageWidth - 35,
            pageHeight - 10
          );
        }

        // Divider before footer
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(0.8);
        doc.line(15, footerY, pageWidth - 15, footerY);
        footerY += 10;

        if (data.generalRemarks && data.generalRemarks.trim()) {
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...colors.primary);
          doc.text("General Remarks:", 15, footerY);
          footerY += 6;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...colors.darkText);
          const splitText = doc.splitTextToSize(
            data.generalRemarks,
            pageWidth - 30
          );
          doc.text(splitText, 15, footerY);
          footerY += splitText.length * 5 + 12;
        } else {
          footerY += 10;
        }

        // Total Amount in Words - on the right side
        if (data.amountInWords) {
          const remarksY = footerY - 23;
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...colors.primary);
          doc.text("Total Amount:", pageWidth - 80, remarksY);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...colors.darkText);
          doc.text(data.amountInWords, pageWidth - 80, remarksY + 6);
        }

        // Total Debit and Credit with premium box design
        const boxY = footerY;
        const totalBoxHeight = 24;
        const boxWidth = (pageWidth - 50) / 2;

        // Total Debit Box
        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(...colors.successGreen);
        doc.setLineWidth(1.4);
        doc.roundedRect(
          20,
          boxY,
          boxWidth - 10,
          totalBoxHeight,
          2.5,
          2.5,
          "FD"
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...colors.successGreen);
        doc.text("TOTAL DEBIT", 27, boxY + 9);

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 120, 64);
        doc.text(`Rs. ${data.totalDebit.toFixed(2)}`, 27, boxY + 18);

        // Total Credit Box
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(...colors.dangerRed);
        doc.setLineWidth(1.4);
        doc.roundedRect(
          boxWidth + 30,
          boxY,
          boxWidth - 10,
          totalBoxHeight,
          2.5,
          2.5,
          "FD"
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...colors.dangerRed);
        doc.text("TOTAL CREDIT", boxWidth + 37, boxY + 9);

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(153, 27, 27);
        doc.text(
          `Rs. ${data.totalCredit.toFixed(2)}`,
          boxWidth + 37,
          boxY + 18
        );
      }
    },
    headStyles: {
      fillColor: colors.tableHeaderBg,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
      valign: "middle",
      cellPadding: { top: 6, bottom: 6, left: 4, right: 4 },
      lineWidth: 0.8,
      lineColor: colors.tableHeaderBg,
    },
    bodyStyles: {
      fontSize: 8.5,
      cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
    },
    alternateRowStyles: {
      fillColor: colors.neutral,
    },
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
      lineColor: [219, 234, 254],
      lineWidth: 0.4,
      valign: "middle",
      overflow: "linebreak",
      halign: "left",
      textColor: colors.darkText,
      fontStyle: "normal",
      minCellHeight: 10,
    },
    columnStyles: {
      0: {
        cellWidth: 14,
        halign: "center",
        fontStyle: "bold",
        fillColor: [219, 234, 254],
        textColor: colors.primary,
        overflow: "linebreak",
      },
      1: {
        cellWidth: isContra ? 38 : 32,
        halign: "left",
        fontStyle: "bold",
        overflow: "linebreak",
      },
      2: {
        cellWidth: isContra ? 0 : 22,
        halign: "left",
        overflow: "linebreak",
      },
      3: {
        cellWidth: isContra ? 28 : 26,
        halign: "right",
        overflow: "linebreak",
      },
      4: {
        cellWidth: 27,
        halign: "right",
        fontStyle: "bold",
        textColor: colors.successGreen,
        overflow: "linebreak",
      },
      5: {
        cellWidth: 27,
        halign: "right",
        fontStyle: "bold",
        textColor: colors.dangerRed,
        overflow: "linebreak",
      },
      6: {
        cellWidth: isContra ? 32 : 30,
        halign: "left",
        overflow: "linebreak",
      },
    },
    didDrawCell: (data) => {
      // Hide Sub AC column for Contra by making it transparent
      if (isContra && data.column.index === 2) {
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fillColor = [255, 255, 255];
        data.cell.styles.lineWidth = 0;
      }
    },
  });

  // File naming
  const dateStr = data.date.replace(/-/g, "");
  const fileName = `${voucherType}_${data.voucherNo}_${dateStr}.pdf`;

  // Download
  doc.save(fileName);
}
