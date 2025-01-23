import { del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const config = {
  runtime: "edge",
};

export default async function deleteFiles(request: NextRequest) {
  try {
    const cleanPathname = request.nextUrl.searchParams
      .get("file")
      .replace(/^https:\/\/[a-zA-Z0-9._-]+$/g, "_");

    await del(cleanPathname);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: (error as Error).message, status: 400 });
  }

  // return a success response
  return NextResponse.json({ success: true, status: 200 });
}
