import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2-config";

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();

    // Validate input
    if (!key) {
      return NextResponse.json({ error: "Image key is required" }, { status: 400 });
    }

    // Delete the object from R2
    const deleteCommand = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key
    });

    await r2Client.send(deleteCommand);

    return NextResponse.json({ 
      success: true,
      message: "Image deleted successfully"
    }, { status: 200 });
  } catch (error) {
    console.error("Error deleting image from R2:", error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
