export interface Room {
  id: string;
  ownerId: string;
  owner: {
    name: string;
    picture: {
      url: string;
      type: number;
      thumbnailUrl: string | null;
    };
  };
  topic: string;
  description: string;
  maximumMembers: number;
  medias: {
    url: string;
    type: number;
    thumbnailUrl: string;
  }[];
  status: any; // Nếu có kiểu dữ liệu cụ thể, hãy thay thế 'any'
  taggedUserId: string[];
  hashTags: string[];
  members: any[]; // Nếu có cấu trúc cụ thể, hãy thay đổi kiểu dữ liệu
  createTime: number;
  lastModifyTime: number;
}
