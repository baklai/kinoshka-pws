import fs from 'node:fs';
import { chromium } from 'playwright';
import { v4 as uuidv4 } from 'uuid';

const BASE_URL = 'https://uakino.best';

const categories = [
  { category: 'filmy', url: 'https://uakino.best/filmy/' },
  { category: 'seriesss', url: 'https://uakino.best/seriesss/' },
  { category: 'cartoon', url: 'https://uakino.best/cartoon/' }
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const allFilms = [];

  // 1. Определяем количество страниц
  for (const item of categories) {
    const baseUrl = item.url;

    await page.goto(baseUrl, {
      timeout: 30000,
      waitUntil: 'domcontentloaded'
    });
    await page.waitForSelector('#bottom-nav .pagi-nav');
    const lastPage = await page.$eval(
      '#bottom-nav .pagi-nav a:last-of-type',
      (el) => Number(el.textContent?.trim())
    );
    console.log(`Найдено страниц: ${lastPage}`);

    // 2. Цикл по всем страницам
    for (let pageNum = 1; pageNum <= lastPage; pageNum++) {
      const url = pageNum === 1 ? baseUrl : `${baseUrl}page/${pageNum}/`;
      console.log(`🔄 Страница ${pageNum}: ${url}`);
      await page.goto(url, { timeout: 30000, waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#dle-content .movie-item.short-item');

      const cards = await page.$$('#dle-content .movie-item.short-item');

      for (const card of cards) {
        const title = await card.$eval('.movie-title', (el) =>
          el.textContent?.trim()
        );
        const link = await card.$eval('.movie-title', (el) => el.href);
        const poster = await card.$eval('.movie-img img', (el) => el.src);
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
          id: uuidv4(),
          title,
          link,
          poster,
          category: item.category,
          imdb,
          year,
          genres,
          actors,
          description
        });
      }
      console.log(`✅ Карточек на странице: ${cards.length}`);
      // 3. Сохраняем результат
      fs.writeFileSync(
        'database.json',
        JSON.stringify(allFilms, null, 2),
        'utf-8'
      );
      console.log(
        `🎉 Сохранено карточек: ${allFilms.length} → в файл: films.json`
      );
      await new Promise((res) => setTimeout(res, 5000));
    }
    await new Promise((res) => setTimeout(res, 30000));
  }

  await browser.close();
})();
