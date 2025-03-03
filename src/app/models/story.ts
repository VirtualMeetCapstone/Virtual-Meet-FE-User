export interface Story {
  id: string;
  content?: string | null;
  userId: string;
  user: {
    name: string;
    picture: {
      url: string;
      type: number;
      thumbnailUrl?: string | null;
    };
  };
  media?: {
    url: string;
    type: number;
    thumbnailUrl?: string | null;
  };
  textContent?: string | null;
  musicUrl?: string | null;
  expireTime: number;
  isActive: boolean;
  createTime: number;
  lastModifyTime: number;
}
