/**
 * Motoplex BD - Telegram Order Notification Bot Service
 * Dispatches real-time order alerts to the Motoplex Admin Telegram Group.
 */

export interface TelegramOrderPayload {
  orderNumber: string;
  customerInfo?: {
    fullName: string;
    phone: string;
    email?: string;
  };
  shippingAddress: {
    fullName: string;
    phone: string;
    division: string;
    district: string;
    area: string;
    address: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
    sku?: string;
    variantDetails?: {
      size?: string;
      color?: string;
      material?: string;
    };
  }>;
  subtotal: number;
  shippingFee: number;
  advancePaid?: number;
  dueAmount?: number;
  discount: number;
  total: number;
  deliveryMethod: string;
  paymentMethod: string;
  paymentDetails?: {
    advancePaymentMethod?: string;
    advanceAmount?: number;
    senderNumber?: string;
    trxId?: string;
    bankName?: string;
    accountNumber?: string;
    reference?: string;
  };
  createdAt?: string | Date;
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function getActiveTelegramChatId(token: string): Promise<string | null> {
  const envChatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (envChatId) return envChatId;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=10`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result) || data.result.length === 0) return null;

    for (let i = data.result.length - 1; i >= 0; i--) {
      const u = data.result[i];
      const foundId =
        u.message?.chat?.id ||
        u.my_chat_member?.chat?.id ||
        u.channel_post?.chat?.id;
      if (foundId) return String(foundId);
    }
  } catch (err) {
    console.warn("[Telegram] Error resolving chat ID via getUpdates:", err);
  }
  return null;
}

export async function sendTelegramOrderNotification(order: TelegramOrderPayload): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.warn(
      "[Telegram] Warning: TELEGRAM_BOT_TOKEN is missing in environment variables. Telegram notification was skipped."
    );
    return false;
  }

  const chatId = await getActiveTelegramChatId(token);
  if (!chatId) {
    console.warn(
      "[Telegram] Warning: TELEGRAM_CHAT_ID is missing and no recent messages were found on the bot. Please send /start to @MotoPlexBD_Bot or add it to an admin group."
    );
    return false;
  }

  try {
    const customerName = escapeHtml(order.customerInfo?.fullName || order.shippingAddress.fullName || "Valued Customer");
    const customerPhone = escapeHtml(order.customerInfo?.phone || order.shippingAddress.phone || "N/A");
    const customerAddress = escapeHtml(
      `${order.shippingAddress.address}, ${order.shippingAddress.area}, ${order.shippingAddress.district}, ${order.shippingAddress.division}`
    );

    // Format items list compactly so total text length never exceeds 1024 chars
    const visibleItems = order.items.slice(0, 3);
    const itemsLines = visibleItems.map((item, index) => {
      const variantDesc = item.variantDetails
        ? [item.variantDetails.size, item.variantDetails.color, item.variantDetails.material]
            .filter(Boolean)
            .join("/")
        : "";
      const variantSuffix = variantDesc ? ` (${escapeHtml(variantDesc)})` : "";
      const itemTotal = (item.price * item.quantity).toLocaleString("en-BD");
      return `  ${index + 1}. <b>${escapeHtml(item.name)}</b>${variantSuffix}\n     ↳ ${item.quantity}x @ ৳${item.price.toLocaleString("en-BD")} = <b>৳${itemTotal}</b>`;
    });

    if (order.items.length > 3) {
      itemsLines.push(`  ↳ <i>... এবং আরও ${order.items.length - 3}টি পার্টস আইটেম</i>`);
    }

    const itemsText = itemsLines.join("\n");

    const paymentInfoLines: string[] = [];
    const isBkash = order.paymentDetails?.advancePaymentMethod?.includes("bKash") || !order.paymentDetails?.bankName;

    if (isBkash) {
      paymentInfoLines.push(`📱 <b>পেমেন্ট মেথড:</b> বিকাশ এজেন্ট ক্যাশ আউট`);
      paymentInfoLines.push(`🔢 <b>এজেন্ট নম্বর:</b> <code>01879388902</code>`);
      if (order.paymentDetails?.senderNumber) {
        paymentInfoLines.push(`👤 <b>কাস্টমারের বিকাশ নম্বর:</b> <code>${escapeHtml(order.paymentDetails.senderNumber)}</code>`);
      }
      if (order.paymentDetails?.trxId) {
        paymentInfoLines.push(`🔖 <b>bKash TrxID:</b> <code>${escapeHtml(order.paymentDetails.trxId)}</code>`);
      }
    } else {
      paymentInfoLines.push(`🏦 <b>পেমেন্ট মেথড:</b> ব্যাংক ট্রান্সফার`);
      paymentInfoLines.push(`🏛️ <b>ব্যাংক:</b> ${escapeHtml(order.paymentDetails?.bankName || "MOTOPLEX Bank")}`);
      if (order.paymentDetails?.accountNumber) {
        paymentInfoLines.push(`💳 <b>হিসাব নম্বর:</b> <code>${escapeHtml(order.paymentDetails.accountNumber)}</code> (MOTOPLEX)`);
      }
      if (order.paymentDetails?.senderNumber) {
        paymentInfoLines.push(`👤 <b>প্রেরকের বিবরণ:</b> ${escapeHtml(order.paymentDetails.senderNumber)}`);
      }
      if (order.paymentDetails?.trxId || order.paymentDetails?.reference) {
        paymentInfoLines.push(`🔖 <b>TrxID / রেফারেন্স:</b> <code>${escapeHtml(order.paymentDetails.trxId || order.paymentDetails.reference || "")}</code>`);
      }
    }

    const isDhaka = (order.shippingAddress.district || "").trim().toLowerCase() === "dhaka";
    const courierLabel = `Pathao Express (${isDhaka ? "ঢাকার ভেতরে - ৳80" : "সারা বাংলাদেশ - ৳130"})`;
    const advanceAmount = order.advancePaid ?? order.shippingFee;
    const dueAmount = order.dueAmount ?? order.subtotal;

    const message = [
      `📦 <b>নতুন অনলাইন পার্টস অর্ডার (Website Order)!</b> [<code>#${escapeHtml(order.orderNumber)}</code>]`,
      `🌐 <i>গ্রাহক ওয়েবসাইট স্টোরফ্রন্ট থেকে অনলাইন পার্টস অর্ডার সম্পন্ন করেছেন।</i>`,
      `━━━━━━━━━━━━━━━━━━━`,
      `👤 <b>কাস্টমার:</b> ${customerName}`,
      `📞 <b>ফোন:</b> <code>${customerPhone}</code>`,
      `📍 <b>ঠিকানা:</b> ${customerAddress}`,
      `🚚 <b>কুরিয়ার:</b> ${courierLabel}`,
      `━━━━━━━━━━━━━━━━━━━`,
      `🛒 <b>অর্ডারকৃত পার্টস ও অ্যাকসেসরিজ:</b>`,
      itemsText,
      `━━━━━━━━━━━━━━━━━━━`,
      `💰 <b>পার্টস সাবটোটাল:</b> ৳${order.subtotal.toLocaleString("en-BD")}`,
      `📦 <b>পাঠাও ডেলিভারি চার্জ:</b> ৳${order.shippingFee.toLocaleString("en-BD")}`,
      order.discount > 0 ? `🏷️ <b>ডিসকাউন্ট:</b> -৳${order.discount.toLocaleString("en-BD")}` : "",
      `━━━━━━━━━━━━━━━━━━━`,
      `🔍 <b>কাস্টমারের দেওয়া পেমেন্ট তথ্য (যাচাই সাপেক্ষ):</b>`,
      `   ↳ <b>দাবিকৃত অগ্রিম ফি:</b> ৳${advanceAmount.toLocaleString("en-BD")}`,
      ...paymentInfoLines.map((l) => `   ↳ ${l}`),
      `   ↳ <b>স্ট্যাটাস:</b> 🟡 <b>পেমেন্ট যাচাই পেন্ডিং</b> (আপনার ফোনে SMS দেখে কনফার্ম করুন)`,
      `━━━━━━━━━━━━━━━━━━━`,
      `💵 <b>ক্যাশ অন ডেলিভারি (বাকি টাকা):</b> <b>৳${dueAmount.toLocaleString("en-BD")}</b> (পাঠাও ডেলিভারির সময় প্রদেয়)`,
      `━━━━━━━━━━━━━━━━━━━`,
      `⏰ <i>অর্ডার সময়: ${new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })} (BD Time)</i>`,
    ]
      .filter(Boolean)
      .join("\n");

    // Check if there is a valid primary product photo
    const primaryPhoto = order.items.find(
      (i) => i.image && (i.image.startsWith("http://") || i.image.startsWith("https://"))
    )?.image;

    // RULE: ALWAYS SEND EXACTLY ONE SINGLE MESSAGE.
    // If photo exists, send photo with complete invoice attached as caption.
    if (primaryPhoto) {
      try {
        const photoRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            photo: primaryPhoto,
            caption: message,
            parse_mode: "HTML",
          }),
        });

        if (photoRes.ok) {
          console.log(`[Telegram] Successfully dispatched 1 unified photo invoice for Order #${order.orderNumber}`);
          return true;
        } else {
          const errText = await photoRes.text();
          console.warn("[Telegram] sendPhoto failed, falling back to 1 text message:", errText);
        }
      } catch (photoErr) {
        console.warn("[Telegram] Exception in sendPhoto, falling back to 1 text message:", photoErr);
      }
    }

    // Fallback: If no photo or photo URL unreachable, send 1 single text message only
    const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Telegram] Failed to send message. HTTP ${response.status}:`, errorText);
      return false;
    }

    console.log(`[Telegram] Successfully dispatched 1 text invoice for Order #${order.orderNumber}`);
    return true;
  } catch (error) {
    console.error("[Telegram] Unexpected error dispatching notification:", error);
    return false;
  }
}

