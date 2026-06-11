import axios from 'axios';
import { JuejinResponse, SortType } from './types';

const BASE_URL = 'https://api.juejin.cn/recommend_api/v1/article/recommend_all_feed';

const SORT_MAP: Record<SortType, number> = {
  hot: 200,      // 热门
  new: 300,      // 最新
  recommend: 0,  // 推荐
};

export async function fetchArticles(
  sort: SortType = 'hot',
  limit: number = 20,
  cursor: string = '0'
): Promise<JuejinResponse> {
  const response = await axios.post<JuejinResponse>(
    `${BASE_URL}?aid=2608&spider=0`,
    {
      id_type: 2,
      client_type: 2608,
      sort_type: SORT_MAP[sort] || 200,
      cursor,
      limit,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      timeout: 10000,
    }
  );

  return response.data;
}
