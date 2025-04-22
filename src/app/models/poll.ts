export interface UserDto {
  id: string;
  name: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdById: string;
  createdByName: string;
  createdByPhoto: string;
  voterIds: string[];
}
