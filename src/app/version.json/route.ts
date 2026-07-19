import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      version: "1.0.0",
      buildTime: 1783687154157,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        "Pragma": "no-cache",
      },
    }
  );
}
