export class MeetingRoom {
  id: string;
  name: string;
  location: string;
  capacity: number;

  constructor(id: string, name: string, location: string, capacity: number) {
    this.id = id;
    this.name = name;
    this.location = location;
    this.capacity = capacity;
  }
}
