export interface ArticleInfo {
  article_id: string;
  title: string;
  brief_content: string;
  view_count: number;
  digg_count: number;
  comment_count: number;
  ctime: string;
  read_time?: string;
}

export interface AuthorInfo {
  user_id: string;
  user_name: string;
  company?: string;
  job_title?: string;
}

export interface ArticleItem {
  item_type: number;
  item_info: {
    article_id: string;
    article_info: ArticleInfo;
    author_user_info: AuthorInfo;
    tags?: Array<{ tag_name: string }>;
  };
}

export interface JuejinResponse {
  err_no: number;
  err_msg: string;
  data: ArticleItem[];
  cursor?: string;
  has_more?: boolean;
  count?: number;
}

export type SortType = 'hot' | 'new' | 'recommend';
