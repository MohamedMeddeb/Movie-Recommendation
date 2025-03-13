const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3000;
const API_KEY = 'fb7eaac3'; // Replace with your OMDb API key

app.use(cors());
app.use(express.json());

// Store user preferences (in-memory for simplicity)
let userPreferences = {
    genres: [], // Array of objects: { genre: string, count: number }
    actors: [], // Array of objects: { actor: string, count: number }
    categories: [], // Array of objects: { category: string, count: number }
};

// Endpoint to fetch search results and recommendations
app.post('/recommendations', async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
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
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// Endpoint to like a movie
app.post('/like', async (req, res) => {
    const { movieId } = req.body;

    if (!movieId) {
        return res.status(400).json({ error: 'Movie ID is required' });
    }

    try {
        // Fetch movie details to extract genres, actors, and categories
        const response = await axios.get(`http://www.omdbapi.com/?i=${movieId}&apikey=${API_KEY}`);
        const { Genre, Actors, Type } = response.data;

        // Add genres to preferences
        if (Genre) {
            const genres = Genre.split(', ');
            genres.forEach(genre => {
                const existingGenre = userPreferences.genres.find(g => g.genre === genre);
                if (existingGenre) {
                    existingGenre.count += 1; // Increment count
                } else {
                    userPreferences.genres.push({ genre, count: 1 }); // Add new genre
                }
            });
        }

        // Add actors to preferences
        if (Actors) {
            const actors = Actors.split(', ');
            actors.forEach(actor => {
                const existingActor = userPreferences.actors.find(a => a.actor === actor);
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
            const existingCategory = userPreferences.categories.find(c => c.category === category);
            if (existingCategory) {
                existingCategory.count += 1; // Increment count
            } else {
                userPreferences.categories.push({ category, count: 1 }); // Add new category
            }
        }

        console.log('Updated Preferences:', userPreferences); // Debugging
        res.json({ success: true });
    } catch (error) {
        console.error(`Error fetching movie details for ID ${movieId}:`, error);
        res.status(500).json({ error: 'Failed to like movie' });
    }
});

// Function to infer category based on movie details
function inferCategory(movie) {
    const { Title, Genre, Plot } = movie;

    // Example: Infer "superhero" category
    if (Title.toLowerCase().includes('marvel') || Title.toLowerCase().includes('avengers')) {
        return 'superhero';
    }

    // Example: Infer "sci-fi" category
    if (Genre.toLowerCase().includes('sci-fi') || Plot.toLowerCase().includes('space')) {
        return 'sci-fi';
    }

    // Add more category inference logic as needed
    return null;
}

// Function to fetch search results for the current query
async function getSearchResults(query) {
    try {
        const response = await axios.get(`http://www.omdbapi.com/?s=${query}&apikey=${API_KEY}`);
        return response.data.Search || [];
    } catch (error) {
        console.error(`Error fetching search results for query ${query}:`, error);
        return [];
    }
}

// Function to fetch recommendations based on user preferences
async function getRecommendations() {
    const { genres, actors, categories } = userPreferences;
    const recommendations = [];

    // Sort preferences by count (most frequent first)
    const sortedGenres = genres.sort((a, b) => b.count - a.count);
    const sortedActors = actors.sort((a, b) => b.count - a.count);
    const sortedCategories = categories.sort((a, b) => b.count - a.count);

    // Fetch movies for preferred categories (prioritize most frequent)
    for (const category of sortedCategories) {
        try {
            const response = await axios.get(`http://www.omdbapi.com/?s=${category.category}&apikey=${API_KEY}`);
            if (response.data.Search) {
                recommendations.push(...response.data.Search);
            }
        } catch (error) {
            console.error(`Error fetching movies for category ${category.category}:`, error);
        }
    }

    // Fetch movies for preferred genres (prioritize most frequent)
    for (const genre of sortedGenres) {
        try {
            const response = await axios.get(`http://www.omdbapi.com/?s=${genre.genre}&apikey=${API_KEY}`);
            if (response.data.Search) {
                recommendations.push(...response.data.Search);
            }
        } catch (error) {
            console.error(`Error fetching movies for genre ${genre.genre}:`, error);
        }
    }

    // Fetch movies for preferred actors (prioritize most frequent)
    for (const actor of sortedActors) {
        try {
            const response = await axios.get(`http://www.omdbapi.com/?s=${actor.actor}&apikey=${API_KEY}`);
            if (response.data.Search) {
                recommendations.push(...response.data.Search);
            }
        } catch (error) {
            console.error(`Error fetching movies for actor ${actor.actor}:`, error);
        }
    }

    // Remove duplicates
    const uniqueRecommendations = recommendations.filter(
        (movie, index, self) => self.findIndex(m => m.imdbID === movie.imdbID) === index
    );

    console.log('Recommendations:', uniqueRecommendations); // Debugging
    return uniqueRecommendations;
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});