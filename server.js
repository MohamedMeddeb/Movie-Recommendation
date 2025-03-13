const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 3000;
const API_KEY = "fb7eaac3"; // Replace with your OMDb API key

app.use(cors());
app.use(express.json());

// Store user preferences (in-memory for simplicity)
let userPreferences = {
  genres: [], // Array of objects: { genre: string, count: number }
  actors: [], // Array of objects: { actor: string, count: number }
  categories: [], // Array of objects: { category: string, count: number }
};

// Endpoint to fetch search results and recommendations
app.post("/recommendations", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    // Fetch search results for the current query
    const searchResults = await getSearchResults(query);

    // Fetch recommendations based on user preferences
    const recommendations = await getRecommendations();

    // Return both search results and recommendations
    res.json({
      searchResults: searchResults.slice(0, 5), // Top 5 search results
      recommendations: recommendations.slice(0, 10), // Top 10 recommendations
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Endpoint to like a movie
app.post("/like", async (req, res) => {
  const { movieId } = req.body;

  if (!movieId) {
    return res.status(400).json({ error: "Movie ID is required" });
  }

  try {
    // Fetch movie details to extract genres, actors, and categories
    const response = await axios.get(
      `http://www.omdbapi.com/?i=${movieId}&apikey=${API_KEY}`
    );
    const { Genre, Actors, Type } = response.data;

    // Add genres to preferences
    if (Genre) {
      const genres = Genre.split(", ");
      genres.forEach((genre) => {
        const existingGenre = userPreferences.genres.find(
          (g) => g.genre === genre
        );
        if (existingGenre) {
          existingGenre.count += 1; // Increment count
        } else {
          userPreferences.genres.push({ genre, count: 1 }); // Add new genre
        }
      });
    }

    // Add actors to preferences
    if (Actors) {
      const actors = Actors.split(", ");
      actors.forEach((actor) => {
        const existingActor = userPreferences.actors.find(
          (a) => a.actor === actor
        );
        if (existingActor) {
          existingActor.count += 1; // Increment count
        } else {
          userPreferences.actors.push({ actor, count: 1 }); // Add new actor
        }
      });
    }

    // Add category to preferences (e.g., superhero, sci-fi, etc.)
    const category = inferCategory(response.data); // Infer category based on movie details
    if (category) {
      const existingCategory = userPreferences.categories.find(
        (c) => c.category === category
      );
      if (existingCategory) {
        existingCategory.count += 1; // Increment count
      } else {
        userPreferences.categories.push({ category, count: 1 }); // Add new category
      }
    }

    console.log("Updated Preferences:", userPreferences); // Debugging
    res.json({ success: true });
  } catch (error) {
    console.error(`Error fetching movie details for ID ${movieId}:`, error);
    res.status(500).json({ error: "Failed to like movie" });
  }
});
//a
// Function to infer category based on movie details
function inferCategory(movie) {
  const { Title, Genre, Plot } = movie;

  // Example: Infer "superhero" category
  if (
    Title.toLowerCase().includes("marvel") ||
    Title.toLowerCase().includes("avengers")
  ) {
    return "superhero";
  }

  // Example: Infer "sci-fi" category
  if (
    Genre.toLowerCase().includes("sci-fi") ||
    Plot.toLowerCase().includes("space")
  ) {
    return "sci-fi";
  }

  // Add more category inference logic as needed
  return null;
}

// Function to fetch search results for the current query
async function getSearchResults(query) {
  try {
    const response = await axios.get(
      `http://www.omdbapi.com/?s=${query}&apikey=${API_KEY}`
    );
    return response.data.Search || [];
  } catch (error) {
    console.error(`Error fetching search results for query ${query}:`, error);
    return [];
  }
}

// Function to fetch recommendations based on user preferences
async function getRecommendations() {
  const { genres, actors, categories } = userPreferences;
  let recommendations = new Map(); // Use a Map to prevent duplicates

  console.log("Fetching recommendations based on:", userPreferences);

  // Helper function to fetch movies by search term
  async function fetchMovies(searchTerm) {
    try {
      console.log(`Fetching movies for: ${searchTerm}`);
      const response = await axios.get(
        `http://www.omdbapi.com/?s=${searchTerm}&apikey=${API_KEY}`
      );
      return response.data.Search || [];
    } catch (error) {
      console.error(`Error fetching movies for ${searchTerm}:`, error);
      return [];
    }
  }

  // Fetch movies based on the main genre first
  if (genres.length > 0) {
    const mainGenre = genres[0].genre; // Prioritize the most liked genre
    const movies = await fetchMovies(mainGenre);
    movies.forEach((movie) => recommendations.set(movie.imdbID, movie));
  }

  // Fetch movies for additional genres
  for (const genre of genres.slice(1, 3)) {
    // Secondary genres
    const movies = await fetchMovies(genre.genre);
    movies.forEach((movie) => recommendations.set(movie.imdbID, movie));
  }

  // Fetch movies for top preferred actors
  for (const actor of actors.slice(0, 3)) {
    const movies = await fetchMovies(actor.actor);
    movies.forEach((movie) => recommendations.set(movie.imdbID, movie));
  }

  // Fetch movies for top preferred categories
  for (const category of categories.slice(0, 3)) {
    const movies = await fetchMovies(category.category);
    movies.forEach((movie) => recommendations.set(movie.imdbID, movie));
  }

  // Fetch additional details to refine recommendations
  for (const movie of recommendations.values()) {
    try {
      const details = await axios.get(
        `http://www.omdbapi.com/?i=${movie.imdbID}&apikey=${API_KEY}`
      );
      if (details.data.Genre) {
        const movieGenres = details.data.Genre.split(", ");
        if (movieGenres.some((g) => genres.some((x) => x.genre === g))) {
          recommendations.set(movie.imdbID, details.data);
        }
      }
    } catch (error) {
      console.error(`Error fetching details for ${movie.imdbID}:`, error);
    }
  }

  console.log("Final recommendations:", Array.from(recommendations.values()));
  return Array.from(recommendations.values()).slice(0, 10); // Return top 10 unique results
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
