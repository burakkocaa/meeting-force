import { MeetingRoomRepository } from "@/repositories/MeetingRoomRepository";
import { MeetingRoom } from "@/models/MeetingRoom";

export const MeetingRoomService = {
  async getAll(): Promise<MeetingRoom[]> {
    return await MeetingRoomRepository.fetchAll();
  },
  async getById(id: string): Promise<MeetingRoom> {
    return await MeetingRoomRepository.fetchById(id);
  },
  async create(data: MeetingRoom): Promise<void> {
    return await MeetingRoomRepository.create(data);
  },
  async update(id: string, data: MeetingRoom): Promise<void> {
    return await MeetingRoomRepository.update(id, data);
  },
  async delete(id: string): Promise<void> {
    return await MeetingRoomRepository.delete(id);
  },
};