export interface TelegramServiceBookingPayload {
  bookingNumber: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration?: string;
  customerName: string;
  customerPhone: string;
  bikeBrand: string;
  bikeModel: string;
  bikePlate?: string;
  dealershipName: string;
  dealershipCity: string;
  bookingDate: string;
  bookingSlot: string;
  specialNotes?: string;
  image?: string;
  createdAt?: string | Date;
}

export async function sendTelegramServiceBookingNotification(
  booking: TelegramServiceBookingPayload
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.warn(
      "[Telegram] Warning: TELEGRAM_BOT_TOKEN is missing in environment variables. Service booking notification was skipped."
    );
    return false;
  }

  const chatId = await getActiveTelegramChatId(token);
  if (!chatId) {
    console.warn(
      "[Telegram] Warning: TELEGRAM_CHAT_ID is missing and could not be resolved via getUpdates."
    );
    return false;
  }

  try {
    const customerName = escapeHtml(booking.customerName || "Valued Rider");
    const customerPhone = escapeHtml(booking.customerPhone || "N/A");
    const bikePlate = booking.bikePlate ? ` (${escapeHtml(booking.bikePlate)})` : "";
    const bikeInfo = `${escapeHtml(booking.bikeBrand)} ${escapeHtml(booking.bikeModel)}${bikePlate}`;
    const serviceName = escapeHtml(booking.serviceName || "Official Service");
    const duration = booking.serviceDuration ? escapeHtml(booking.serviceDuration) : "2 - 4 Hours";
    const dealership = `${escapeHtml(booking.dealershipName)} (${escapeHtml(booking.dealershipCity)})`;
    const slot = `${escapeHtml(booking.bookingDate)} • ${escapeHtml(booking.bookingSlot)}`;
    const cost = booking.servicePrice.toLocaleString("en-BD");
    const notes = booking.specialNotes ? escapeHtml(booking.specialNotes.trim()) : null;

    // Exact 1 single unified card with all service appointment details
    const message = [
      `🛠️ <b>নতুন ওয়ার্কশপ সার্ভিস বুকিং (Workshop Service)!</b> [<code>#${escapeHtml(booking.bookingNumber)}</code>]`,
      `🔧 <i>গ্রাহক ওয়েবসাইট থেকে মেকানিকাল সার্ভিস অ্যাপয়েন্টমেন্ট বুক করেছেন।</i>`,
      `━━━━━━━━━━━━━━━━━━━`,
      `👤 <b>কাস্টমার:</b> ${customerName}`,
      `📞 <b>ফোন:</b> <code>${customerPhone}</code>`,
      `🏍️ <b>বাইক:</b> ${bikeInfo}`,
      `━━━━━━━━━━━━━━━━━━━`,
      `🛠️ <b>সার্ভিস প্যাকেজ:</b> ${serviceName}`,
      `⏱️ <b>আনুমানিক সময়:</b> ${duration}`,
      `💰 <b>প্রারম্ভিক সার্ভিস ফি:</b> <b>৳${cost}</b>`,
      `━━━━━━━━━━━━━━━━━━━`,
      `🏢 <b>সার্ভিস সেন্টার:</b> ${dealership}`,
      `🕒 <b>তারিখ ও সময়:</b> ${slot}`,
      notes ? `📝 <b>কাস্টমারের নোট:</b> <i>${notes}</i>` : "",
      `━━━━━━━━━━━━━━━━━━━`,
      `🟡 <b>স্ট্যাটাস:</b> পেন্ডিং (কনফার্ম করতে কাস্টমারকে কল করুন)`,
      `⏰ <i>বুকিং সময়: ${new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })} (BD Time)</i>`,
    ]
      .filter(Boolean)
      .join("\n");

    const primaryPhoto =
      booking.image && (booking.image.startsWith("http://") || booking.image.startsWith("https://"))
        ? booking.image
        : null;

    // RULE: ALWAYS SEND EXACTLY ONE SINGLE MESSAGE.
    // Send photo on top with full booking details in caption.
    if (primaryPhoto) {
      try {
        const photoRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            photo: primaryPhoto,
            caption: message,
            parse_mode: "HTML",
          }),
        });

        if (photoRes.ok) {
          console.log(
            `[Telegram] Successfully dispatched 1 unified service photo card for Booking #${booking.bookingNumber}`
          );
          return true;
        } else {
          const errText = await photoRes.text();
          console.warn("[Telegram] sendPhoto failed for service booking, falling back to 1 text message:", errText);
        }
      } catch (photoErr) {
        console.warn("[Telegram] Exception in sendPhoto for service booking, falling back to 1 text message:", photoErr);
      }
    }

    // Fallback: If no photo or photo URL unreachable, send 1 single text message only
    const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Telegram] Failed to send service booking message. HTTP ${response.status}:`, errorText);
      return false;
    }

    console.log(`[Telegram] Successfully dispatched 1 text card for Booking #${booking.bookingNumber}`);
    return true;
  } catch (error) {
    console.error("[Telegram] Unexpected error dispatching service booking notification:", error);
    return false;
  }
}

