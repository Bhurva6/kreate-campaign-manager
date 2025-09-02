import { NextRequest, NextResponse } from "next/server";
import { fetchUserImages } from "@/lib/r2-upload";
import { auth } from "@/lib/firebase";

export async function GET(req: NextRequest) {
  try {
    // Get userId from request header or query parameter
    const userId = req.headers.get("x-user-id") || req.nextUrl.searchParams.get("userId");

    // Validate user ID
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Fetch images for this user
    const images = await fetchUserImages(userId);

    // Extract type counts for the response
    const generatedCount = images.filter(img => img.metadata?.type === 'generated').length;
    const editedCount = images.filter(img => img.metadata?.type === 'edited').length;

    return NextResponse.json({ 
      images,
      count: images.length,
      generatedCount,
      editedCount
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user images:", error);
    return NextResponse.json({ error: "Failed to fetch user images" }, { status: 500 });
  }
}
