import { client } from "@/sanity/lib/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { postId, clapsToAdd = 1 } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    }

    // We need a client configured with a token to perform mutations
    // Since we don't want to expose the token, we configure a new client here
    const writeClient = client.withConfig({
      token: process.env.SANITY_API_TOKEN,
      useCdn: false, // Must be false for mutations
    });

    // Check if token exists
    if (!process.env.SANITY_API_TOKEN) {
        console.warn("SANITY_API_TOKEN is not set. Mutations will fail if the dataset is not public.");
    }

    // Perform the mutation to increment claps
    const result = await writeClient
      .patch(postId)
      .setIfMissing({ claps: 0 })
      .inc({ claps: clapsToAdd })
      .commit();

    return NextResponse.json({ success: true, claps: result.claps });
  } catch (error: any) {
    console.error("Failed to update claps:", error);
    return NextResponse.json(
      { error: "Failed to update claps", details: error.message },
      { status: 500 }
    );
  }
}
