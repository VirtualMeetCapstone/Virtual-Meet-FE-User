export interface Notification {
  id: string;
  userId: string;
  type: number;
  content: string;
  actionType: number;
  source: {
    id: string;
    type: number;
  };
  actor: {
    id: string;
    name: string;
    picture: {
      url: string;
      type: number;
      thumbnailUrl?: string | null;
    };
  };
  metadata?: any;
  isRead: boolean;
  expireTime: number;
  createTime: number;
}
