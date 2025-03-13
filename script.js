document.getElementById('searchButton').addEventListener('click', fetchRecommendations);
//test
async function fetchRecommendations() {
    const query = document.getElementById('searchInput').value;
    if (!query) {
        alert('Please enter a search query.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch recommendations');
        }

        const data = await response.json();
        console.log('Data from backend:', data); // Debugging

        displaySearchResults(data.searchResults);
        displayRecommendations(data.recommendations);
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        alert('Failed to fetch recommendations. Please try again.');
    }
}

// Function to display search results
function displaySearchResults(movies) {
    const searchResultsDiv = document.getElementById('searchResults');
    searchResultsDiv.innerHTML = ''; // Clear previous search results

    if (movies.length === 0) {
        searchResultsDiv.innerHTML = '<p>No search results found.</p>';
        return;
    }

    movies.forEach(movie => {
        const block = document.createElement('div');
        block.className = 'movie-block';

        const img = document.createElement('img');
        img.src = movie.Poster === 'N/A' ? 'https://via.placeholder.com/150' : movie.Poster; // Handle missing posters
        img.alt = movie.Title;

        const title = document.createElement('p');
        title.textContent = movie.Title;

        const likeButton = document.createElement('button');
        likeButton.textContent = 'Like';
        likeButton.addEventListener('click', () => likeMovie(movie.imdbID));

        block.appendChild(img);
        block.appendChild(title);
        block.appendChild(likeButton);
        searchResultsDiv.appendChild(block);
    });
}

// Function to display recommendations
function displayRecommendations(movies) {
    const recommendationsDiv = document.getElementById('recommendations');
    recommendationsDiv.innerHTML = ''; // Clear previous recommendations

    if (movies.length === 0) {
        recommendationsDiv.innerHTML = '<p>No recommendations found. Try another search.</p>';
        return;
    }

    movies.forEach(movie => {
        const block = document.createElement('div');
        block.className = 'movie-block';

        const img = document.createElement('img');
        img.src = movie.Poster === 'N/A' ? 'https://via.placeholder.com/150' : movie.Poster; // Handle missing posters
        img.alt = movie.Title;

        const title = document.createElement('p');
        title.textContent = movie.Title;

        block.appendChild(img);
        block.appendChild(title);
        recommendationsDiv.appendChild(block);
    });
}

// Function to like a movie
async function likeMovie(movieId) {
    try {
        const response = await fetch('http://localhost:3000/like', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ movieId }),
        });

        if (!response.ok) {
            throw new Error('Failed to like movie');
        }

        const data = await response.json();
        console.log('Movie liked:', data); // Debugging
        alert('Movie liked! Recommendations will update accordingly.');
    } catch (error) {
        console.error('Error liking movie:', error);
        alert('Failed to like movie. Please try again.');
    }
}