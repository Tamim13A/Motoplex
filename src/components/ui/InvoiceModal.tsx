"use client";

import React from "react";
import { Printer, X, CheckCircle2 } from "lucide-react";
import { Order } from "@/types";

interface InvoiceModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceModal({ order, isOpen, onClose }: InvoiceModalProps) {
  if (!isOpen || !order) return null;

  // Ultra-Professional Full-Page A4 Print Engine (100% Covers the Entire A4 Canvas)
  const handlePrint = () => {
    const oldFrame = document.getElementById("mpx-pure-print-frame");
    if (oldFrame) oldFrame.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "mpx-pure-print-frame";
    iframe.style.position = "fixed";
    iframe.style.top = "-99999px";
    iframe.style.left = "-99999px";
    iframe.style.width = "210mm";
    iframe.style.height = "297mm";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      window.print();
      return;
    }

    const itemsCount = (order.items || []).length;
    // Adapt row padding dynamically so whether 1 item or 5 items, it gracefully occupies the page
    const rowPadding = itemsCount <= 3 ? "12px 10px" : "8px 10px";

    const itemsHtml = (order.items || [])
      .map(
        (it, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: ${rowPadding}; font-family: monospace; color: #64748b; font-size: 11px; width: 32px; text-align: center;">
            ${idx + 1}
          </td>
          <td style="padding: ${rowPadding}; font-weight: 700; color: #09090b; font-size: 11.5px;">
            ${it.productName}
          </td>
          <td style="padding: ${rowPadding}; font-family: monospace; color: #475569; font-size: 10.5px; width: 110px;">
            ${it.variantInfo || "Standard Spec"}
          </td>
          <td style="padding: ${rowPadding}; text-align: center; font-weight: 800; font-size: 11.5px; width: 50px;">
            ${it.quantity}
          </td>
          <td style="padding: ${rowPadding}; text-align: right; font-family: monospace; color: #334155; font-size: 11px; width: 95px;">
            ৳${Number(it.price || 0).toLocaleString("en-BD")}
          </td>
          <td style="padding: ${rowPadding}; text-align: right; font-weight: 900; font-family: monospace; color: #09090b; font-size: 11.5px; width: 110px;">
            ৳${Number(it.total || (Number(it.price || 0) * Number(it.quantity || 1))).toLocaleString("en-BD")}
          </td>
        </tr>
      `
      )
      .join("");

    const isPos = order.deliveryMethod === "Showroom POS Counter";

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Tax_Invoice_${order.orderNumber || "MOTOPLEX"}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0 !important;
            }
            *, *::before, *::after {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              background: #ffffff !important;
              color: #09090b !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              font-size: 11px;
              line-height: 1.4;
              width: 100%;
              height: 100%;
              margin: 0 !important;
              padding: 0 !important;
            }
            /* FULL PAGE A4 VERTICAL DISTRIBUTION */
            .page-container {
              width: 100%;
              max-width: 210mm;
              height: 290mm;
              padding: 12mm 15mm 12mm 15mm;
              margin: 0 auto;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              box-sizing: border-box;
              page-break-after: avoid;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              border-bottom: 2px solid #09090b;
              padding-bottom: 12px;
              margin-bottom: 14px;
            }
            .details-box {
              width: 100%;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              background-color: #f8fafc;
              margin-bottom: 16px;
            }
            .details-table {
              width: 100%;
              border-collapse: collapse;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #cbd5e1;
              margin-bottom: 16px;
            }
            .items-table th {
              background-color: #09090b;
              color: #ffffff;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              padding: 8px 10px;
            }
            .summary-box {
              width: 100%;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              background-color: #ffffff;
              margin-bottom: 20px;
            }
            .summary-table {
              width: 100%;
              border-collapse: collapse;
            }
            .signature-deck {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              margin-bottom: 0;
            }
            .blank-sign-box {
              height: 52px;
              width: 100%;
            }
            .sign-line {
              border-bottom: 1.5px solid #09090b;
              width: 190px;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            <!-- TOP GROUP -->
            <div>
              <!-- 1. Header with Italian Flag & Showroom Contact -->
              <table class="header-table">
                <tr>
                  <td style="vertical-align: top; width: 62%;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="font-size: 26px; font-weight: 900; letter-spacing: -0.04em; color: #09090b;">MOTOPLEX</span>
                      <!-- Official Italian Flag -->
                      <div style="display: inline-flex; flex-direction: column; width: 11px; height: 18px; border-radius: 2px; overflow: hidden; border: 1px solid #cbd5e1;">
                        <div style="background-color: #009246; height: 33.33%;"></div>
                        <div style="background-color: #ffffff; height: 33.33%;"></div>
                        <div style="background-color: #ce2b37; height: 33.33%;"></div>
                      </div>
                    </div>
                    <div style="font-size: 9.5px; font-weight: 900; color: #dc2626; letter-spacing: 0.22em; text-transform: uppercase; margin-top: -2px;">
                      BANGLADESH PERFORMANCE DIVISION
                    </div>
                    <div style="font-size: 10px; color: #475569; margin-top: 8px; line-height: 1.4;">
                      Official Authorized Distributor for <strong>Aprilia • Moto Guzzi • Vespa</strong><br />
                      Flagship Showroom: House 14, Road 112, Gulshan-2, Dhaka 1212<br />
                      BIN / VAT Reg No: <strong>004189234-0101</strong> • NBR Mushak-6.3 Standard<br />
                      Hotline: +880 1700-MOTOPLEX | Showroom WhatsApp: <strong>+880 1957-060531</strong>
                    </div>
                  </td>
                  <td style="vertical-align: top; text-align: right; width: 38%;">
                    <div style="display: inline-block; background-color: #09090b; color: #ffffff; font-weight: 900; font-size: 10px; padding: 4px 10px; border-radius: 4px; letter-spacing: 0.08em; text-transform: uppercase;">
                      TAX INVOICE & CHALLAN
                    </div>
                    <div style="margin-top: 8px; font-size: 11px;">
                      <div style="font-weight: 800; color: #09090b;">
                        Invoice No: <span style="font-family: monospace; color: #dc2626; font-size: 12px; font-weight: 900;">INV-${order.orderNumber}</span>
                      </div>
                      <div style="color: #64748b; font-size: 10.5px; margin-top: 3px;">
                        Date: <strong>${order.date || new Date().toLocaleDateString("en-GB")}</strong>
                      </div>
                      <div style="margin-top: 5px;">
                        Status: <span style="font-weight: 800; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 999px; font-size: 9.5px; text-transform: uppercase;">
                          ${order.status || "CONFIRMED"}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- 2. Customer & Dispatch Details Box -->
              <div class="details-box">
                <table class="details-table">
                  <tr>
                    <td style="vertical-align: top; width: 55%; padding: 10px 14px; border-right: 1px solid #e2e8f0;">
                      <div style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px;">
                        BILLED & SHIPPED TO:
                      </div>
                      <div style="font-size: 13px; font-weight: 900; color: #09090b;">${order.shippingAddress.fullName}</div>
                      <div style="font-size: 11px; color: #334155; font-weight: 700; margin-top: 2px;">Phone: ${order.shippingAddress.phone}</div>
                      <div style="font-size: 10.5px; color: #475569; margin-top: 3px; line-height: 1.35;">
                        ${order.shippingAddress.address}<br />
                        ${order.shippingAddress.area}, ${order.shippingAddress.district}, ${order.shippingAddress.division}
                      </div>
                    </td>
                    <td style="vertical-align: top; width: 45%; padding: 10px 14px; text-align: right;">
                      <div style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px;">
                        ORDER & DISPATCH SPECIFICATIONS:
                      </div>
                      <div style="font-size: 11px; color: #09090b;">Payment Method: <strong>${order.paymentMethod}</strong></div>
                      <div style="font-size: 11px; color: #09090b; margin-top: 2px;">Delivery Mode: <strong>${order.deliveryMethod}</strong></div>
                      ${order.courierName ? `<div style="font-size: 11px; color: #09090b; margin-top: 2px;">Courier Partner: <strong>${order.courierName}</strong></div>` : ""}
                      ${order.trackingNumber ? `<div style="font-size: 10.5px; font-family: monospace; color: #475569; margin-top: 3px;">Tracking No: <strong style="color: #09090b;">${order.trackingNumber}</strong></div>` : ""}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- 3. Items Table -->
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="text-align: center; width: 32px;">#</th>
                    <th style="text-align: left;">Item Description</th>
                    <th style="text-align: left; width: 110px;">Variant / Spec</th>
                    <th style="text-align: center; width: 50px;">Qty</th>
                    <th style="text-align: right; width: 95px;">Unit Price</th>
                    <th style="text-align: right; width: 110px;">Total (BDT)</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- 4. Pricing Summary & Customer Policy Box -->
              <div class="summary-box">
                <table class="summary-table">
                  <tr>
                    <td style="vertical-align: top; width: 52%; padding: 12px 14px; border-right: 1px solid #e2e8f0;">
                      <div style="font-size: 10px; font-weight: 800; color: #09090b; margin-bottom: 5px;">Customer Note & Warranty Terms:</div>
                      <div style="font-size: 9.5px; color: #64748b; line-height: 1.5;">
                        • Goods once sold can be exchanged within 7 days with original unboxing seals intact.<br />
                        • Genuine Piaggio Group manufacturer warranty applies according to vehicle chassis registration.<br />
                        • 100% Genuine Italian Motorcycling Equipment & Factory Spare Parts certified.<br />
                        • Cash on Delivery handover requires physical inspection before payment.<br />
                        • Keep this official tax invoice safe for claiming factory manufacturer warranty.
                      </div>
                    </td>
                    <td style="vertical-align: top; width: 48%; padding: 12px 14px;">
                      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                        <tr>
                          <td style="padding: 3px 0; color: #64748b;">Subtotal (Products):</td>
                          <td style="padding: 3px 0; text-align: right; font-weight: 700; font-family: monospace; color: #09090b;">
                            ৳${Number(order.subtotal || 0).toLocaleString("en-BD")}
                          </td>
                        </tr>
                        ${
                          (order.discount || 0) > 0
                            ? `<tr>
                                <td style="padding: 3px 0; color: #059669; font-weight: 700;">Discount Applied:</td>
                                <td style="padding: 3px 0; text-align: right; font-weight: 700; font-family: monospace; color: #059669;">
                                  -৳${Number(order.discount || 0).toLocaleString("en-BD")}
                                </td>
                              </tr>`
                            : ""
                        }
                        ${
                          isPos
                            ? `<tr>
                                <td style="padding: 3px 0; color: #64748b;">Delivery Mode:</td>
                                <td style="padding: 3px 0; text-align: right; font-weight: 700; color: #09090b;">Showroom Direct Handover</td>
                              </tr>
                              <tr>
                                <td style="padding: 4px 0; color: #047857; font-weight: 700;">Paid Amount (${order.paymentMethod}):</td>
                                <td style="padding: 4px 0; text-align: right; font-weight: 800; font-family: monospace; color: #047857;">
                                  ৳${Number(order.advancePaid ?? order.total ?? 0).toLocaleString("en-BD")}
                                </td>
                              </tr>
                              <tr style="border-top: 1.5px solid #09090b;">
                                <td style="padding: 6px 0; font-size: 12px; font-weight: 900; color: #09090b;">Remaining Due (বকেয়া টাকা):</td>
                                <td style="padding: 6px 0; text-align: right; font-size: 14px; font-weight: 900; font-family: monospace; color: ${Number(order.dueAmount || 0) > 0 ? "#dc2626" : "#047857"};">
                                  ৳${Number(order.dueAmount || 0).toLocaleString("en-BD")}
                                </td>
                              </tr>`
                            : `<tr>
                                <td style="padding: 3px 0; color: #64748b;">Pathao Courier Delivery:</td>
                                <td style="padding: 3px 0; text-align: right; font-weight: 700; font-family: monospace; color: #09090b;">
                                  ৳${Number(order.shippingFee || 0).toLocaleString("en-BD")}
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 3px 0; color: #047857; font-weight: 700;">Advance Delivery Fee:</td>
                                <td style="padding: 3px 0; text-align: right; font-weight: 800; font-family: monospace; color: #047857;">
                                  -৳${Number(order.advancePaid ?? order.shippingFee ?? 0).toLocaleString("en-BD")} (Paid)
                                </td>
                              </tr>
                              <tr style="border-top: 1.5px solid #09090b;">
                                <td style="padding: 6px 0; font-size: 12px; font-weight: 900; color: #09090b;">Net Payable (Cash on Delivery):</td>
                                <td style="padding: 6px 0; text-align: right; font-size: 15px; font-weight: 900; font-family: monospace; color: #dc2626;">
                                  ৳${Number(order.dueAmount ?? order.subtotal ?? 0).toLocaleString("en-BD")}
                                </td>
                              </tr>`
                        }
                        <tr>
                          <td style="padding: 3px 0; color: #94a3b8; font-size: 10px;">Total Order Value:</td>
                          <td style="padding: 3px 0; text-align: right; font-family: monospace; color: #64748b; font-size: 10px;">
                            ৳${Number(order.total || 0).toLocaleString("en-BD")}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- BOTTOM GROUP: SIGNATURES & OFFICIAL SEAL (Firmly Anchored at Bottom) -->
            <div>
              <table class="signature-deck">
                <tr>
                  <td style="width: 50%; text-align: center; vertical-align: bottom;">
                    <!-- Pure empty space for customer manual physical pen signature -->
                    <div class="blank-sign-box"></div>
                    <div class="sign-line"></div>
                    <div style="font-size: 10px; font-weight: 900; color: #09090b; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 5px;">
                      CUSTOMER SIGNATURE
                    </div>
                    <div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">Received goods in 100% sound condition</div>
                  </td>
                  <td style="width: 50%; text-align: center; vertical-align: bottom;">
                    <!-- Pure empty space for showroom official signature and rubber stamp -->
                    <div class="blank-sign-box"></div>
                    <div class="sign-line"></div>
                    <div style="font-size: 10px; font-weight: 900; color: #09090b; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 5px;">
                      FOR MOTOPLEX BANGLADESH
                    </div>
                    <div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">Authorized Showroom Officer</div>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Instant execution with zero CDN dependency
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.print();
      }
      setTimeout(() => {
        iframe.remove();
      }, 2500);
    }, 150);
  };

  const isPos = order.deliveryMethod === "Showroom POS Counter";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 select-none">
      {/* Modal Card */}
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-200">
        {/* Top Control Header */}
        <div className="bg-zinc-950 text-white px-6 py-3.5 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-red-500 font-bold">
              Official Tax Invoice & Challan
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs font-semibold text-zinc-300 font-mono">
              #{order.orderNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-red-600/30 active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF (Full Page A4)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close Invoice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Visual Preview */}
        <div className="p-6 sm:p-10 text-zinc-900 bg-white font-sans text-xs">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-zinc-950 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-black text-2xl tracking-tighter text-zinc-950">
                  MOTOPLEX
                </span>
                <div className="flex h-4 w-2.5 rounded-xs overflow-hidden flex-col shadow-xs">
                  <span className="bg-[#009246] flex-1 w-full" />
                  <span className="bg-white flex-1 w-full border-y border-zinc-200" />
                  <span className="bg-[#ce2b37] flex-1 w-full" />
                </div>
              </div>
              <span className="text-[10px] font-black tracking-widest text-red-600 uppercase block -mt-1">
                BANGLADESH PERFORMANCE DIVISION
              </span>
              <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                Official Authorized Distributor for <strong>Aprilia • Moto Guzzi • Vespa</strong><br />
                Flagship Showroom: House 14, Road 112, Gulshan-2, Dhaka 1212<br />
                BIN / VAT Reg No: <strong>004189234-0101</strong> • NBR Mushak-6.3 Standard<br />
                Hotline: +880 1700-MOTOPLEX | Showroom WhatsApp: <strong>+880 1957-060531</strong>
              </p>
            </div>

            <div className="sm:text-right space-y-1.5">
              <span className="inline-block bg-zinc-950 text-white font-black text-[10px] px-3.5 py-1 rounded uppercase tracking-wider shadow-xs">
                TAX INVOICE & CHALLAN
              </span>
              <div className="pt-1.5 text-xs">
                <p className="font-bold text-zinc-900">
                  Invoice No: <span className="font-mono text-red-600 font-black">INV-{order.orderNumber}</span>
                </p>
                <p className="text-zinc-600 text-[11px]">
                  Date: {order.date || new Date().toLocaleDateString("en-GB")}
                </p>
                <div className="flex items-center sm:justify-end gap-1.5 pt-0.5">
                  <span className="text-zinc-500 text-[11px]">Status:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-800 text-[10px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full capitalize">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {order.status || "Pending"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Shipping / Dispatch Grid */}
          <div className="my-5 p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-0.5">
              <h4 className="font-black text-zinc-500 uppercase tracking-wider text-[9.5px]">
                BILLED & SHIPPED TO:
              </h4>
              <p className="font-black text-sm text-zinc-950">{order.shippingAddress.fullName}</p>
              <p className="text-zinc-700 font-bold text-xs">Phone: {order.shippingAddress.phone}</p>
              <p className="text-zinc-600 text-[11px] leading-snug">
                {order.shippingAddress.address}<br />
                {order.shippingAddress.area}, {order.shippingAddress.district}, {order.shippingAddress.division}
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <h4 className="font-black text-zinc-500 uppercase tracking-wider text-[9.5px]">
                ORDER & DISPATCH SPECIFICATIONS:
              </h4>
              <p className="text-zinc-700 text-xs">
                Payment Method: <strong>{order.paymentMethod}</strong>
              </p>
              <p className="text-zinc-700 text-xs">
                Delivery Mode: <strong>{order.deliveryMethod}</strong>
              </p>
              {order.courierName && (
                <p className="text-zinc-700 text-xs">
                  Courier Partner: <strong>{order.courierName}</strong>
                </p>
              )}
              {order.trackingNumber && (
                <p className="font-mono text-[11px] text-zinc-600">
                  Tracking No: <strong className="text-zinc-900">{order.trackingNumber}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="my-5 border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-950 text-white text-[9.5px] font-black uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 w-28">Variant / Spec</th>
                  <th className="py-2.5 px-3 text-center w-14">Qty</th>
                  <th className="py-2.5 px-3 text-right w-24">Unit Price</th>
                  <th className="py-2.5 px-3 text-right w-28">Total (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {(order.items || []).map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-mono text-zinc-400 text-center text-[10px]">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3 font-bold text-zinc-950 text-xs">
                      {item.productName}
                    </td>
                    <td className="py-3 px-3 text-zinc-600 font-mono text-[11px]">
                      {item.variantInfo || "Standard Spec"}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-xs">{item.quantity}</td>
                    <td className="py-3 px-3 text-right text-zinc-700 font-mono text-xs">
                      ৳{Number(item.price || 0).toLocaleString("en-BD")}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-zinc-950 font-mono text-xs">
                      ৳{Number(item.total || ((item.price || 0) * (item.quantity || 1)) || 0).toLocaleString("en-BD")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Calculation Summary & Policy */}
          <div className="my-5 p-4 border border-slate-200 rounded-xl flex flex-col sm:flex-row justify-between items-start gap-4 bg-white">
            <div className="max-w-xs text-[10.5px] text-zinc-500 space-y-1.5">
              <p className="font-bold text-zinc-900 text-xs">Customer Note & Policy:</p>
              <p>• Goods once sold can be exchanged within 7 days with original unboxing seals intact.</p>
              <p>• Genuine Piaggio Group manufacturer warranty applies according to vehicle chassis registration.</p>
              <p>• 100% Genuine Italian Motorcycling Equipment & Spare Parts guaranteed.</p>
            </div>

            <div className="w-full sm:w-72 space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal (Products):</span>
                <span className="font-bold text-zinc-900 font-mono">
                  ৳{Number(order.subtotal || 0).toLocaleString("en-BD")}
                </span>
              </div>
              {(order.discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount Applied:</span>
                  <span className="font-mono">-৳{Number(order.discount || 0).toLocaleString("en-BD")}</span>
                </div>
              )}
              {isPos ? (
                <>
                  <div className="flex justify-between text-zinc-600">
                    <span>Delivery / Counter:</span>
                    <span className="font-bold text-zinc-900">Showroom Direct Handover</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    <span>Paid Amount ({order.paymentMethod}):</span>
                    <span className="font-bold font-mono">
                      ৳${Number(order.advancePaid ?? order.total ?? 0).toLocaleString("en-BD")}
                    </span>
                  </div>
                  {Number(order.dueAmount || 0) > 0 ? (
                    <div className="border-t border-amber-300 pt-1.5 flex justify-between text-xs font-black text-rose-600 bg-amber-50/70 p-1.5 rounded border">
                      <span>Remaining Due (বকেয়া টাকা):</span>
                      <span className="font-mono">৳{Number(order.dueAmount || 0).toLocaleString("en-BD")}</span>
                    </div>
                  ) : (
                    <div className="border-t border-zinc-300 pt-1.5 flex justify-between text-xs font-black text-emerald-700">
                      <span>Remaining Due (বকেয়া):</span>
                      <span className="font-mono">৳0 (Fully Paid)</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between text-zinc-600">
                    <span>Pathao Courier Delivery:</span>
                    <span className="font-bold text-zinc-900 font-mono">
                      ৳{Number(order.shippingFee || 0).toLocaleString("en-BD")}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    <span>Advance Delivery Fee:</span>
                    <span className="font-bold font-mono">
                      -৳{Number(order.advancePaid ?? order.shippingFee ?? 0).toLocaleString("en-BD")} (Paid)
                    </span>
                  </div>
                  <div className="border-t border-zinc-300 pt-1.5 flex justify-between text-xs font-black text-zinc-950">
                    <span>Net Payable (Cash on Delivery):</span>
                    <span className="text-red-600 font-mono font-black text-sm">
                      ৳{Number(order.dueAmount ?? order.subtotal ?? 0).toLocaleString("en-BD")}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-[10px] text-zinc-400 pt-0.5">
                <span>Total Order Value:</span>
                <span className="font-mono">৳{Number(order.total || 0).toLocaleString("en-BD")}</span>
              </div>
            </div>
          </div>

          {/* Signatures (Image 3 Fix: Pure Blank Signing Zones) */}
          <div className="pt-10 pb-2 flex justify-between items-end text-zinc-600">
            {/* Left: Customer Manual Signature Box */}
            <div className="text-center w-48">
              {/* Pure empty blank space above the line for customer manual physical pen signature */}
              <div className="h-12 w-full" />
              <div className="w-full border-b-2 border-zinc-900" />
              <p className="text-[10px] text-zinc-800 font-black mt-1.5 uppercase tracking-wider">
                Customer Signature
              </p>
              <p className="text-[9px] text-zinc-500">Received in sound condition</p>
            </div>

            {/* Right: Showroom Owner / Authorized Officer Signature & Seal Box */}
            <div className="text-center w-52">
              {/* Pure empty blank space above the line for owner/officer signature and rubber stamp */}
              <div className="h-12 w-full" />
              <div className="w-full border-b-2 border-zinc-900" />
              <p className="text-[10px] text-zinc-900 font-black mt-1.5 uppercase tracking-wider">
                For Motoplex Bangladesh
              </p>
              <p className="text-[9px] text-zinc-500">Authorized Showroom Officer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
