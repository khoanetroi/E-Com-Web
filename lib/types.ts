export interface Profile {
    id: string;
    updated_at: string | null;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    website: string | null;
    email: string | null;
    role: 'user' | 'admin' | 'moderator';
}

export interface News {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string | null;
    thumbnail: string | null;
    author_id: string | null;
    is_published: boolean;
    published_at: string | null;
    created_at: string;
    updated_at: string;
}
