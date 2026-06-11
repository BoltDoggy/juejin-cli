#!/usr/bin/env node

import { Command } from 'commander';
import { marked } from 'marked';
import { markedTerminal } from 'marked-terminal';
import { fetchArticles } from './api';
import { displayArticles, displayArticleDetail, displayHelp } from './display';
import { isAvailable as isLightpandaAvailable, fetchArticle as fetchWithLightpanda } from './lightpanda';
import { ArticleItem } from './types';

marked.use(markedTerminal());

const program = new Command();

program
  .name('juejin')
  .description('掘金文章列表浏览 CLI')
  .version('1.0.0');

program
  .command('list')
  .description('浏览掘金文章列表')
  .option('-s, --sort <type>', '排序方式: hot(热门)|new(最新)', 'hot')
  .option('-l, --limit <number>', '每页数量', '20')
  .option('-i, --interactive', '交互模式（支持翻页和查看详情）', true)
  .option('--no-interactive', '禁用交互模式')
  .action(async (options) => {
    const sort = options.sort as 'hot' | 'new';
    const limit = parseInt(options.limit, 10) || 20;

    try {
      const [result, lightpandaAvailable] = await Promise.all([
        fetchArticles(sort, limit),
        isLightpandaAvailable(),
      ]);
      if (result.err_no !== 0) {
        console.error('请求失败:', result.err_msg);
        process.exit(1);
      }

      const articles = result.data.filter((item) => item.item_type === 2);
      displayArticles(articles);

      if (options.interactive) {
        await runInteractive(articles, sort, limit, result.cursor || '0', lightpandaAvailable);
      }
    } catch (error) {
      console.error('请求出错:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('hot')
  .description('查看热门文章')
  .option('-l, --limit <number>', '数量', '20')
  .action(async (options) => {
    const limit = parseInt(options.limit, 10) || 20;
    try {
      const result = await fetchArticles('hot', limit);
      if (result.err_no !== 0) {
        console.error('请求失败:', result.err_msg);
        process.exit(1);
      }
      displayArticles(result.data.filter((item) => item.item_type === 2));
    } catch (error) {
      console.error('请求出错:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('new')
  .description('查看最新文章')
  .option('-l, --limit <number>', '数量', '20')
  .action(async (options) => {
    const limit = parseInt(options.limit, 10) || 20;
    try {
      const result = await fetchArticles('new', limit);
      if (result.err_no !== 0) {
        console.error('请求失败:', result.err_msg);
        process.exit(1);
      }
      displayArticles(result.data.filter((item) => item.item_type === 2));
    } catch (error) {
      console.error('请求出错:', (error as Error).message);
      process.exit(1);
    }
  });

// 交互模式
async function runInteractive(
  currentArticles: ArticleItem[],
  sort: 'hot' | 'new',
  limit: number,
  nextCursor: string,
  lightpandaAvailable: boolean
): Promise<void> {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let articles = currentArticles;
  let page = 1;
  let selectedIndex = 0; // 当前选中的文章索引（0-based），用于 lightpanda 打开
  // 每一页的起始 cursor，pageCursors[i] 对应第 i+1 页
  const pageCursors: string[] = ['0'];
  // 每一页请求后返回的下一页 cursor
  const nextCursors: string[] = [nextCursor];

  let closed = false;
  const safeClose = () => {
    if (!closed) {
      closed = true;
      rl.close();
    }
    process.exit(0);
  };

  rl.on('close', () => {
    closed = true;
  });

  const loadPage = async (targetPage: number): Promise<boolean> => {
    if (targetPage <= 0) {
      console.log('已经是第一页了');
      return false;
    }

    // 如果目标页已经缓存过 next cursor，说明之前访问过
    if (targetPage <= pageCursors.length) {
      try {
        const result = await fetchArticles(sort, limit, pageCursors[targetPage - 1]);
        articles = result.data.filter((item) => item.item_type === 2);
        page = targetPage;
        displayArticles(articles, (page - 1) * limit + 1);
        return true;
      } catch (error) {
        console.error('加载失败:', (error as Error).message);
        return false;
      }
    }

    // 需要加载新页面
    const lastPage = pageCursors.length;
    if (targetPage !== lastPage + 1) {
      console.log('无法直接跳转到该页面');
      return false;
    }

    try {
      const startCursor = nextCursors[lastPage - 1];
      const result = await fetchArticles(sort, limit, startCursor);
      if (result.data.length === 0) {
        console.log('没有更多文章了');
        return false;
      }
      pageCursors.push(startCursor);
      nextCursors.push(result.cursor || startCursor);
      articles = result.data.filter((item) => item.item_type === 2);
      page = targetPage;
      displayArticles(articles, (page - 1) * limit + 1);
      return true;
    } catch (error) {
      console.error('加载失败:', (error as Error).message);
      return false;
    }
  };

  displayHelp(lightpandaAvailable);

  const ask = () => {
    if (closed) return;
    rl.question('> ', async (input) => {
      if (closed) return;
      const cmd = input.trim().toLowerCase();

      if (cmd === 'q' || cmd === 'quit' || cmd === 'exit') {
        safeClose();
        return;
      }

      if (cmd === 'h' || cmd === 'help') {
        displayHelp(lightpandaAvailable);
        ask();
        return;
      }

      if (cmd === 'n' || cmd === 'next') {
        await loadPage(page + 1);
        ask();
        return;
      }

      if (cmd === 'p' || cmd === 'prev' || cmd === 'previous') {
        await loadPage(page - 1);
        ask();
        return;
      }

      if (lightpandaAvailable && cmd === 'o') {
        if (selectedIndex <= 0 || selectedIndex > articles.length) {
          console.log('请先输入文章编号查看详情（如: 1）');
          ask();
          return;
        }
        const article = articles[selectedIndex - 1];
        const url = `https://juejin.cn/post/${article.item_info.article_info.article_id}`;
        console.log(`正在用 lightpanda 获取文章...`);
        try {
          const content = await fetchWithLightpanda(url);
          // 把 markdown 图片语法转换为友好的文本链接
          const sanitized = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '🔗 [图片: $1]($2)');
          const rendered = marked.parse(sanitized);
          console.log('\n' + rendered + '\n');
        } catch (error) {
          console.error('lightpanda 获取失败:', (error as Error).message);
        }
        ask();
        return;
      }

      const num = parseInt(cmd, 10);
      if (!isNaN(num) && num > 0 && num <= articles.length) {
        selectedIndex = num;
        displayArticleDetail(articles[num - 1], num, lightpandaAvailable);
        ask();
        return;
      }

      console.log('未知命令，输入 h 查看帮助');
      ask();
    });
  };

  ask();
}

program.parse();
