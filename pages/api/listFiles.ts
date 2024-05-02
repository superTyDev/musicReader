import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export const config = {
    runtime: "edge",
};

export default async function blobs(request: Request) {
    const { blobs } = await list();
    // console.log(blobs);
    return NextResponse.json(blobs);
}
