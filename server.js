const axios = require('axios');
const express = require('express');
const http = require('http');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());



app.get('/', (req, res) => {
    let url = 'https://api.themoviedb.org/3/movie/602223?api_key=0daec713ad8428a0c38e8498347a8730';
    axios.get(url)
    .then(response => {
        console.log(response.data.title);
        let data = response.data;
        let releaseDate = new Date(data.release_date).getFullYear();
        let genres = '';

        data.genres.forEach(genre => {
            genres = genres + `${genre.name}, `;
        });

        
        let genresUpdated = genres.slice(0, -2) + '.';
        moviePoster = `https://image.tmdb.org/t/p/w600_and_h900_bestv2${data.poster_path}`;
        console.log(genresUpdated);
        let currentYear = new Date().getFullYear();
        res.render('index', {dataToRender: data, releaseDate: releaseDate, genres: genresUpdated, poster: moviePoster, year: currentYear});
    });
    
})

app.get('/search', (req, res) => {
    res.render('search', {movieDetails:''});
});

app.post('/search', (req, res) => {
    let userMovieTitle = req.body.movieTitle;

    let movieUrl = `https://api.themoviedb.org/3/search/movie?api_key=0daec713ad8428a0c38e8498347a8730&query=${userMovieTitle}`;
    let genres = 'https://api.themoviedb.org/3/genre/movie/list?api_key=0daec713ad8428a0c38e8498347a8730&language=en-US';
   
    let endpoints = [movieUrl, genres];

    axios.all(endpoints.map((endpoint) => axios.get(endpoint)))
    .then(
        axios.spread((movie, genres) => {
            const [movieRaw] = movie.data.results;
            const movieGenreIds = movieRaw.genre_ids;        
            const movieGenres = genres.data.genres; 
            
            let genresArray = [];
            for(let i = 0; i < movieGenreIds.length; i++) {
                for(let j = 0; j < movieGenres.length; j++) {
                    if(movieGenreIds[i] === movieGenres[j].id) {
                        console.log(movieGenres[j].name);
                        genresArray.push(movieGenres[j].name)
                    }
                    
                }
            }

            let genresToDisplay = '';
            genresArray.forEach(genre => {
                genresToDisplay = genresToDisplay+ `${genre}, `;
            });

            genresToDisplay = genresToDisplay.slice(0, -2) + '.';
            
            let movieData = {
                title: movieRaw.original_title,
                year: new Date(movieRaw.release_date).getFullYear(),
                overview: movieRaw.overview,
                posterUrl: `https://image.tmdb.org/t/p/w500/${movieRaw.poster_path}`,
                genres: genresToDisplay

            };

            res.render('search', {movieDetails: movieData});
        })
      );
    
});

//new route
app.post('/getmovie', (req, res) => {
	const movieToSearch =
		req.body.queryResult && req.body.queryResult.parameters && req.body.queryResult.parameters.movie
			? req.body.queryResult.parameters.movie
			: '';

	const reqUrl = encodeURI(
		`http://www.omdbapi.com/?t=${movieToSearch}&apikey=1cdd3df7`
	);
	http.get(
		reqUrl,
		responseFromAPI => {
			let completeResponse = ''
			responseFromAPI.on('data', chunk => {
				completeResponse += chunk
			})
			responseFromAPI.on('end', () => {
				const movie = JSON.parse(completeResponse);
                if (!movie || !movie.Title) {
                    return res.json({
                        fulfillmentText: 'Sorry, we could not find the movie you are asking for.',
                        source: 'getmovie'
                    });
                }

				let dataToSend = movieToSearch;
				dataToSend = `${movie.Title} was released in the year ${movie.Year}. It is directed by ${
					movie.Director
				} and stars ${movie.Actors}.\n Here some glimpse of the plot: ${movie.Plot}.`;

				return res.json({
					fulfillmentText: dataToSend,
					source: 'getmovie'
				});
			})
		},
		error => {
			return res.json({
				fulfillmentText: 'Could not get results at this time',
				source: 'getmovie'
			});
		}
	)
});



app.listen(process.env.PORT || 3000, () => {
    console.log('server is running');
});

