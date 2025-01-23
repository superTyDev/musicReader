import { list } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const config = {
  runtime: "edge",
};

export default async function blobs(request: NextRequest) {
  console.log(request.nextUrl.searchParams.get("username"));
  const cleanUsername = request.nextUrl.searchParams
    .get("username")
    .replace(/[^a-z]/g, "");
  const { blobs } = await list({ mode: "folded", prefix: cleanUsername + "/" });
  return NextResponse.json(blobs);
}
