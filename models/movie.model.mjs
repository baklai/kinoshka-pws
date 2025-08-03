import mongoose, { model } from 'mongoose';
const { Schema } = mongoose;

const MovieSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    originalTitle: { type: String, trim: true },
    link: { type: String, trim: true },
    poster: { type: String, trim: true },
    category: { type: String, trim: true },
    quality: { type: String, trim: true },
    rating: { type: String, trim: true },
    year: { type: String, trim: true },
    country: { type: String, trim: true },
    genres: { type: String, trim: true },
    actors: { type: [String], default: [] },
    directors: { type: [String], default: [] },
    description: { type: String, trim: true },
    episode: { type: [String], default: [] }
  },
  { timestamps: true }
);

export const Movie = model('Movie', MovieSchema);
