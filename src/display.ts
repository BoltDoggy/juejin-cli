import chalk from 'chalk';
import Table from 'cli-table3';
import { ArticleItem } from './types';

function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return String(num);
}

function formatDate(timestamp: string): string {
  const date = new Date(Number(timestamp) * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return `${date.getMonth() + 1}-${date.getDate()}`;
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

export function displayArticles(items: ArticleItem[], startIndex: number = 1): void {
  const articles = items
    .filter((item) => item.item_type === 2)
    .map((item) => item.item_info);

  if (articles.length === 0) {
    console.log(chalk.yellow('暂无文章'));
    return;
  }

  // 使用表格展示
  const table = new Table({
    head: [chalk.cyan('#'), chalk.cyan('标题'), chalk.cyan('作者'), chalk.cyan('热度'), chalk.cyan('时间')],
    colWidths: [4, 45, 16, 10, 10],
    wordWrap: true,
    style: {
      head: [],
      border: [],
    },
  });

  articles.forEach((article, idx) => {
    const info = article.article_info;
    const author = article.author_user_info;
    const hotIndex = formatNumber(info.view_count + info.digg_count * 10);

    table.push([
      chalk.gray(String(startIndex + idx)),
      truncate(info.title, 40),
      truncate(author.user_name, 12),
      chalk.yellow(hotIndex),
      chalk.dim(formatDate(info.ctime)),
    ]);
  });

  console.log(table.toString());
  console.log();
}

export function displayArticleDetail(item: ArticleItem, index: number, lightpandaAvailable = false): void {
  const info = item.item_info.article_info;
  const author = item.item_info.author_user_info;
  const tags = item.item_info.tags?.map((t) => t.tag_name).join(', ') || '';

  console.log();
  console.log(chalk.bold(`[${index}] ${info.title}`));
  console.log(chalk.dim('─'.repeat(70)));
  console.log(`${chalk.cyan('作者:')} ${author.user_name}${author.company ? ` @ ${author.company}` : ''}${author.job_title ? ` (${author.job_title})` : ''}`);
  console.log(`${chalk.cyan('链接:')} https://juejin.cn/post/${info.article_id}`);
  if (tags) console.log(`${chalk.cyan('标签:')} ${tags}`);
  console.log(`${chalk.cyan('阅读:')} ${formatNumber(info.view_count)}  ${chalk.cyan('点赞:')} ${formatNumber(info.digg_count)}  ${chalk.cyan('评论:')} ${formatNumber(info.comment_count)}`);
  if (info.read_time) console.log(`${chalk.cyan('时长:')} ${info.read_time}`);
  console.log();
  console.log(chalk.dim(truncate(info.brief_content, 200)));
  if (lightpandaAvailable) {
    console.log(chalk.dim('─'.repeat(70)));
    console.log(chalk.green(`  提示: 输入 o 用 lightpanda 查看完整正文`));
  }
  console.log(chalk.dim('─'.repeat(70)));
  console.log();
}

export function displayHelp(lightpandaAvailable = false): void {
  console.log();
  console.log(chalk.bold('操作说明:'));
  console.log(`  ${chalk.yellow('<n>')}      查看第 n 篇文章详情`);
  if (lightpandaAvailable) {
    console.log(`  ${chalk.yellow('o')}        用 lightpanda 查看当前选中文章的完整正文`);
  }
  console.log(`  ${chalk.yellow('n')}        下一页`);
  console.log(`  ${chalk.yellow('p')}        上一页`);
  console.log(`  ${chalk.yellow('q')}        退出`);
  console.log(`  ${chalk.yellow('h')}        显示帮助`);
  console.log();
}
