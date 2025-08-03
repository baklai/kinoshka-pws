import fs from 'fs';
import sqlite3 from 'sqlite3';

const { verbose } = sqlite3;
const sqlite = verbose();

const database = new sqlite.Database('./database/kinoshka.db');
const jsondata = JSON.parse(fs.readFileSync('./database/kinoshka.json', 'utf8'));

function getStringField(obj, field) {
  return obj[field] ? obj[field] : '';
}

function getArrayField(obj, field) {
  return obj[field] ? JSON.stringify(obj[field]) : '[]';
}

database.serialize(() => {
  database.run(`CREATE TABLE IF NOT EXISTS movies (
    id TEXT NOT NULL PRIMARY KEY UNIQUE,
    title TEXT,
    originalTitle TEXT,
    link TEXT,
    poster TEXT,
    category TEXT,
    quality TEXT,
    rating TEXT,
    year TEXT,
    country TEXT,
    genres TEXT,
    actors TEXT,
    directors TEXT,
    description TEXT,
    episode TEXT
  )`);

  const stmt = database.prepare(`
    INSERT OR REPLACE INTO movies (
      id, title, originalTitle, link, poster, category, quality, rating, year, country,
      genres, actors, directors, description, episode
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  jsondata.forEach(movie => {
    stmt.run(
      getStringField(movie, 'id'),
      getStringField(movie, 'title'),
      getStringField(movie, 'originalTitle'),
      getStringField(movie, 'link'),
      getStringField(movie, 'poster'),
      getStringField(movie, 'category'),
      getStringField(movie, 'quality'),
      getStringField(movie, 'rating'),
      getStringField(movie, 'year'),
      getStringField(movie, 'country'),
      getStringField(movie, 'genres'),
      getArrayField(movie, 'actors'),
      getArrayField(movie, 'directors'),
      getStringField(movie, 'description'),
      getArrayField(movie, 'episode')
    );
  });

  stmt.finalize();

  console.log('Данные успешно импортированы в таблицу movies');
});

database.close();
