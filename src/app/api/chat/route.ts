import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Product } from "@/models";
import { products as fallbackProducts } from "@/data/products";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Admin & Showroom Official Contact
const SHOWROOM_WHATSAPP = "+880 1957-060531";
const SHOWROOM_WHATSAPP_CLEAN = "8801957060531";

interface MatchedProductSummary {
  name: string;
  brand: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  category: string;
  subcategory?: string;
  slug: string;
  description?: string;
}

async function searchLiveInventory(queryText: string): Promise<MatchedProductSummary[]> {
  const clean = queryText.trim().toLowerCase();
  if (!clean || clean.length < 2) return [];

  // Stop words to strip out for cleaner token matching
  const stopWords = new Set([
    "ki", "koto", "dam", "price", "ache", "naki", "er", "how", "much", "the", "for",
    "please", "bhai", "vai", "apnader", "apnaderkase", "apnaderkache", "moto", "motoplex",
    "bike", "bikers", "bhaiya", "hello", "hi", "hey", "a", "an", "is", "of", "in", "to", "what",
    "lagbe", "chai", "dorkar", "available", "stock", "details", "info", "specification"
  ]);

  const tokens = clean
    .replace(/[^\w\s-]/gi, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !stopWords.has(t));

  const matched: MatchedProductSummary[] = [];
  const seenSlugs = new Set<string>();

  try {
    await connectDB();

    // 1. Exact phrase or partial phrase match
    const phrasePattern = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const phraseRegex = new RegExp(phrasePattern, "i");

    const directMatches = await Product.find({
      $or: [
        { name: phraseRegex },
        { brand: phraseRegex },
        { sku: phraseRegex },
        { productType: phraseRegex },
        { categorySlug: phraseRegex },
        { subcategorySlug: phraseRegex },
      ],
    })
      .limit(8)
      .lean();

    for (const p of directMatches as any[]) {
      if (!seenSlugs.has(p.slug)) {
        seenSlugs.add(p.slug);
        matched.push({
          name: p.name,
          brand: p.brand,
          sku: p.sku,
          price: Number(p.price || 0),
          compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
          stock: Number(p.stock || 0),
          category: p.categorySlug || "Parts",
          subcategory: p.subcategorySlug,
          slug: p.slug,
          description: p.description?.slice(0, 140),
        });
      }
    }

    // 2. Token-based search if few results
    if (matched.length < 6 && tokens.length > 0) {
      const tokenRegexes = tokens.map((t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
      const tokenMatches = await Product.find({
        $or: [
          { name: { $in: tokenRegexes } },
          { brand: { $in: tokenRegexes } },
          { sku: { $in: tokenRegexes } },
          { productType: { $in: tokenRegexes } },
        ],
      })
        .limit(8 - matched.length)
        .lean();

      for (const p of tokenMatches as any[]) {
        if (!seenSlugs.has(p.slug)) {
          seenSlugs.add(p.slug);
          matched.push({
            name: p.name,
            brand: p.brand,
            sku: p.sku,
            price: Number(p.price || 0),
            compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
            stock: Number(p.stock || 0),
            category: p.categorySlug || "Parts",
            subcategory: p.subcategorySlug,
            slug: p.slug,
            description: p.description?.slice(0, 140),
          });
        }
      }
    }
  } catch (err) {
    console.warn("[Chat API] MongoDB query error:", err);
  }

  // 3. Fallback to local catalog if DB returned nothing or error
  if (matched.length === 0) {
    for (const p of fallbackProducts) {
      const combined = `${p.name} ${p.brand} ${p.sku} ${p.category} ${p.productType || ""} ${p.description || ""}`.toLowerCase();
      if (combined.includes(clean) || tokens.some((t) => combined.includes(t))) {
        if (!seenSlugs.has(p.slug)) {
          seenSlugs.add(p.slug);
          matched.push({
            name: p.name,
            brand: p.brand,
            sku: p.sku,
            price: p.price,
            compareAtPrice: p.compareAtPrice,
            stock: p.stock,
            category: p.categorySlug,
            subcategory: p.subcategorySlug,
            slug: p.slug,
            description: p.description?.slice(0, 140),
          });
        }
        if (matched.length >= 6) break;
      }
    }
  }

  return matched;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userMessages = Array.isArray(body.messages) ? body.messages : [];
    const latestUserMessage = userMessages[userMessages.length - 1]?.content || "";

    // 1. Search Live Inventory for relevant products based on user inquiry
    const matchedProducts = await searchLiveInventory(String(latestUserMessage));

    let inventoryContext = "";
    if (matchedProducts.length > 0) {
      inventoryContext = `\n\n[LIVE MOTOPLEX INVENTORY MATCHES (REAL-TIME DATABASE)]:\n` +
        matchedProducts
          .map(
            (p, idx) =>
              `${idx + 1}. **${p.name}**\n` +
              `   - Brand: ${p.brand}\n` +
              `   - SKU: ${p.sku}\n` +
              `   - Official Price: ৳${p.price.toLocaleString("en-BD")} BDT${p.compareAtPrice ? ` (Original: ৳${p.compareAtPrice.toLocaleString("en-BD")})` : ""}\n` +
              `   - Stock Status: ${p.stock > 0 ? `In Stock (${p.stock} units available)` : "Out of Stock (Pre-order Available)"}\n` +
              `   - Category: ${p.category}${p.subcategory ? ` > ${p.subcategory}` : ""}\n` +
              `   - Direct Store Link: /product/${p.slug}\n` +
              (p.description ? `   - Info: ${p.description}\n` : "")
          )
          .join("\n");
    }

    const dynamicSystemPrompt = `You are "Motoplex Concierge", the official VIP AI Sales Specialist and Senior Technical Advisor for Motoplex Bangladesh Performance Division.
You possess MAXIMUM intelligence, precision, and deep mechanical expertise regarding high-performance motorcycle racing parts, European motorcycle maintenance, and genuine aftermarket performance modifications in Bangladesh.

--- OFFICIAL SHOWROOM & ADMIN CREDENTIALS ---
• Flagship Showroom: Mirpur 60 Feet (Opposite of Paka Masjid), Dhaka, Bangladesh.
• Official Admin & Showroom WhatsApp Hotline: ${SHOWROOM_WHATSAPP} (01957-060531)
• Direct WhatsApp Chat Link: https://wa.me/${SHOWROOM_WHATSAPP_CLEAN}
• Operating Hours: Saturday to Thursday: 10:00 AM - 8:30 PM (Friday: 2:30 PM - 8:30 PM).

--- OFFICIAL NATIONWIDE COURIER & DELIVERY SYSTEM ---
• Delivery Partner: Pathao Express Courier nationwide.
• Inside Dhaka Delivery Charge: ৳80 (Takes 24-48 hours).
• Outside Dhaka (All 64 districts in Bangladesh): ৳130 (Takes 48-72 hours).
• Payment Policy: Courier delivery charge is collected in advance via bKash Agent Cash Out (01879388902) or Bank Transfer (DBBL, City Bank, BRAC Bank). The remaining full product value is paid Cash on Delivery (COD) upon unboxing and inspecting the parcel.

--- OFFICIAL WORKSHOP SERVICES & PERFORMANCE PACKAGES ---
• Bike Master Service (Starting ৳4,500): 10-checkpoint comprehensive overhaul including 52-point chassis inspection, ultrasonic fuel injector & throttle body de-carbonizing, valve clearance check & shim adjustment, front & rear Motul DOT 5.1 hydraulic brake bleed, ultrasonic drive chain degrease & wax, ECU OBD diagnostic scan & fault code erase, high-pressure foam wash.
• Desmo Valve & Shim Adjustment: Starting ৳3,200.
• Ultrasonic Throttle Body & Injector Service: Starting ৳1,800.
• Booking link: /services or direct booking through Admin WhatsApp (${SHOWROOM_WHATSAPP}).

--- STRICT TRUTH & ACCURACY RULES (CRITICAL) ---
1. ABSOLUTE TRUTH ON PRICES & SPECS: Only quote prices in Bangladeshi Taka (৳ BDT). NEVER quote Indian rupees, USD, or mention Amazon/Flipkart. All products are authentic imported parts available in Bangladesh.
2. USE THE INJECTED LIVE INVENTORY: If the user asks about any product, price, or fitment, check the [LIVE MOTOPLEX INVENTORY MATCHES] provided below. Quote the EXACT product name, brand, SKU, official price in ৳ BDT, stock status, and direct store link: \`[View Product](/product/slug)\`.
3. IF A PRODUCT IS NOT FOUND OR OUT OF STOCK: Explain honestly and politely that Motoplex is the official authorized importer. If an item is not in the live list, invite the customer to pre-order or custom-source it directly through the Admin WhatsApp at **${SHOWROOM_WHATSAPP}**.
4. LANGUAGE & TONE:
   - If the user asks in Bengali (বাংলা) or Banglish, respond in natural, warm, polite, and authoritative Bengali.
   - If the user asks in English, respond in sleek, professional, high-performance English.
   - Always be helpful, respectful, and crystal clear so the rider is 100% satisfied and never confused.
5. ALWAYS PROVIDE THE ADMIN WHATSAPP: Whenever assisting with pricing, orders, fitment confirmation, or stock inquiries, remind the rider they can reach the Showroom Admin directly on WhatsApp at **${SHOWROOM_WHATSAPP}** for immediate dispatch confirmation.${inventoryContext}`;

    if (!GROQ_API_KEY) {
      const fallbackReply = matchedProducts.length > 0
        ? `ধন্যবাদ মোটোপ্লেক্স বাংলাদেশে যোগাযোগ করার জন্য! আমাদের কাছে **${matchedProducts[0].name}** (SKU: ${matchedProducts[0].sku}) স্টক এভেইলেবল রয়েছে। মূল্য: **৳${matchedProducts[0].price.toLocaleString("en-BD")} টাকা**। বিস্তারিত জানতে বা অর্ডার করতে শোরুম এডমিন হোয়াটসঅ্যাপে যোগাযোগ করুন: **${SHOWROOM_WHATSAPP}**।`
        : `ধন্যবাদ মোটোপ্লেক্স বাংলাদেশে যোগাযোগ করার জন্য! আমাদের গুলশান-২ শোরুম ও এডমিন হোয়াটসঅ্যাপ সরাসরি খোলা রয়েছে: **${SHOWROOM_WHATSAPP}**। আপনার বাইকের জন্য কোন পার্টসটি প্রয়োজন আমাদের জানান!`;
      return NextResponse.json({ success: true, reply: fallbackReply });
    }

    const messages = [
      { role: "system", content: dynamicSystemPrompt },
      ...userMessages.slice(-6).map((m: { role: string; content: string }) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: String(m.content || ""),
      })),
    ];

    // Models available on this Groq account
    const modelsToTry = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"];
    let replyText = "";

    for (const model of modelsToTry) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.5,
            max_tokens: 1024,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          replyText = data.choices?.[0]?.message?.content?.trim() || "";
          if (replyText) break;
        } else {
          const errBody = await response.text();
          console.warn(`[Groq AI] Model ${model} returned ${response.status}:`, errBody);
        }
      } catch (err) {
        console.warn(`[Groq AI] Model ${model} attempt failed, trying next...`, err);
      }
    }

    if (!replyText) {
      if (matchedProducts.length > 0) {
        replyText = `আমাদের মোটোপ্লেক্স বাংলাদেশ শোরুমে আপনার রিকোয়েস্টকৃত **${matchedProducts[0].name}** (${matchedProducts[0].brand}) এভেইলেবল রয়েছে!\n\n` +
          `• **অফিসিয়াল মূল্য:** ৳${matchedProducts[0].price.toLocaleString("en-BD")} BDT\n` +
          `• **স্টক:** ${matchedProducts[0].stock > 0 ? `In Stock (${matchedProducts[0].stock} units)` : "Pre-order Available"}\n` +
          `• **প্রোডাক্ট পেজ:** [View Product](/product/${matchedProducts[0].slug})\n\n` +
          `সরাসরি বুকিং বা দ্রুত পাঠাও ক্যাশ অন ডেলিভারিতে অর্ডারের জন্য আমাদের শোরুম এডমিন হোয়াটসঅ্যাপে যোগাযোগ করুন: **${SHOWROOM_WHATSAPP}**।`;
      } else {
        replyText =
          `ধন্যবাদ মোটোপ্লেক্স বাংলাদেশে যোগাযোগ করার জন্য! আমাদের গুলশান-২ ফ্ল্যাগশিপ শোরুম টিম ও এডমিন হোয়াটসঅ্যাপ সরাসরি সক্রিয় রয়েছে: **${SHOWROOM_WHATSAPP}**। আপনার কাঙ্ক্ষিত পার্টস বা সার্ভিসের নাম লিখে জানালে আমরা তাৎক্ষণিক সঠিক তথ্য ও মূল্য জানিয়ে দেব।`;
      }
    }

    return NextResponse.json({
      success: true,
      reply: replyText,
    });
  } catch (error) {
    console.error("[API/chat] Error:", error);
    return NextResponse.json({
      success: false,
      reply: `আপাতত সিস্টেমে সাময়িক সংযোগ সমস্যা হচ্ছে। সরাসরি আমাদের শোরুম এডমিন হোয়াটসঅ্যাপে মেসেজ দিন: **${SHOWROOM_WHATSAPP}**। আমরা অবিলম্বে রিপ্লাই দিচ্ছি!`,
    });
  }
}