export interface TelegramPosSalePayload {
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  branchName?: string;
  counterName?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
    sku?: string;
    variantInfo?: string;
  }>;
  subtotal: number;
  discount: number;
  grandTotal: number;
  paymentMethod: string;
  paidAmount: number;
  changeAmount: number;
  dueAmount: number;
  createdAt?: string | Date;
}

export async function sendTelegramPosSaleNotification(
  posSale: TelegramPosSalePayload
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.warn(
      "[Telegram] Warning: TELEGRAM_BOT_TOKEN is missing. POS sale notification was skipped."
    );
    return false;
  }

  const chatId = await getActiveTelegramChatId(token);
  if (!chatId) {
    console.warn(
      "[Telegram] Warning: TELEGRAM_CHAT_ID is missing and could not be resolved."
    );
    return false;
  }

  try {
    const customerName = escapeHtml(posSale.customerName || "Walk-in Customer");
    const customerPhone = escapeHtml(posSale.customerPhone || "N/A");
    const branch = escapeHtml(posSale.branchName || "Gulshan-2 Flagship (Counter #01)");
    const paymentMethod = escapeHtml(posSale.paymentMethod || "Cash");

    const visibleItems = posSale.items.slice(0, 4);
    const itemsLines = visibleItems.map((item, index) => {
      const variantSuffix = item.variantInfo ? ` (${escapeHtml(item.variantInfo)})` : "";
      const itemTotal = (item.price * item.quantity).toLocaleString("en-BD");
      return `  ${index + 1}. <b>${escapeHtml(item.name)}</b>${variantSuffix}\n     ↳ ${item.quantity}x @ ৳${item.price.toLocaleString("en-BD")} = <b>৳${itemTotal}</b>`;
    });

    if (posSale.items.length > 4) {
      itemsLines.push(`  ↳ <i>... এবং আরও ${posSale.items.length - 4}টি আইটেম</i>`);
    }

    const itemsText = itemsLines.join("\n");

    const dueLine =
      posSale.dueAmount > 0
        ? `⚠️ <b>বাকি / বকেয়া টাকা (Due Balance):</b> <b>৳${posSale.dueAmount.toLocaleString("en-BD")}</b> (বকেয়া সংরক্ষিত)`
        : `✅ <b>বকেয়া:</b> কোনো বকেয়া নেই (সম্পূর্ণ পরিশোধিত)`;

    const changeLine =
      posSale.changeAmount > 0
        ? `🔄 <b>কাস্টমার ফেরত পেয়েছেন (Change Return):</b> ৳${posSale.changeAmount.toLocaleString("en-BD")}`
        : "";

    const message = [
      `🏪 <b>শোরুম ক্যাশ কাউন্টার সেল (POS Terminal Sale)!</b> [<code>#${escapeHtml(posSale.orderNumber)}</code>]`,
      `🏬 <i>গুলশান শোরুম কাউন্টারে সরাসরি পার্টস বিক্রি ও ক্যাশ মেমো প্রদান সম্পন্ন হয়েছে।</i>`,
      `━━━━━━━━━━━━━━━━━━━`,
      `🏢 <b>শোরুম ব্রাঞ্চ:</b> ${branch}`,
      `👤 <b>কাস্টমার:</b> ${customerName}`,
      customerPhone !== "N/A" ? `📞 <b>ফোন:</b> <code>${customerPhone}</code>` : "",
      `━━━━━━━━━━━━━━━━━━━`,
      `🛍️ <b>বিক্রিত পার্টস ও অ্যাকসেসরিজ:</b>`,
      itemsText,
      `━━━━━━━━━━━━━━━━━━━`,
      `💰 <b>পার্টস সাবটোটাল:</b> ৳${posSale.subtotal.toLocaleString("en-BD")}`,
      posSale.discount > 0 ? `🏷️ <b>শোরুম ডিসকাউন্ট:</b> -৳${posSale.discount.toLocaleString("en-BD")}` : "",
      `💵 <b>সর্বমোট পরিশোধযোগ্য বিল:</b> <b>৳${posSale.grandTotal.toLocaleString("en-BD")}</b>`,
      `━━━━━━━━━━━━━━━━━━━`,
      `💳 <b>পেমেন্ট মাধ্যম:</b> ${paymentMethod}`,
      `📥 <b>কাস্টমার পরিশোধ করেছেন (Paid/Received):</b> <b>৳${posSale.paidAmount.toLocaleString("en-BD")}</b>`,
      changeLine,
      dueLine,
      `━━━━━━━━━━━━━━━━━━━`,
      `✅ <b>স্ট্যাটাস:</b> শোরুম থেকে সরাসরি গ্রাহককে ডেলিভার্ড`,
      `⏰ <i>বিক্রয়ের সময়: ${new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })} (BD Time)</i>`,
    ]
      .filter(Boolean)
      .join("\n");

    const primaryPhoto = posSale.items.find(
      (i) => i.image && (i.image.startsWith("http://") || i.image.startsWith("https://"))
    )?.image;

    // RULE: ALWAYS SEND EXACTLY ONE SINGLE MESSAGE.
    if (primaryPhoto) {
      try {
        const photoRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            photo: primaryPhoto,
            caption: message,
            parse_mode: "HTML",
          }),
        });

        if (photoRes.ok) {
          console.log(
            `[Telegram] Successfully dispatched 1 unified POS sale photo card #${posSale.orderNumber}`
          );
          return true;
        } else {
          const errText = await photoRes.text();
          console.warn("[Telegram] sendPhoto failed for POS sale, fallback to text:", errText);
        }
      } catch (e) {
        console.warn("[Telegram] Exception in sendPhoto for POS sale:", e);
      }
    }

    const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Telegram] Failed to send POS sale notification:`, errText);
      return false;
    }

    console.log(`[Telegram] Successfully dispatched 1 text card for POS Sale #${posSale.orderNumber}`);
    return true;
  } catch (err) {
    console.error("[Telegram] Error dispatching POS sale notification:", err);
    return false;
  }
}



