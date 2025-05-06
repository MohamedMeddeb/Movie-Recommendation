const OMDB_API_KEY = 'fb7eaac3';
const TMDB_API_KEY = 'b89e2f5f4034e007b2c262dca71b61e5';
const searchResultsEl = document.getElementById('searchResults');
const recommendationsDiv = document.getElementById('recommendations');

// Search for movies as the user types
async function searchMovie() {
  const query = document.getElementById('movieInput').value.trim();
  if (query.length < 2) {
    searchResultsEl.innerHTML = '';
    return;
  }

  const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
  const data = await res.json();
  const results = data.results.slice(0, 6);

  if (!results.length) {
    searchResultsEl.innerHTML = '<li>No results found</li>';
    return;
  }

  searchResultsEl.innerHTML = results
    .map(movie => {
      const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
      const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : '';
      return `
        <li onclick="selectMovie(${movie.id}, '${movie.title.replace(/'/g, "\\'")}')">
          ${poster ? `<img src="${poster}" style="width:30px; vertical-align:middle; margin-right:8px;">` : ''}
          ${movie.title} (${year})
        </li>
      `;
    })
    .join('');
}


// When a user selects a movie from search results
async function selectMovie(movieId, movieTitle) {
  document.getElementById('movieInput').value = movieTitle;
  searchResultsEl.innerHTML = '';
  await getRecommendations(movieId);
}

// Get movie genre by TMDb movie ID
async function getTMDbMovieGenres(movieId) {
  const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`);
  const data = await res.json();
  return data.genres.length ? data.genres[0].id : null; // Use first genre
}

// Get recommendations by genre ID
async function getMoviesByGenre(genreId) {
  const res = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`);
  const data = await res.json();
  return data.results.slice(0, 10);
}

// Main function: get recommendations
async function getRecommendations(movieId) {
  const recommendationURL = `https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}`;
  const similarURL = `https://api.themoviedb.org/3/movie/${movieId}/similar?api_key=${TMDB_API_KEY}`;

  const [recRes, simRes] = await Promise.all([
    fetch(recommendationURL),
    fetch(similarURL)
  ]);

  const recData = await recRes.json();
  const simData = await simRes.json();

  const combined = [...recData.results, ...simData.results];
  const uniqueMovies = Array.from(new Map(combined.map(m => [m.id, m])).values()).slice(0, 10);

  const recommendationsEl = document.getElementById('recommendations');
  recommendationsEl.innerHTML = '<p>Loading recommendations...</p>';

  const movieDetails = await Promise.all(uniqueMovies.map(async (movie) => {
    const detailsRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}`);
    const details = await detailsRes.json();

    return {
      title: movie.title,
      releaseDate: movie.release_date?.split('-')[0] || 'N/A',
      overview: movie.overview || 'No description available.',
      poster: movie.poster_path,
      genres: details.genres?.map(g => g.name).join(', ') || 'Unknown',
      rating: details.vote_average?.toFixed(1) || 'N/A',
      runtime: details.runtime ? `${details.runtime} min` : 'N/A'
    };
  }));

  recommendationsEl.innerHTML = movieDetails.map(movie => `
    <div style="margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 20px;">
      <h3>${movie.title} (${movie.releaseDate})</h3>
      ${movie.poster ? `<img src="https://image.tmdb.org/t/p/w200${movie.poster}" style="height: 150px; float: left; margin-right: 15px;">` : ''}
      <p><strong>Genres:</strong> ${movie.genres}</p>
      <p><strong>Rating:</strong> ⭐ ${movie.rating}</p>
      <p><strong>Runtime:</strong> ⏱️ ${movie.runtime}</p>
      <p>${movie.overview}</p>
      <div style="clear: both;"></div>
    </div>
  `).join('');
}

// Manual fallback if user types full title and presses the button
async function manualSearch() {
  const title = document.getElementById('movieInput').value.trim();
  if (!title) {
    document.getElementById('recommendations').innerHTML = 'Please enter a movie title.';
    return;
  }

  const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
  const data = await res.json();

  if (data.results && data.results.length > 0) {
    const mostRelevant = data.results.find(movie => movie.title.toLowerCase().includes(title.toLowerCase())) || data.results[0];
    await getRecommendations(mostRelevant.id);
  } else {
    document.getElementById('recommendations').innerHTML = 'Movie not found.';
  }
}


