document.addEventListener("DOMContentLoaded", function () {
  const TMDB_API_KEY = "b89e2f5f4034e007b2c262dca71b61e5";
  const searchResultsEl = document.getElementById("searchResults");
  const recommendationsDiv = document.getElementById("recommendations");
  const loadingDiv = document.getElementById("loading");
  const movieInput = document.getElementById("movieInput");
  const searchButton = document.getElementById("searchButton");
  const searchIcon = document.querySelector(".search-icon");

  // Event listeners
  movieInput.addEventListener("input", debounce(searchMovie, 300));
  searchButton.addEventListener("click", manualSearch);
  searchIcon.addEventListener("click", manualSearch);

  // Debounce function to limit API calls
  function debounce(func, delay) {
    let timeout;
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }

  // Search movies as user types
  async function searchMovie() {
    const query = movieInput.value.trim();

    if (query.length < 2) {
      searchResultsEl.innerHTML = "";
      searchResultsEl.style.display = "none";
      return;
    }

    try {
      searchResultsEl.innerHTML = "<li>Searching...</li>";
      searchResultsEl.style.display = "block";

      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
          query
        )}`
      );
      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        searchResultsEl.innerHTML = "<li>No results found</li>";
        return;
      }

      searchResultsEl.innerHTML = data.results
        .slice(0, 6)
        .map((movie) => {
          const year = movie.release_date
            ? movie.release_date.split("-")[0]
            : "N/A";
          const poster = movie.poster_path
            ? `https://image.tmdb.org/t/p/w92${movie.poster_path}`
            : "";

          return `
          <li onclick="selectMovie(${movie.id}, '${escapeHtml(movie.title)}')">
            ${poster ? `<img src="${poster}" alt="${movie.title}">` : ""}
            <div class="result-info">
              <div class="result-title">${escapeHtml(movie.title)}</div>
              <div class="result-year">${year}</div>
            </div>
          </li>
        `;
        })
        .join("");
    } catch (error) {
      console.error("Search error:", error);
      searchResultsEl.innerHTML = "<li>Error loading results</li>";
    }
  }

  // Select movie from search results
  window.selectMovie = async function (movieId, movieTitle) {
    movieInput.value = movieTitle;
    searchResultsEl.innerHTML = "";
    searchResultsEl.style.display = "none";
    await getRecommendations(movieId);
  };

  // Get recommendations
  async function getRecommendations(movieId) {
    if (!movieId) return;

    loadingDiv.style.display = "block";
    recommendationsDiv.innerHTML = "";

    try {
      const [recRes, simRes] = await Promise.all([
        fetch(
          `https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}`
        ),
        fetch(
          `https://api.themoviedb.org/3/movie/${movieId}/similar?api_key=${TMDB_API_KEY}`
        ),
      ]);

      const [recData, simData] = await Promise.all([
        recRes.json(),
        simRes.json(),
      ]);
      const combined = [...(recData.results || []), ...(simData.results || [])];
      const uniqueMovies = [
        ...new Map(combined.map((m) => [m.id, m])).values(),
      ].slice(0, 10);

      if (uniqueMovies.length === 0) {
        recommendationsDiv.innerHTML =
          "<p>No recommendations found. Try another movie.</p>";
        return;
      }

      const movieDetails = await Promise.all(
        uniqueMovies.map(async (movie) => {
          const detailsRes = await fetch(
            `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}`
          );
          const details = await detailsRes.json();
          return {
            ...movie,
            details,
          };
        })
      );

      recommendationsDiv.innerHTML = movieDetails
        .map((movie) => {
          const runtime = movie.details.runtime
            ? `${Math.floor(movie.details.runtime / 60)}h ${
                movie.details.runtime % 60
              }m`
            : "N/A";

          return `
          <div class="movie-card" onclick="selectMovie(${
            movie.id
          }, '${escapeHtml(movie.title)}')">
            ${
              movie.poster_path
                ? `
              <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" 
                   class="movie-poster" 
                   alt="${escapeHtml(movie.title)}">
            `
                : ""
            }
            <div class="movie-info">
              <h3 class="movie-title">${escapeHtml(movie.title)}</h3>
              <div class="movie-year">
                ${movie.release_date ? movie.release_date.split("-")[0] : "N/A"}
              </div>
              
              <div class="movie-meta">
                <div class="movie-rating">
                  <i class="fas fa-star"></i>
                  <span>${movie.vote_average?.toFixed(1) || "N/A"}</span>
                </div>
                
                <div class="movie-runtime">
                  <i class="far fa-clock"></i>
                  <span>${runtime}</span>
                </div>
              </div>
              
              ${
                movie.overview
                  ? `
              <div class="movie-overview">
                ${movie.overview}
              </div>
              `
                  : ""
              }
            </div>
          </div>
        `;
        })
        .join("");
    } catch (error) {
      console.error("Recommendation error:", error);
      recommendationsDiv.innerHTML =
        "<p>Error loading recommendations. Please try again.</p>";
    } finally {
      loadingDiv.style.display = "none";
    }
  }

  // Manual search fallback
  async function manualSearch() {
    const query = movieInput.value.trim();
    if (!query) {
      recommendationsDiv.innerHTML = "<p>Please enter a movie title.</p>";
      return;
    }

    loadingDiv.style.display = "block";
    recommendationsDiv.innerHTML = "";

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
          query
        )}`
      );
      const data = await response.json();

      if (data.results?.length > 0) {
        const movie = data.results[0];
        await getRecommendations(movie.id);
      } else {
        recommendationsDiv.innerHTML =
          "<p>Movie not found. Please try another title.</p>";
      }
    } catch (error) {
      console.error("Manual search error:", error);
      recommendationsDiv.innerHTML =
        "<p>Error searching for movie. Please try again.</p>";
    } finally {
      loadingDiv.style.display = "none";
    }
  }

  // Helper function to escape HTML
  function escapeHtml(text) {
    if (!text) return "";
    return text
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Close search results when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-box") && e.target !== movieInput) {
      searchResultsEl.style.display = "none";
    }
  });
});
