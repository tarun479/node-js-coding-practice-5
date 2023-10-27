const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializingDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3009);
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializingDBAndServer();

const convertDbObjectToResponse = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const convertDirectDbObjectToResponse = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

app.get("/movies/", async (request, response) => {
  const getMovieNames = `
        SELECT movie_name
        FROM 
        movie;
    `;
  const movieNames = await db.all(getMovieNames);
  response.send(
    movieNames.map((eachMovie) => ({
      movieName: eachMovie.movie_name,
    }))
  );
});

app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const createMovie = `
        INSERT INTO movie
        (director_id, movie_name, lead_actor)
        VALUES 
        (${directorId}, '${movieName}', '${leadActor}');
    `;
  await db.run(createMovie);
  response.send("Movie Successfully Added");
});

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovie = `
        SELECT *
        FROM 
        movie
        WHERE movie_id = ${movieId};
    `;
  const movie = await db.get(getMovie);
  response.send(convertDbObjectToResponse(movie));
});

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const updateMovie = `
        UPDATE
        movie
        SET
        director_id = ${directorId},
        movie_name = '${movieName}',
        lead_actor = '${leadActor}';
    `;
  await db.run(updateMovie);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovie = `
        DELETE FROM
        movie
        WHERE movie_id = ${movieId};
    `;
  await db.run(deleteMovie);
  response.send("Movie Removed");
});

app.get("/directors/", async (request, response) => {
  const getDirectors = `
        SELECT *
        FROM director;
    `;
  const directorsArray = await db.all(getDirectors);
  response.send(
    directorsArray.map((eachDirector) =>
      convertDirectDbObjectToResponse(eachDirector)
    )
  );
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMovies = `
        SELECT movie_name
        FROM movie
        WHERE director_id = ${directorId};
    `;
  const moviesOfDirectorArray = await db.all(getDirectorMovies);
  response.send(
    moviesOfDirectorArray.map((each) => ({ movieName: each.movie_name }))
  );
});

module.exports = app;
