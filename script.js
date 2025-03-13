document
  .getElementById("searchButton")
  .addEventListener("click", fetchSearchResults);
document
  .getElementById("refreshButton")
  .addEventListener("click", fetchRecommendations);

let likedMovies = []; // Store liked movies

// Fetch search results
async function fetchSearchResults() {
  const query = document.getElementById("searchInput").value;
  if (!query) {
    alert("Please enter a search query.");
    return;
  }

  // Clear previous search results
  document.getElementById("searchResults").innerHTML = "";

  try {
    const response = await fetch("http://localhost:3000/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch search results");
    }

    const data = await response.json();
    displaySearchResults(data.searchResults);
  } catch (error) {
    console.error("Error fetching search results:", error);
    alert("Failed to fetch search results. Please try again.");
  }
}

// Fetch recommendations
async function fetchRecommendations() {
  try {
    const response = await fetch("http://localhost:3000/recommendations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ likedMovies }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch recommendations");
    }

    const data = await response.json();
    displayRecommendations(data.recommendations);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    alert("Failed to fetch recommendations. Please try again.");
  }
}

// Display search results
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

// Display recommendations
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

// Create a movie block
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
      likeMovie(movie); // Like the movie if it's in search results
    } else {
      removeLikedMovie(movie); // Remove the movie if it's in liked movies
    }
  });

  block.appendChild(img);
  block.appendChild(title);
  block.appendChild(button);
  return block;
}

// Like a movie
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

    likedMovies.push(movie); // Add the movie to the likedMovies array
    displayLikedMovies(); // Update the UI to show the liked movies
    fetchRecommendations(); // Update recommendations after liking a movie
  } catch (error) {
    console.error("Error liking movie:", error);
    alert("Failed to like movie. Please try again.");
  }
}

// Remove a liked movie
async function removeLikedMovie(movie) {
  try {
    const response = await fetch("http://localhost:3000/unlike", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ movieId: movie.imdbID }),
    });

    if (!response.ok) {
      throw new Error("Failed to remove liked movie");
    }

    // Remove the movie from the likedMovies array
    likedMovies = likedMovies.filter((m) => m.imdbID !== movie.imdbID);

    // Update the UI
    displayLikedMovies();

    // Fetch new recommendations after removing a movie
    fetchRecommendations();
  } catch (error) {
    console.error("Error removing liked movie:", error);
    alert("Failed to remove liked movie. Please try again.");
  }
}

// Display liked movies
function displayLikedMovies() {
  const likedMoviesDiv = document.getElementById("likedMovies");
  likedMoviesDiv.innerHTML = ""; // Clear the current content

  if (likedMovies.length === 0) {
    likedMoviesDiv.innerHTML = "<p>No liked movies yet.</p>";
    return;
  }

  // Display each liked movie
  likedMovies.forEach((movie) => {
    const block = createMovieBlock(movie, false); // Create a movie block
    likedMoviesDiv.appendChild(block); // Add the block to the liked movies section
  });
}
