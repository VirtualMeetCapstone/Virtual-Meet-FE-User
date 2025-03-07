export interface Viewer {
  id: string;
  name: string;
  picture: {
    url: string;
    type: number;
    thumbnailUrl: string | null;
  };
  createTime: number;
}
