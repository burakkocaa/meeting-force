export class Meet {
  id: string;
  title: string;
  description: string;
  date: Date;
  roomId: string;

  constructor(
    id: string,
    title: string,
    description: string,
    date: Date,
    roomId: string
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.date = date;
    this.roomId = roomId;
  }
}
