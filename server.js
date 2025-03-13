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

// Endpoint to fetch search results
app.post("/search", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    const searchResults = await getSearchResults(query);
    res.json({ searchResults: searchResults.slice(0, 5) }); // Return top 5 search results
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

// Endpoint to fetch recommendations
app.post("/recommendations", async (req, res) => {
  const { likedMovies = [] } = req.body;

  try {
    const recommendations = await getRecommendations(likedMovies);
    res.json({ recommendations: recommendations.slice(0, 10) }); // Return top 10 recommendations
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch recommendations" });
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
    const category = inferCategory(response.data);
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

// Endpoint to unlike a movie
app.post("/unlike", async (req, res) => {
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

    // Remove genres from preferences
    if (Genre) {
      const genres = Genre.split(", ");
      genres.forEach((genre) => {
        const existingGenre = userPreferences.genres.find(
          (g) => g.genre === genre
        );
        if (existingGenre && existingGenre.count > 0) {
          existingGenre.count -= 1; // Decrement count
          // If count reaches 0, remove the genre from preferences
          if (existingGenre.count === 0) {
            userPreferences.genres = userPreferences.genres.filter(
              (g) => g.genre !== genre
            );
          }
        }
      });
    }

    // Remove actors from preferences
    if (Actors) {
      const actors = Actors.split(", ");
      actors.forEach((actor) => {
        const existingActor = userPreferences.actors.find(
          (a) => a.actor === actor
        );
        if (existingActor && existingActor.count > 0) {
          existingActor.count -= 1; // Decrement count
          // If count reaches 0, remove the actor from preferences
          if (existingActor.count === 0) {
            userPreferences.actors = userPreferences.actors.filter(
              (a) => a.actor !== actor
            );
          }
        }
      });
    }

    // Remove category from preferences
    const category = inferCategory(response.data);
    if (category) {
      const existingCategory = userPreferences.categories.find(
        (c) => c.category === category
      );
      if (existingCategory && existingCategory.count > 0) {
        existingCategory.count -= 1; // Decrement count
        // If count reaches 0, remove the category from preferences
        if (existingCategory.count === 0) {
          userPreferences.categories = userPreferences.categories.filter(
            (c) => c.category !== category
          );
        }
      }
    }

    console.log("Updated Preferences:", userPreferences); // Debugging
    res.json({ success: true });
  } catch (error) {
    console.error(`Error removing movie with ID ${movieId}:`, error);
    res.status(500).json({ error: "Failed to remove liked movie" });
  }
});

// Function to infer category based on movie details
function inferCategory(movie) {
  const { Title, Genre, Plot } = movie;

  // Infer "superhero" category for Marvel, Avengers, and Spider-Man
  if (
    Title.toLowerCase().includes("marvel") ||
    Title.toLowerCase().includes("avengers") ||
    Title.toLowerCase().includes("spider-man") ||
    Title.toLowerCase().includes("spiderman") ||
    Plot.toLowerCase().includes("marvel") ||
    Plot.toLowerCase().includes("avengers") ||
    Plot.toLowerCase().includes("spider-man") ||
    Plot.toLowerCase().includes("spiderman")
  ) {
    return "superhero";
  }

  // Infer "sci-fi" category
  if (
    Genre.toLowerCase().includes("sci-fi") ||
    Plot.toLowerCase().includes("space")
  ) {
    return "sci-fi";
  }

  // Add more category inference logic as needed
  return null;
}

// Define franchise-related keywords and their related terms
const franchiseKeywords = {
  "spider-man": ["Spider-Man", "Spider Man", "Venom"],
  avengers: [
    "Avengers",
    "Iron Man",
    "Captain America",
    "Thor",
    "Hulk",
    "Black Widow",
    "Hawkeye",
  ],
  guardians: [
    "Guardians of the Galaxy",
    "Star-Lord",
    "Groot",
    "Rocket Raccoon",
  ],
  "x-men": ["X-Men", "Wolverine", "Deadpool", "Magneto", "Professor X"],
  marvel: ["Marvel", "MCU", "Infinity War", "Endgame"],
};

// Function to detect the franchise of a movie based on its title
function detectFranchise(movieTitle) {
  const lowerTitle = movieTitle.toLowerCase();
  for (const franchise in franchiseKeywords) {
    if (
      franchiseKeywords[franchise].some((keyword) =>
        lowerTitle.includes(keyword.toLowerCase())
      )
    ) {
      return franchise;
    }
  }
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
async function getRecommendations(likedMovies) {
  const { genres, categories } = userPreferences;
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

  // Helper function to fetch movie details by IMDb ID
  async function fetchMovieDetails(imdbID) {
    try {
      const response = await axios.get(
        `http://www.omdbapi.com/?i=${imdbID}&apikey=${API_KEY}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching details for ${imdbID}:`, error);
      return null;
    }
  }

  // Determine if the user has liked any franchise-based movies
  const likedFranchises = new Set();
  for (const movie of likedMovies) {
    const franchise = detectFranchise(movie.Title);
    if (franchise) {
      likedFranchises.add(franchise);
    }
  }

  console.log("Liked Franchises:", Array.from(likedFranchises)); // Debugging: Log liked franchises

  // Function to check if a movie has already been liked
  function isMovieLiked(movie) {
    return likedMovies.some((likedMovie) => likedMovie.imdbID === movie.imdbID);
  }

  // Step 1: Fetch franchise-based movies
  if (likedFranchises.size > 0) {
    for (const franchise of likedFranchises) {
      for (const keyword of franchiseKeywords[franchise]) {
        const movies = await fetchMovies(keyword);
        for (const movie of movies) {
          if (!isMovieLiked(movie)) {
            // Avoid recommending liked movies
            recommendations.set(movie.imdbID, movie);
          }
        }
      }
    }
  }

  // Step 2: Fetch category-based movies if more recommendations are needed
  if (recommendations.size < 10 && categories.length > 0) {
    for (const category of categories.slice(0, 3)) {
      const movies = await fetchMovies(category.category);
      for (const movie of movies) {
        if (!isMovieLiked(movie)) {
          // Avoid recommending liked movies
          recommendations.set(movie.imdbID, movie);
        }
      }
    }
  }

  // Step 3: Fetch genre-based movies if more recommendations are needed
  if (recommendations.size < 10 && genres.length > 0) {
    const mainGenre = genres[0].genre;
    const secondaryGenre = genres.length > 1 ? genres[1].genre : null;
    const thirdGenre = genres.length > 2 ? genres[2].genre : null;

    const genreQueries = [mainGenre];
    if (secondaryGenre) genreQueries.push(`${mainGenre} ${secondaryGenre}`);
    if (thirdGenre)
      genreQueries.push(`${mainGenre} ${secondaryGenre} ${thirdGenre}`);

    for (const query of genreQueries) {
      const movies = await fetchMovies(query);
      for (const movie of movies) {
        if (!isMovieLiked(movie)) {
          // Avoid recommending liked movies
          recommendations.set(movie.imdbID, movie);
        }
      }
    }
  }

  console.log("Final recommendations:", Array.from(recommendations.values())); // Debugging: Log final recommendations
  return Array.from(recommendations.values()).slice(0, 10); // Return top 10 unique results
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
