import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB Limit

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No image file provided." },
        { status: 400 }
      );
    }

    // Strict 25MB size enforcement
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: `File size exceeds 25MB limit. (Selected: ${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Invalid image format. Allowed: JPG, PNG, WEBP, GIF, SVG." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // If Cloudinary credentials are configured in .env.local, upload to Cloudinary
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (cloudName) {
      try {
        const { uploadToCloudinary } = await import("@/lib/cloudinary");
        const base64Data = `data:${file.type};base64,${buffer.toString("base64")}`;
        const cResult = await uploadToCloudinary(base64Data);
        if (cResult?.secure_url) {
          return NextResponse.json({
            success: true,
            url: cResult.secure_url,
            size: file.size,
            name: file.name,
            provider: "cloudinary",
          });
        }
      } catch (cErr) {
        console.warn("[Upload API] Cloudinary upload failed, falling back to local storage:", cErr);
      }
    }

    // Fast, reliable local file storage in public/uploads
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${Date.now()}-${safeName}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueFileName}`;
    return NextResponse.json({
      success: true,
      url: publicUrl,
      size: file.size,
      name: file.name,
      provider: "local",
    });
  } catch (error) {
    console.error("[Upload API Error]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload image. Please try again." },
      { status: 500 }
    );
  }
}

