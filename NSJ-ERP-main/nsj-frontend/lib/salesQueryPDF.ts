import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function generateSalesQueryPDF(data: any) {
  const filename = `SalesQuery_${data.accountName || "Unknown"}_${new Date().toISOString().split("T")[0]}.pdf`;
  const maroon = "#4a0e0e";

  // A4 Dimensions in Pixels (approx 96 DPI)
  // 794px x 1123px is standard for screen->pdf mapping
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;

  // Common styles
  const commonStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;0,800;0,900;1,400;1,700;1,800;1,900&display=swap');
    
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: 'Figtree', sans-serif; -webkit-font-smoothing: antialiased; }
    
    .page-container {
        width: ${A4_WIDTH}px;
        height: ${A4_HEIGHT}px;
        background: white;
        color: black;
        font-size: 11.5px;
        line-height: 1.3;
        padding: 5px 20px 40px 20px; 
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }
    .maroon-text { color: ${maroon}; }
    .maroon-bg { background-color: ${maroon}; color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    
    /* Layout Primitives */
    .flex { display: flex; }
    .flex-col { display: flex; flex-direction: column; }
    .flex-1 { flex: 1; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .justify-between { justify-content: space-between; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    .uppercase { text-transform: uppercase; }
    
    /* Border System */
    .border-box { border: 1px solid ${maroon}; display: flex; flex-direction: column; }
    .border-b { border-bottom: 1px solid ${maroon}; }
    .border-r { border-right: 1px solid ${maroon}; }
    .border-l { border-left: 1px solid ${maroon}; }
    .no-border-b { border-bottom: none !important; }
    .no-border-r { border-right: none !important; }
    
    /* Component Styles */
    .section-header {
        background-color: ${maroon};
        color: white;
        text-align: center;
        padding: 4px 8px;
        font-weight: 700;
        text-transform: uppercase;
        font-size: 11.5px;
        display: flex;
        align-items: center;
        border-bottom: 1px solid ${maroon};
        min-height: 22px;
        flex-shrink: 0;
    }
    
    .row {
        display: flex;
        border-bottom: 1px solid ${maroon};
        flex-shrink: 0;
        min-height: 24px;
    }
    .row:last-child { border-bottom: none; }

    .label {
        border-right: 1px solid ${maroon};
        padding: 4px;
        font-weight: 700;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        text-align: right;
        background: #fff;
        font-size: 9px;
        color: #000;
        flex-shrink: 0;
        white-space: nowrap;
        line-height: normal;
    }
    .value {
        flex: 1;
        padding: 4px 6px;
        display: flex;
        align-items: center;
        font-size: 10px;
        overflow: visible;
        word-break: break-word;
        line-height: normal;
    }
    
    /* Checkbox Styles */
    .checkbox-group { display: flex; gap: 8px; flex-wrap: wrap; }
    .checkbox-item { display: flex; align-items: center; gap: 4px; font-size: 9px; font-weight: 600; text-transform: uppercase; }
    .checkbox-box { width: 10px; height: 10px; border: 1.5px solid ${maroon}; display: flex; align-items: center; justify-content: center; background: white; flex-shrink: 0; }
    .checkbox-mark { width: 100%; height: 100%; background-color: ${maroon}; }
    
    /* Tables */
    table { width: 100%; border-collapse: collapse; font-size: 8.5px; table-layout: fixed; }
    th { border-right: 1px solid ${maroon}; border-bottom: 1px solid ${maroon}; text-align: left; padding: 4px 6px; font-weight: 700; background: white; white-space: nowrap; overflow: hidden; height: 16px; }
    td { border-right: 1px solid ${maroon}; border-bottom: 1px solid ${maroon}; padding: 4px 6px; overflow: visible; word-break: break-word; min-height: 16px; }
    td:last-child, th:last-child { border-right: none; }
    tr:last-child td { border-bottom: none; }

    .ruled-lines {
        background: white !important;
        background-image: linear-gradient(${maroon}44 1px, transparent 1px) !important;
        background-size: 100% 24px !important;
        line-height: 24px !important;
        background-attachment: local !important;
    }
  `;

  // --- HELPERS ---

  const sectionHeaderHTML = (
    text: string,
    rightText: string = "",
    noBorderBottom: boolean = false,
    rightWidth: string = "35%"
  ) => `
    <div class="section-header ${noBorderBottom ? "no-border-b" : ""}">
        <span style="flex: 1; text-align: center;">${text}</span>
        ${rightText ? `<span style="width: ${rightWidth}; text-align: center; border-left: 1px solid rgba(255,255,255,0.3); padding-left: 4px;">${rightText}</span>` : ""}
    </div>
  `;

  const rowHTML = (
    label: string,
    value: string | undefined,
    labelWidth: string = "17.5%",
    noBorderBottom: boolean = false
  ) => `
    <div class="row ${noBorderBottom ? "no-border-b" : ""}">
        <div class="label" style="width: ${labelWidth};">
            ${label}
        </div>
        <div class="value">
            ${value || ""}
        </div>
    </div>
  `;

  const checkboxGroupHTML = (
    options: string[],
    selected: string[] | string | undefined,
    isTable: boolean = false
  ) => {
    const isSelected = (opt: string) => {
      if (!selected) return false;
      const normalizedOpt = opt.trim().toLowerCase();
      if (Array.isArray(selected)) {
        return selected.some(
          (s) =>
            typeof s === "string" && s.trim().toLowerCase() === normalizedOpt
        );
      }
      return (
        typeof selected === "string" &&
        selected.trim().toLowerCase() === normalizedOpt
      );
    };
    return `
      <div class="checkbox-group" style="${isTable ? "gap: 4px; flex-wrap: nowrap;" : "gap: 8px; flex-wrap: wrap;"}">
          ${options
            .map(
              (opt) => `
              <div class="checkbox-item" style="${isTable ? "font-size: 7.5px; gap: 2px;" : ""}">
                  <div class="checkbox-box" style="${isTable ? "width: 9px; height: 9px; border-width: 1px;" : ""}">
                    ${isSelected(opt) ? `<div class="checkbox-mark"></div>` : ""}
                  </div>
                  ${opt}
              </div>
          `
            )
            .join("")}
      </div>
    `;
  };

  const logoHTML = `
    <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; margin-right: -10px; margin-top: 10px;">
        <img src="/images/nitishah-script.png" style="width: 300px; height: auto; display: block;" />
    </div>
    `;

  const generatePage1 = () => {
    return `
      <div class="page-container">
         <style>${commonStyles}</style>
         
<!-- Top Bar -->
        <div class="flex justify-between items-start" style="margin-bottom: 2px; flex-shrink: 0; padding-top: 0px; margin-top: 0px;">
            <div style="background: linear-gradient(to right, #f5e6dc, #fef9f5); padding: 15px 25px; margin-left: -25px; margin-top: -5px;">
                <h1 style="color: ${maroon}; font-size: 22px; font-weight: 545; margin: 0; text-transform: uppercase; word-spacing: 8px; font-family: Georgia, 'Times New Roman', serif; line-height: 1;">SALES QUERIES WIP</h1>
            </div>
            ${logoHTML}
        </div>      

        <div class="flex-1" style="margin-top: -10px;"> 
            <!-- Primary Content Container (Outer Left and Bottom Borders) -->
            <div style="border-left: 1px solid ${maroon}; border-bottom: 1px solid ${maroon}; margin-top: 0;">
                <!-- Section 1: Dates & Grid -->
                <div class="flex" style="border-bottom: 1px solid ${maroon}; margin-bottom: 0;">
                    <!-- Left: Important Dates -->
                    <div class="flex-col" style="width: 50.05%; border-right: 1px solid ${maroon}; border-top: 1px solid ${maroon};">
                        <div class="maroon-bg text-center font-bold" style="padding: 3px; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.2);">IMPORTANT DATES</div>
                        <div class="flex-col flex-1">
                             ${rowHTML("SALES PERSON", data.salesPerson, "35%")}
                             ${rowHTML("VENDOR", data.vendor, "35%")}
                             ${rowHTML("DELIVERY TYPE", data.deliveryType, "35%")}
                             ${rowHTML(`<span style="font-size: 8px;">TRANSFER DEPARTMENT</span>`, data.transferDepartment, "35%", true)}
                        </div>
                    </div>
                    <!-- Right: Date/Order Grid (Borders only on data rows) -->
                    <div class="flex-col" style="width: 50%; display: flex; justify-content: flex-end; background: transparent;">
                        <!-- Aligned with DELIVERY TYPE -->
                        <div class="flex maroon-bg" style="height: 24px; border-top: 1px solid ${maroon}; border-right: 1px solid ${maroon}; border-bottom: 1px solid ${maroon};">
                            <div class="flex-1 flex items-center justify-center font-bold border-r" style="font-size: 8px; color: white; border-color: rgba(255,255,255,0.3);">DATE</div>
                            <div class="flex-1 flex items-center justify-center font-bold" style="font-size: 8px; color: white;">ORDER ID</div>
                        </div>
                        <!-- Aligned with TRANSFER DEPARTMENT -->
                        <div class="flex" style="height: 24px; border-right: 1px solid ${maroon};">
                            <div class="flex-1 flex items-center justify-center border-r text-center" style="font-size: 9px; padding: 4px;">${data.orderDate || ""}</div>
                            <div class="flex-1 flex items-center justify-center text-center" style="font-size: 8px; padding: 4px; word-break: break-all;">${data.queryId || ""}</div>
                        </div>
                    </div>
                </div>

                <!-- Global Right Border Wrapper for Sections 2 - 8 -->
                <div style="border-right: 1px solid ${maroon};">

                <!-- Section 2: Client Details -->
                ${sectionHeaderHTML("CLIENT DETAILS", "RETAIL", false, "50%")}
                <div class="row">
                    <div style="width: 50%;" class="border-r">
                        ${rowHTML("MAIN ACCOUNT", data.accountName, "35%")}
                        ${rowHTML("PHONE NUMBER", data.phoneNumber, "35%")}
                        ${rowHTML("EMAIL", data.email, "35%")}
                        ${rowHTML("CITY", data.city, "35%", true)}
                    </div>
                    <div style="width: 50%;">
                        ${rowHTML("SUB AC", data.subAccount, "35%")}
                        ${rowHTML("PAN/GSTIN/AADHAR", data.panGstin, "35%")}
                        ${rowHTML("EMAIL ID", data.email, "35%")}
                        ${rowHTML("DELIVERY TYPE", data.deliveryType, "35%", true)}
                    </div>
                </div>
                <div class="border-b">
                    ${rowHTML("REFERENCE SOURCE", checkboxGroupHTML(["INSTAGRAM", "REFERRAL", "WALK-IN", "OTHER"], data.referenceSource), "17.5%", true)}
                </div>

                <!-- Section 3: Occasion -->
                ${sectionHeaderHTML("OCCASION & INTENT")}
                ${rowHTML("OCCASION", checkboxGroupHTML(["WEDDING", "ENGAGEMENT", "BIRTHDAY", "ANNIVERSARY", "OTHER"], data.occasion), "17.5%")}
                
                <div class="row">
                    <div class="flex border-r" style="width: 50%;">
                        <div class="label" style="width: 35%; font-size: 9px;">REQUIRED DELIVERY DATE</div>
                        <div class="value">${data.requiredDeliveryDate || ""}</div>
                    </div>
                    <div class="flex" style="width: 50%;">
                         <div class="label" style="width: 35%; font-size: 8px;">STOCK IN DEADLINE</div>
                         <div class="value">${data.stockInDeadline || ""}</div>
                    </div>
                </div>
                ${rowHTML(`<span style="font-size: 8px;">PURPOSE OF PURCHASE</span>`, checkboxGroupHTML(["SELF", "GIFT", "BRIDAL", "OTHER"], data.purpose), "17.5%")}

                <!-- Section 4: Jewellery Details -->
                ${sectionHeaderHTML("JEWELLERY DETAILS (DESIGN INPUT)")}
                ${rowHTML("JEWELLERY TYPE", data.jewelleryType, "17.5%")}
                ${rowHTML("GOLD QUALITY (KT)", data.goldQuality || "Not specified", "17.5%")}
                <div class="row">
                     <div class="flex border-r" style="width: 50%;">
                        <div class="label" style="width: 35%;">SIZE DETAILS</div>
                        <div class="value">${data.sizeDetails || ""}</div>
                    </div>
                    <div class="flex" style="width: 50%;">
                        <div class="label" style="width: 35%;">FIT DETAILS</div>
                        <div class="value">${data.fitDetails || ""}</div>
                    </div>
                </div>
                ${rowHTML("FOLLOW-UP LOG", data.followUpNotes, "17.5%")}
                ${rowHTML("STYLE PREFERENCE", checkboxGroupHTML(["MINIMAL", "STATEMENT", "TRADITIONAL", "MODERN", "UNSURE"], data.stylePref), "17.5%")}
                ${rowHTML("METAL PREFERENCE", checkboxGroupHTML(["YELLOW", "WHITE", "ROSE", "TWO-TONE"], data.metalPref), "17.5%")}

                <!-- Section 5: Diamond/Gemstone -->
                ${sectionHeaderHTML("DIAMOND / GEMSTONE REQUIREMENTS")}
                <div class="row">
                     <div class="flex border-r" style="width: 50%;">
                        <div class="label" style="width: 35%; font-size: 7.5px;">DIAMOND SHAPE PREFERENCE</div>
                        <div class="value">${data.diamondShape || ""}</div>
                    </div>
                     <div class="flex border-r" style="width: 25%;">
                        <div class="label" style="width: 50%;">COL/CLA.</div>
                        <div class="value">${data.colorClarity || ""}</div>
                    </div>
                     <div class="flex" style="width: 25%;">
                        <div class="label" style="width: 45%;">ORIGIN</div>
                        <div class="value">${data.origin || ""}</div>
                    </div>
                </div>
                
                ${rowHTML("BUDGET FOR DIA.", data.diamondBudget, "17.5%")}
                ${rowHTML("DIAMOND PRIORITY", checkboxGroupHTML(["SIZE", "QUALITY", "BALANCE"], data.diamondPriority, true), "17.5%")}

                <div class="row">
                     <div class="flex border-r" style="width: 50%;">
                        <div class="label" style="width: 35%;">GEMSTONE PREFERENCE</div>
                        <div class="value">${data.gemstonePref || ""}</div>
                    </div>
                     <div class="flex border-r" style="width: 25%;">
                        <div class="label" style="width: 50%;">COL/CLA.</div>
                        <div class="value">${data.gemstoneColorClarity || ""}</div>
                    </div>
                     <div class="flex" style="width: 25%;">
                        <div class="label" style="width: 45%;">ORIGIN</div>
                        <div class="value">${data.gemstoneOrigin || ""}</div>
                    </div>
                </div>

                ${rowHTML("OTHER DETAILS", data.otherDetails, "17.5%")}
                ${rowHTML("SAMPLE", data.sample, "17.5%")}

                <!-- Section 6: Budget -->
                ${sectionHeaderHTML("BUDGET & TIMELINE")}
                ${rowHTML("BUDGET RANGE", data.budgetRange, "17.5%")}
                ${rowHTML("URGENCY LEVEL", checkboxGroupHTML(["STANDARD", "PRIORITY", "URGENT"], data.urgencyLevel), "17.5%")}
                
                <!-- Section 7: Notes -->
                ${sectionHeaderHTML("SALES PERSON NOTES")}
                ${rowHTML("MUST-HAVE ELEMENTS", data.mustHave, "17.5%")}
                ${rowHTML("MUST-AVOID ELEMENTS", data.mustAvoid, "17.5%")}
                ${rowHTML("SPECIAL INSTRUCTIONS", data.specialInstructions, "17.5%")}

                <!-- Section 8: Follow Up Table (Page 1) -->
                ${sectionHeaderHTML("FOLLOW-UP LOG")}
                <table style="border-bottom: none;">
                     <thead>
                        <tr>
                            <th style="width: 17.5%;">DATE</th>
                            <th style="width: 20%;">MODE</th>
                            <th style="width: 15%;">OUTCOME</th>
                            <th style="width: 15%;">NEXT ACTION</th>
                            <th style="width: 15%;">NEXT FOLLOW-UP</th>
                            <th style="">COMMENTS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(data.followUpLogs && data.followUpLogs.length > 0
                          ? data.followUpLogs.slice(0, 4)
                          : []
                        )
                          .map(
                            (log: any) => `
                            <tr>
                                <td style="height: 20px;">${log.date || ""}</td>
                                <td>${checkboxGroupHTML(["CALL", "WHATSAPP", "VISIT"], log.mode ? log.mode.toUpperCase() : "", true)}</td>
                                <td style="font-size: 7.5px; padding: 2px 4px;">${log.outcome || ""}</td>
                                <td style="font-size: 7.5px; padding: 2px 4px;">${log.next_action || ""}</td>
                                <td>${log.next_follow_up_date || ""}</td>
                                <td style="font-size: 7.5px; padding: 2px 4px;">${log.comments || ""}</td>
                            </tr>
                        `
                          )
                          .join("")}
                        ${Array.from({
                          length: Math.max(
                            0,
                            4 - (data.followUpLogs?.length || 0)
                          ),
                        })
                          .map(
                            () => `
                            <tr>
                                <td style="height: 20px;"></td>
                                <td>${checkboxGroupHTML(["CALL", "WHATSAPP", "VISIT"], "", true)}</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
      </div>
    `;
  };

  const generatePage2 = () => {
    return `
      <div class="page-container" style="padding-top: 15px;">
         <style>${commonStyles}</style>
         
         <!-- Section 9: Follow Up Table Overflow (Page 2) -->
         ${
           data.followUpLogs && data.followUpLogs.length > 4
             ? `
         <div class="border-box" style="margin-bottom: 20px;">
              ${sectionHeaderHTML("FOLLOW-UP LOG (CONTINUED)")}
              <table>
                   <thead>
                      <tr>
                          <th style="width: 17.5%;">DATE</th>
                          <th style="width: 20%;">MODE</th>
                          <th style="width: 15%;">OUTCOME</th>
                          <th style="width: 15%;">NEXT ACTION</th>
                          <th style="width: 15%;">NEXT FOLLOW-UP</th>
                          <th style="">COMMENTS</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${data.followUpLogs
                        .slice(4)
                        .map(
                          (log: any) => `
                          <tr>
                              <td style="height: 22px;">${log.date || ""}</td>
                              <td>${checkboxGroupHTML(["CALL", "WHATSAPP", "VISIT"], log.mode ? log.mode.toUpperCase() : "", true)}</td>
                              <td style="font-size: 8px;">${log.outcome || ""}</td>
                              <td style="font-size: 8px;">${log.next_action || ""}</td>
                              <td>${log.next_follow_up_date || ""}</td>
                              <td style="font-size: 8px;">${log.comments || ""}</td>
                          </tr>
                      `
                        )
                        .join("")}
                  </tbody>
              </table>
         </div>
         `
             : ""
         }

         <!-- Advance Handling -->
         <div class="border-box">
              ${sectionHeaderHTML("ADVANCE HANDLING (ONLY AFTER CONFIRMATION)")}
              <div>
                 ${rowHTML("ADVANCE TYPE", data.advanceType, "26%")}
                 ${rowHTML("AMOUNT / WEIGHT", data.amountWeight, "26%")}
                 ${rowHTML("DATE RECEIVED", data.dateReceived, "26%")}
                 ${rowHTML("RECEIPT GENERATED", checkboxGroupHTML(["YES", "NO"], data.receiptGenerated ? "YES" : "NO"), "26%")}
                 ${rowHTML("ACCOUNTS NOTIFIED", checkboxGroupHTML(["YES", "NO"], data.accountsNotified ? "YES" : "NO"), "26%")}
                 
                 <div class="row">
                      <div class="label" style="width: 26%;">GOLD RATE LOCKED</div>
                      <div class="value border-r" style="width: 20%;">${checkboxGroupHTML(["YES", "NO"], data.goldRateLocked ? "YES" : "NO")}</div>
                      <div class="label" style="width: 20%;">GOLD RATE FIXED</div>
                      <div class="value border-r" style="width: 15%;">${data.goldRateFixed || ""}</div>
                      <div class="label" style="width: 10%;">DATE</div>
                      <div class="value flex-1">${data.goldRateDate || ""}</div>
                 </div>
     
                 ${rowHTML("ERP ENTRY DONE", checkboxGroupHTML(["YES", "NO"], data.erpEntryDone ? "YES" : "NO"), "26%")}
                 ${rowHTML("NEXT DEPT TRIGGERED", checkboxGroupHTML(["DESIGN", "DIAMOND", "PRODUCTION"], data.nextDeptTriggered || []), "26%")}
                 ${rowHTML("VERIFIED BY", data.verifiedBy, "26%")}
                 ${rowHTML("COLOUR STONE DEMAND", data.colourStoneDemand, "26%")}
                 ${rowHTML("RAW MATERIAL DEPT. INSTRUCTIONS", data.rawMaterialInstructions, "26%", true)}
              </div>
         </div>

         <!-- Ledger & Instructions (Connected) -->
         <div class="border-box" style="margin-top: 20px;">
              ${sectionHeaderHTML("LEDGER")}
              <table style="border-bottom: 1px solid ${maroon};">
                 <thead>
                     <tr style="background: #f9f9f9;">
                         <th style="width: 7.5%; text-align: center;">S.N.</th>
                         <th style="width: 15%;">DATE</th>
                         <th style="width: 25%;">PARTICULARS</th>
                         <th style="width: 10%;">GOLD</th>
                         <th style="width: 10%;">DIAMOND</th>
                         <th style="width: 10%;">CASH</th>
                         <th style="">NARRATION</th>
                     </tr>
                 </thead>
                 <tbody>
                      ${(() => {
                        const entries = data.ledgerEntries || [];
                        const validEntries = entries.filter(
                          (e: any) =>
                            e.date ||
                            e.particulars ||
                            e.gold ||
                            e.diamond ||
                            e.cash ||
                            e.narration
                        );
                        const totalGold = validEntries.reduce(
                          (acc: number, curr: any) =>
                            acc + (parseFloat(curr.gold) || 0),
                          0
                        );
                        const totalDiamond = validEntries.reduce(
                          (acc: number, curr: any) =>
                            acc + (parseFloat(curr.diamond) || 0),
                          0
                        );
                        const totalCash = validEntries.reduce(
                          (acc: number, curr: any) =>
                            acc + (parseFloat(curr.cash) || 0),
                          0
                        );

                        return `
                        ${(data.ledgerEntries && data.ledgerEntries.length > 0
                          ? data.ledgerEntries
                          : [{}, {}, {}, {}, {}]
                        )
                          .map(
                            (entry: any, i: number) => `
                           <tr>
                               <td class="text-center" style="font-weight: 600;">${i + 1}</td>
                               <td>${entry.date || ""}</td>
                               <td>${entry.particulars || ""}</td>
                               <td>${entry.gold || ""}</td>
                               <td>${entry.diamond || ""}</td>
                               <td>${entry.cash || ""}</td>
                               <td>${entry.narration || ""}</td>
                           </tr>
                       `
                          )
                          .join("")}
                       <tr style="background-color: white !important; color: black !important; font-weight: bold; font-size: 9px;">
                            <td colspan="3" style="background-color: white !important; color: black !important; text-align: right; padding: 6px 12px; font-weight: bold; border-color: ${maroon};">TOTAL BALANCES WITH NSJ</td>
                            <td style="background-color: white !important; border-color: ${maroon}; padding-left: 4px;">${totalGold !== 0 ? totalGold.toFixed(2) : ""}</td>
                            <td style="background-color: white !important; border-color: ${maroon}; padding-left: 4px;">${totalDiamond !== 0 ? totalDiamond.toFixed(2) : ""}</td>
                            <td style="background-color: white !important; border-color: ${maroon}; padding-left: 4px;">${totalCash !== 0 ? totalCash.toFixed(2) : ""}</td>
                            <td style="background-color: white !important; border-color: ${maroon};"></td>
                       </tr>
                        `;
                      })()}
                 </tbody>
              </table>
              <div>
                 ${rowHTML("DESIGN DEPT. INSTRUCTIONS", data.designDeptInstructions, "22.5%")}
                 ${rowHTML("PRODUCTION DEPT. INSTRUCTIONS", data.productionDeptInstructions, "22.5%")}
                 ${rowHTML("ACCOUNTS DEPT. INSTRUCTIONS", data.accountsDeptInstructions, "22.5%")}
                 ${rowHTML("REMINDERS", data.reminders, "22.5%", true)}
              </div>
         </div>

         <!-- Rough Work / Final Design / Delivery Notes (2-Column Restructure) -->
         <div class="flex" style="margin-top: 15px;">
             <!-- Left Column: Rough Work & Delivery Notes -->
             <div style="width: 50%;" class="border-box">
                  <div class="maroon-bg text-center font-bold" style="padding: 3px; border-bottom: 1px solid ${maroon};">ROUGH WORK</div>
                  <div class="ruled-lines" style="padding: 0 10px; font-size: 10px; min-height: 200px; white-space: pre-wrap; font-weight: 500; border-bottom: 1px solid ${maroon};">${data.roughWork || ""}</div>
                  
                  <div class="maroon-bg text-center font-bold" style="padding: 3px; border-bottom: 1px solid ${maroon};">DELIVERY NOTES</div>
                  <div class="ruled-lines" style="padding: 0 10px; font-size: 10px; min-height: 200px; white-space: pre-wrap; font-weight: 500;">${data.deliveryNotes || ""}</div>
             </div>

             <!-- Right Column: Final Design -->
             <div style="width: 50%; border-left: none;" class="border-box">
                  <div class="maroon-bg text-center font-bold" style="padding: 3px; border-bottom: 1px solid ${maroon};">FINAL DESIGN</div>
                  <div class="ruled-lines" style="padding: 0 10px; font-size: 10px; min-height: 428px; white-space: pre-wrap; font-weight: 500;">${data.finalDesign || ""}</div>
             </div>
         </div>
      </div>
    `;
  };

  const pdf = new jsPDF("p", "mm", "a4");

  const renderToCanvas = async (html: string) => {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = "0";
    container.style.left = "0";
    container.style.zIndex = "-9999";
    container.innerHTML = `
            <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;0,800;0,900;1,400;1,700;1,800;1,900&display=swap" rel="stylesheet">
            ${html}
        `;
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 3,
        useCORS: true,
        logging: false,
        windowWidth: 1200,
      });
      return canvas;
    } finally {
      document.body.removeChild(container);
    }
  };

  // Render Page 1
  const canvas1 = await renderToCanvas(generatePage1());
  const imgProps1 = pdf.getImageProperties(
    canvas1.toDataURL("image/jpeg", 0.98)
  );
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight1 = (imgProps1.height * pdfWidth) / imgProps1.width;
  pdf.addImage(
    canvas1.toDataURL("image/jpeg", 0.98),
    "JPEG",
    0,
    0,
    pdfWidth,
    pdfHeight1
  );

  // Render Page 2
  pdf.addPage();
  const canvas2 = await renderToCanvas(generatePage2());
  const imgProps2 = pdf.getImageProperties(
    canvas2.toDataURL("image/jpeg", 0.98)
  );
  const pdfHeight2 = (imgProps2.height * pdfWidth) / imgProps2.width;
  pdf.addImage(
    canvas2.toDataURL("image/jpeg", 0.98),
    "JPEG",
    0,
    0,
    pdfWidth,
    pdfHeight2
  );

  pdf.save(filename);
}
