// src/app/api/meeting-room/[id]/route.ts
import { NextResponse } from "next/server";
import { MeetingRoomService } from "@/services/MeetingRoomService";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const data = await MeetingRoomService.getById(params.id);
  return NextResponse.json(data);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  await MeetingRoomService.update(params.id, body);
  return NextResponse.json({ success: true });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await MeetingRoomService.delete(params.id);
  return NextResponse.json({ success: true });
}
