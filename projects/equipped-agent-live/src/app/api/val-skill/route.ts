import { NextRequest, NextResponse } from "next/server";
import { VAL_SKILL_DIR, VAL_SKILL_NAME, valSkillMarkdown } from "@/lib/val-skill";
import { zipOne } from "@/lib/zip";

export function GET(req: NextRequest) {
  const name = (req.nextUrl.searchParams.get("name") ?? "").slice(0, 80);
  const zip = zipOne(`${VAL_SKILL_DIR}/SKILL.md`, valSkillMarkdown(name));
  return new NextResponse(zip as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${VAL_SKILL_NAME}.zip"`,
      "Content-Length": String(zip.length),
      "Cache-Control": "no-store",
    },
  });
}
