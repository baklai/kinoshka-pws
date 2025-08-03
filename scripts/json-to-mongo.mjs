import dotenv from 'dotenv';
import fs from 'fs';
import mongoose from 'mongoose';

import { Movie } from '../models/movie.model.mjs';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Переменная окружения MONGO_URI не найдена в .env');
  process.exit(1);
}

mongoose.connect(MONGO_URI);

const db = mongoose.connection;
db.on('error', err => console.error('Ошибка подключения к MongoDB:', err));
db.once('open', async () => {
  console.log('✅ Подключено к MongoDB');

  const jsonRaw = fs.readFileSync('./database/kinoshka.json', 'utf8');
  const jsonData = JSON.parse(jsonRaw);

  const moviesToInsert = jsonData.map(movie => ({
    title: movie.title || '',
    originalTitle: movie.originalTitle || '',
    link: movie.link || '',
    poster: movie.poster || '',
    category: movie.category || '',
    quality: movie.quality || '',
    rating: movie.rating || '',
    year: movie.year || '',
    country: movie.country || '',
    genres: movie.genres || '',
    actors: Array.isArray(movie.actors) ? movie.actors : [],
    directors: Array.isArray(movie.directors) ? movie.directors : [],
    description: movie.description || '',
    episode: Array.isArray(movie.episode) ? movie.episode : []
  }));

  try {
    await Movie.insertMany(moviesToInsert, { ordered: false });
    console.log('🎉 Фильмы успешно импортированы в MongoDB');
  } catch (err) {
    console.error('❌ Ошибка при импорте:', err);
  } finally {
    await mongoose.disconnect();
  }
});
