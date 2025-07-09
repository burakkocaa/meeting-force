// src/app/api/meeting-room/route.ts
import { NextResponse } from "next/server";
import { MeetingRoomService } from "@/services/MeetingRoomService";

export async function GET() {
  const data = await MeetingRoomService.getAll();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  await MeetingRoomService.create(body);
  return NextResponse.json({ success: true });
}
