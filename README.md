CineMatch AI - Movie Recommendation System Documentation
Table of Contents
Project Overview

Features

Technologies Used

Setup Instructions

API Usage

File Structure

Code Structure

Responsive Design

Future Improvements

License

Project Overview
CineMatch AI is a web application that provides personalized movie recommendations based on user input. Users can search for movies they enjoy, and the system will suggest similar films they might like. The application uses the TMDB (The Movie Database) API to fetch movie data and recommendations.

Features
Real-time Search: As-you-type movie search functionality

Movie Recommendations: Get 10 similar/recommended movies

Detailed Movie Information: Includes posters, ratings, runtime, and descriptions

Responsive Design: Works on all device sizes

Modern UI: Clean, attractive interface with smooth animations

Selected Movie Display: Shows the movie you selected before recommendations

Technologies Used
Frontend: HTML5, CSS3, JavaScript (ES6+)

APIs: The Movie Database (TMDB) API

Fonts: Google Fonts (Poppins)

Icons: Font Awesome 6

Version Control: Git/GitHub

Setup Instructions
Clone the repository:

bash
git clone https://github.com/your-username/cinematch-ai.git
Navigate to the project directory:

bash
cd cinematch-ai
Open index.html in your preferred browser.

API Key Setup
To use your own TMDB API key:

Get an API key from TMDB

Replace the existing API key in script.js:

javascript
const TMDB_API_KEY = "your-api-key-here";
API Usage
The application makes the following API calls to TMDB:

Movie Search:

javascript
`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}`
Movie Details:

javascript
`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`
Recommendations:

javascript
`https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}`
Similar Movies:

javascript
`https://api.themoviedb.org/3/movie/${movieId}/similar?api_key=${TMDB_API_KEY}`
File Structure
cinematch-ai/
├── index.html          # Main HTML file
├── style.css           # Stylesheet
├── script.js           # Main JavaScript file
├── README.md           # Project documentation
└── assets/             # (Optional) For additional assets
    ├── images/         # Local images
    └── fonts/          # Local fonts
Code Structure
HTML (index.html)
Header with logo and search functionality

Main content area with:

Loading spinner

Selected movie section

Recommendations section

Footer with social links

CSS (style.css)
Organized using CSS variables for consistent theming

Mobile-first responsive design

Components:

Floating header

Search box with dropdown

Movie cards

Loading spinner

Responsive grid layouts

JavaScript (script.js)
Main functions:

searchMovie(): Handles real-time search

selectMovie(): Processes movie selection

getRecommendations(): Fetches recommended movies

manualSearch(): Fallback search function

Helper functions:

debounce(): Limits API calls during typing

escapeHtml(): Prevents XSS vulnerabilities

Responsive Design
The application is fully responsive with breakpoints at:

992px and above: Desktop layout

768px-991px: Tablet layout

576px-767px: Large mobile layout

Below 576px: Small mobile layout

Key responsive features:

Stacked header elements on mobile

Full-width buttons on small screens

Adaptive movie card layouts

Font size adjustments

Future Improvements
User accounts to save favorite movies

More advanced recommendation algorithms

Movie trailers preview

Filtering/sorting options for recommendations

Dark/light mode toggle

Localization support

Rating prediction based on user preferences

License
This project is licensed under the MIT License - see the LICENSE file for details.