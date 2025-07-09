import { prisma } from "@/lib/prisma";
import { MeetingRoom } from "@prisma/client";

export const MeetingRoomRepository = {
  async fetchAll(): Promise<MeetingRoom[]> {
    return await prisma.meetingRoom.findMany({ orderBy: { name: "asc" } });
  },

  async fetchById(id: string): Promise<MeetingRoom | null> {
    return await prisma.meetingRoom.findUnique({
      where: { id },
    });
  },

  async create(data: MeetingRoom): Promise<void> {
    await prisma.meetingRoom.create({
      data,
    });
  },

  async update(id: string, data: MeetingRoom): Promise<void> {
    await prisma.meetingRoom.update({
      where: { id },
      data,
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.meetingRoom.delete({
      where: { id },
    });
  },
};
