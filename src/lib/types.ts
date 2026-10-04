export type Value =
  | string
  | number
  | boolean
  | null
  | undefined
  | Value[]
  | { [key: string]: Value };
export interface Entity {
  id: number;
  [key: string]: Value;
}
export interface Media {
  id: number;
  url: string;
  mime_type: string;
  alt?: string;
}
export interface User {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "relations_manager" | "editor";
  is_active: boolean;
}
export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  last_page: number;
}
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
}
export interface Menu extends Entity {
  title: string;
  url: string | null;
  children: Menu[];
  open_new_tab: boolean;
}
export interface SiteSettings {
  logo_media_id?: number | null;
  favicon_media_id?: number | null;
  site_name?: string;
  site_description?: string;
  site_phone?: string;
  site_email?: string;
  site_address?: string;
  office_hours?: string;
  announcement_ticker?: string;
  copyright?: string;
}
export interface NewsSection {
  type: string;
  title: string;
  archive_path: string;
  items: Entity[];
}
export interface HomeData {
  slides: Entity[];
  featured_posts: Entity[];
  sections: NewsSection[];
  events: Entity[];
  albums: Entity[];
  systems: Entity[];
  board_members: Entity[];
}
export type SearchParams = Record<string, string | string[] | undefined>;
