import { NextRequest, NextResponse } from "next/server";
import { uploadImageToR2 } from "@/lib/r2-upload";

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

    // Convert the file to buffer
    const arrayBuffer = await image.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Detect mime type
    const mimeType = image.type || 'image/png';

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
