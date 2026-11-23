/**
 * Motoplex BD - Cloudinary Media & Optimization Service
 * Free Forever Tier image management & automatic WebP/AVIF delivery.
 */
import crypto from "crypto";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
const API_KEY = process.env.CLOUDINARY_API_KEY || "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Returns an optimized Cloudinary delivery URL with auto-compression (q_auto) and WebP/AVIF format (f_auto).
 */
export function getOptimizedImageUrl(
  urlOrPublicId: string,
  options?: { width?: number; height?: number; crop?: "fill" | "fit" | "scale" }
): string {
  if (!urlOrPublicId) return "";

  // If already a full Cloudinary URL, inject transformations
  if (urlOrPublicId.includes("res.cloudinary.com")) {
    const transformations = ["f_auto", "q_auto"];
    if (options?.width) transformations.push(`w_${options.width}`);
    if (options?.height) transformations.push(`h_${options.height}`);
    if (options?.crop) transformations.push(`c_${options.crop}`);

    const transformStr = transformations.join(",");
    return urlOrPublicId.replace("/upload/", `/upload/${transformStr}/`);
  }

  // If it's a raw public ID and CLOUD_NAME is available
  if (CLOUD_NAME && !urlOrPublicId.startsWith("http")) {
    const transformations = ["f_auto", "q_auto"];
    if (options?.width) transformations.push(`w_${options.width}`);
    if (options?.height) transformations.push(`h_${options.height}`);
    if (options?.crop) transformations.push(`c_${options.crop}`);

    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformations.join(",")}/${urlOrPublicId}`;
  }

  return urlOrPublicId;
}

/**
 * Server-side direct image upload to Cloudinary.
 * Accepts Base64 data URI, remote image URL, or binary buffer string.
 */
export async function uploadToCloudinary(
  fileData: string,
  folder: string = "motoplex-parts"
): Promise<CloudinaryUploadResponse> {
  if (!CLOUD_NAME) {
    throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not configured.");
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const formData = new URLSearchParams();
  formData.append("file", fileData);
  formData.append("folder", folder);
  formData.append("timestamp", timestamp.toString());

  // Signed upload with API Secret if available
  if (API_KEY && API_SECRET) {
    formData.append("api_key", API_KEY);
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
    const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");
    formData.append("signature", signature);
  } else if (UPLOAD_PRESET) {
    // Unsigned preset upload
    formData.append("upload_preset", UPLOAD_PRESET);
  } else {
    throw new Error("Either CLOUDINARY_API_KEY/SECRET or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is required.");
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
    format: result.format,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  };
}

