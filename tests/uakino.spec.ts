import { expect, test } from '@playwright/test';
import fs from 'node:fs';

const BASE_URL = 'https://uakino.best';

const search: string[] = [
  'https://uakino.best/filmy/',
  'https://uakino.best/seriesss/',
  'https://uakino.best/cartoon/',
  'https://uakino.best/top/',
  'https://uakino.best/news/'
];

// test.beforeAll(async () => {
//   // 1. Получаем robots.txt
//   const robotsUrl = `${BASE_URL}/robots.txt`;
//   const robotsRes = await axios.get(robotsUrl);
//   const robotsTxt = robotsRes.data;

//   if (!robotsTxt) {
//     throw new Error('Robots txt not found');
//   }

//   // 2. Извлекаем sitemap URL
//   const sitemapUrl = robotsTxt.match(/Sitemap:\s*(.+)/i)[1].trim();
//   if (!sitemapUrl) {
//     throw new Error('Sitemap not found in robots.txt');
//   }

//   console.log('sitemapUrl', sitemapUrl);

//   // 3. Загружаем и парсим sitemap.xml
//   const sitemapRes = await axios.get(sitemapUrl);
//   const sitemapXml = sitemapRes.data;
//   const parsedXml = await parseStringPromise(sitemapXml);
//   const sitemapUrls = parsedXml.sitemapindex.sitemap.map((u: any) => u.loc[0]);

//   console.log('sitemapUrls', sitemapUrls);

//   if (!sitemapUrls.length) {
//     throw new Error('Sitemap category url not found in sitemap');
//   }

//   const sitemapCategoryUrl = sitemapUrls.find((url: string) =>
//     url.includes('category')
//   );

//   if (!sitemapCategoryUrl) {
//     throw new Error('Sitemap category url not found in sitemap');
//   }

//   // 4. Загружаем и парсим category_pages.xml
//   const sitemapCategoryRes = await axios.get(sitemapCategoryUrl);
//   const sitemapCategoryXml = sitemapCategoryRes.data;
//   const parsedCategoryXml = await parseStringPromise(sitemapCategoryXml);
//   const sitemapCategoryUrls = parsedCategoryXml.urlset.url.map(
//     (u: any) => u.loc[0]
//   );

//   console.log('sitemapCategoryUrls', sitemapCategoryUrls);

//   if (!sitemapCategoryUrls.length) {
//     throw new Error('Category url not found in category sitemap');
//   }

//   search.push(...sitemapCategoryUrls);

//   console.log('Найдено URL в category sitemap:', search.length);
// });

// Пример использования одного из URL из sitemap

let baseUrl = 'https://uakino.best/filmy/';
let totalPages = 2;
let allFilms: any[] = [];

test.describe('Сбор фильмов с uakino.best', () => {
  test('Страница каталога доступна', async ({ page }) => {
    const response = await page.goto(baseUrl);
    expect(response?.ok()).toBeTruthy();
    console.log('✅ Страница доступна');
  });

  test('Получаем количество страниц пагинации', async ({ page }) => {
    await page.goto(baseUrl);
    await page.waitForSelector('#bottom-nav .pagi-nav');

    const lastPageText = await page
      .$eval('#bottom-nav .pagi-nav a:last-of-type', (el) =>
        el.textContent?.trim()
      )
      .catch(() => null);

    expect(lastPageText).not.toBeNull();

    const pages = Number(lastPageText);
    expect(pages).toBeGreaterThan(0);

    totalPages = pages;
    console.log(`🔢 Всего страниц: ${totalPages}`);
  });

  test('Собираем карточки фильмов со всех страниц', async ({ browser }) => {
    expect(totalPages).toBeGreaterThan(0); // защитная проверка

    const page = await browser.newPage();

    // ❗ Ограничим для отладки — например, до 3 страниц
    const maxPages = Math.min(totalPages, 3);

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const url = pageNum === 1 ? baseUrl : `${baseUrl}page/${pageNum}/`;
      console.log(`🔄 Страница ${pageNum}: ${url}`);

      await page.goto(url);
      await page.waitForSelector('#dle-content .movie-item.short-item');

      const cards = await page.$$('#dle-content .movie-item.short-item');

      for (const card of cards) {
        const title = await card.$eval('.movie-title', (el) =>
          el.textContent?.trim()
        );
        const link = await card.$eval(
          '.movie-title',
          (el) => (el as HTMLAnchorElement).href
        );
        const poster = await card.$eval(
          '.movie-img img',
          (el) => (el as HTMLImageElement).src
        );
        const imdb = await card
          .$eval('.movie-desk-item .deck-value[style*="color:yellow"]', (el) =>
            el.textContent?.trim()
          )
          .catch(() => null);
        const year = await card
          .$eval('.movie-desk-item:has-text("Рік виходу:") .deck-value', (el) =>
            el.textContent?.trim()
          )
          .catch(() => null);
        const genres = await card
          .$eval('.movie-desk-item:has-text("Жанр:") .deck-value', (el) =>
            el.textContent?.trim()
          )
          .catch(() => null);
        const actors = await card.$$eval(
          '.movie-desk-item:has-text("Актори:") .deck-value a',
          (els) => els.map((a) => a.textContent?.trim())
        );
        const description = await card
          .$eval('.desc-about-text', (el) => el.textContent?.trim())
          .catch(() => null);

        allFilms.push({
          title,
          link,
          poster,
          imdb,
          year,
          genres,
          actors,
          description
        });
      }

      console.log(`✅ Карточек на странице ${pageNum}: ${cards.length}`);
      await page.waitForTimeout(300); // пауза
    }

    await page.close();

    expect(allFilms.length).toBeGreaterThan(0);
    fs.writeFileSync('films.json', JSON.stringify(allFilms, null, 2), 'utf-8');
    console.log(`💾 Сохранено ${allFilms.length} карточек в films.json`);
  });
});
