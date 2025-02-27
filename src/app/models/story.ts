export interface Story {
   
        id : string,
        name: string,
        picture: {
            url: string;
            type: number;
            thumbnailUrl?: string | null;
        };
        isDeleted: boolean;
        bio: string,
        followersCount: number
    
    
    
}
