document
  .getElementById("searchButton")
  .addEventListener("click", fetchRecommendations);
document
  .getElementById("refreshButton")
  .addEventListener("click", fetchRecommendations); // Add refresh button functionality

let likedMovies = []; // Store liked movies

async function fetchRecommendations() {
  const query = document.getElementById("searchInput").value;
  if (!query) {
    alert("Please enter a search query.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/recommendations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch recommendations");
    }

    const data = await response.json();
    displaySearchResults(data.searchResults);
    displayRecommendations(data.recommendations);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    alert("Failed to fetch recommendations. Please try again.");
  }
}

function displaySearchResults(movies) {
  const searchResultsDiv = document.getElementById("searchResults");
  searchResultsDiv.innerHTML = "";

  if (movies.length === 0) {
    searchResultsDiv.innerHTML = "<p>No search results found.</p>";
    return;
  }

  movies.forEach((movie) => {
    const block = createMovieBlock(movie, true);
    searchResultsDiv.appendChild(block);
  });
}

function displayRecommendations(movies) {
  const recommendationsDiv = document.getElementById("recommendations");
  recommendationsDiv.innerHTML = "";

  if (movies.length === 0) {
    recommendationsDiv.innerHTML =
      "<p>No recommendations found. Try another search.</p>";
    return;
  }

  movies.forEach((movie) => {
    const block = createMovieBlock(movie, false);
    recommendationsDiv.appendChild(block);
  });
}

function createMovieBlock(movie, isSearchResult) {
  const block = document.createElement("div");
  block.className = "movie-block";

  const img = document.createElement("img");
  img.src =
    movie.Poster === "N/A" ? "https://via.placeholder.com/150" : movie.Poster;
  img.alt = movie.Title;

  const title = document.createElement("p");
  title.textContent = movie.Title;

  const button = document.createElement("button");
  button.textContent = isSearchResult ? "Like" : "Remove";
  button.addEventListener("click", () => {
    if (isSearchResult) {
      likeMovie(movie);
    } else {
      removeLikedMovie(movie);
    }
  });

  block.appendChild(img);
  block.appendChild(title);
  block.appendChild(button);
  return block;
}

async function likeMovie(movie) {
  try {
    const response = await fetch("http://localhost:3000/like", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ movieId: movie.imdbID }),
    });

    if (!response.ok) {
      throw new Error("Failed to like movie");
    }

    likedMovies.push(movie);
    displayLikedMovies();
    alert("Movie liked! Recommendations will update accordingly.");
  } catch (error) {
    console.error("Error liking movie:", error);
    alert("Failed to like movie. Please try again.");
  }
}

function displayLikedMovies() {
  const likedMoviesDiv = document.getElementById("likedMovies");
  likedMoviesDiv.innerHTML = "";

  if (likedMovies.length === 0) {
    likedMoviesDiv.innerHTML = "<p>No liked movies yet.</p>";
    return;
  }

  likedMovies.forEach((movie) => {
    const block = createMovieBlock(movie, false);
    likedMoviesDiv.appendChild(block);
  });
}

function removeLikedMovie(movie) {
  likedMovies = likedMovies.filter((m) => m.imdbID !== movie.imdbID);
  displayLikedMovies();
}
