interface MediaPreview {
  type: 'image' | 'video';
  url: string | ArrayBuffer | null;
}
