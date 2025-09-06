import { NextRequest, NextResponse } from "next/server";
import { uploadImageToR2 } from "@/lib/r2-upload";
import { isHeicImage, convertHeicImage } from "@/lib/image-utils";

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export async function POST(req: NextRequest) {
  try {
    // Since FormData is used, we need to parse it differently
    const formData = await req.formData();
    const image = formData.get('image') as File;
    const userId = formData.get('userId') as string;
    const promptValue = formData.get('prompt');
    const prompt = promptValue ? String(promptValue) : 'Uploaded image';

    if (!image || !userId) {
      return NextResponse.json({ error: "Image and userId are required." }, { status: 400 });
    }

    // Check file size
    if (image.size > MAX_FILE_SIZE) {
      console.error("File too large:", image.size, "bytes. Max size is", MAX_FILE_SIZE, "bytes");
      return NextResponse.json({ 
        error: `Image file is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` 
      }, { status: 400 });
    }

    // Convert the file to buffer
    const arrayBuffer = await image.arrayBuffer();
    let imageBuffer = Buffer.from(arrayBuffer);

    // Detect mime type
    let mimeType = image.type || 'image/png';
    
    // Handle HEIC images - convert to JPEG
    const isHeic = mimeType.toLowerCase().includes('heic') || 
                  mimeType.toLowerCase().includes('heif') || 
                  isHeicImage(imageBuffer);
    
    if (isHeic) {
      try {
        console.log("Converting HEIC image to JPEG...");
        const converted = await convertHeicImage(imageBuffer, 'jpeg', 90);
        imageBuffer = Buffer.from(converted.buffer);
        mimeType = converted.mimeType;
        console.log("HEIC conversion successful");
      } catch (conversionError: any) {
        console.error("HEIC conversion failed:", conversionError);
        return NextResponse.json({ 
          error: "Failed to process HEIC image. Please try with a JPEG or PNG image instead.",
          details: conversionError.message 
        }, { status: 400 });
      }
    }

    // Upload to R2
    const uploadResult = await uploadImageToR2({
      imageBuffer,
      category: "edit-image", // Using "edit-image" category for uploaded images
      prompt,
      mimeType,
      userId,
    });

    return NextResponse.json({
      success: true,
      publicUrl: uploadResult.publicUrl,
      signedUrl: uploadResult.url,
      key: uploadResult.key
    });
  } catch (err: any) {
    console.error("Error uploading image:", err);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
