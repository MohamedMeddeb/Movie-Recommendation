document.addEventListener("DOMContentLoaded", function () {
  const TMDB_API_KEY = "Your-API-Key"; //Place Your API Here
  const searchResultsEl = document.getElementById("searchResults");
  const recommendationsDiv = document.getElementById("recommendations");
  const loadingDiv = document.getElementById("loading");
  const movieInput = document.getElementById("movieInput");
  const searchButton = document.getElementById("searchButton");
  const searchIcon = document.querySelector(".search-icon");
  const selectedMovieSection = document.getElementById("selectedMovieSection");

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

    // Show loading while we fetch the selected movie details
    loadingDiv.style.display = "block";
    recommendationsDiv.innerHTML = "";
    selectedMovieSection.style.display = "none";

    try {
      // Fetch the selected movie details
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`
      );
      const movie = await response.json();

      // Display the selected movie
      selectedMovieSection.style.display = "block";
      selectedMovieSection.innerHTML = `
        <h2 class="section-title">
          <i class="fas fa-check-circle"></i> Your Movie
        </h2>
        <div class="selected-movie-card">
          ${
            movie.poster_path
              ? `<img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" 
                   class="selected-movie-poster" 
                   alt="${escapeHtml(movie.title)}">`
              : '<div class="selected-movie-poster no-poster"><i class="fas fa-film"></i></div>'
          }
          <div class="selected-movie-info">
            <h3 class="selected-movie-title">${escapeHtml(movie.title)}</h3>
            <div class="selected-movie-meta">
              <span>${
                movie.release_date ? movie.release_date.split("-")[0] : "N/A"
              }</span>
              <span>•</span>
              <span><i class="fas fa-star"></i> ${
                movie.vote_average?.toFixed(1) || "N/A"
              }</span>
              ${
                movie.runtime
                  ? `<span>•</span>
                     <span><i class="far fa-clock"></i> ${Math.floor(
                       movie.runtime / 60
                     )}h ${movie.runtime % 60}m</span>`
                  : ""
              }
            </div>
            ${
              movie.overview
                ? `<p class="selected-movie-overview">${movie.overview}</p>`
                : '<p class="selected-movie-overview">No overview available.</p>'
            }
          </div>
        </div>
      `;

      // Now get recommendations
      await getRecommendations(movieId);
    } catch (error) {
      console.error("Error fetching selected movie:", error);
      // Still try to get recommendations even if selected movie details fail
      await getRecommendations(movieId);
    } finally {
      loadingDiv.style.display = "none";
    }
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
    selectedMovieSection.style.display = "none";

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
          query
        )}`
      );
      const data = await response.json();

      if (data.results?.length > 0) {
        const movie = data.results[0];
        await selectMovie(movie.id, movie.title);
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
