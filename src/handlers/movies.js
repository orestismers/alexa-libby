import getProvider, { PROVIDER_TYPE } from '../api/getProvider';

import buildCard from '../lib/buildCard';
import buildReprompt from '../lib/buildReprompt';
import getArtwork from '../lib/getArtwork';
import parseDate from '../lib/parseDate';

import * as Alexa from 'ask-sdk';

import {
  ADD_NOT_FOUND,
  ADD_PROMPT,
  ALREADY_WANTED,
  NO_MOVIE_FOUND,
  NO_MOVIE_SLOT
} from '../responses/movies';

export async function handleFindMovieIntent(req) {
  // If there is no movie field
  const movieName = Alexa.getSlotValue(req.requestEnvelope, 'movieName');
  if (!movieName) {
    return req.responseBuilder
      .speak(NO_MOVIE_SLOT())
      .withShouldEndSession(true)
      .getResponse();
  }

  // Search movie provider for the movie
  const api = getProvider(PROVIDER_TYPE.MOVIES);
  const movies = await api.list(movieName);

  // If found, say movie exists and display card
  if (movies && movies.length) {
    const [result] = movies;
    const responseText = ALREADY_WANTED(result.title, result.year);

    const artwork = await getArtwork(result);
    if (artwork) {
      req.responseBuilder.withStandardCard(`${result.title} (${result.year})`, responseText, artwork);
    } else {
      req.responseBuilder.withSimpleCard(`${result.title} (${result.year})`, responseText);
    }

    return req.responseBuilder
      .speak(ALREADY_WANTED(result.title, result.year))
      .getResponse();
  }

  // Search for movie
  const query = buildQuery(req);
  const movieSearch = await api.search(query);

  // If not found say not found
  if (!movieSearch || !movieSearch.length) {
    return req.responseBuilder
      .speak(NO_MOVIE_FOUND(query))
      .getResponse();
  }

  // Ask to add and display card
  const [result] = movieSearch;
   
  const artwork = await getArtwork(result);
  const responseText = NO_MOVIE_FOUND(query) + " " + ADD_PROMPT(result.title, result.year);
  if (artwork) {
    req.responseBuilder.withStandardCard(`${result.title} (${result.year})`, responseText, artwork);
  } else {
    req.responseBuilder.withSimpleCard(`${result.title} (${result.year})`, responseText);
  }

  return req.responseBuilder
    .speak(responseText)
    .reprompt(responseText)
    .withApiResponse(buildReprompt(movieSearch, PROVIDER_TYPE.MOVIES))
    .getResponse();
}

export async function handleAddMovieIntent(req, resp) {
  const movieName = req.slot('movieName');

  if (!movieName) {
    return Promise.resolve(resp.say(NO_MOVIE_SLOT()));
  }

  const api = getProvider(PROVIDER_TYPE.MOVIES);
  const query = buildQuery(req);
  const movies = await api.search(query);


  if (movies && movies.length) {
    const [topResult] = movies;
    resp
      .speak(ADD_PROMPT(topResult.title, topResult.year))
      .session('promptData', buildReprompt(movies, PROVIDER_TYPE.MOVIES))
      .getResponse();
  }
  else {
    resp.say(ADD_NOT_FOUND(movieName));
  }

  return Promise.resolve(resp);
}

function buildQuery(req) {
  const movieName = Alexa.getSlotValue(req.requestEnvelope, 'movieName');
  const releaseDate = Alexa.getSlotValue(req.requestEnvelope, 'releaseDate');

  return releaseDate ? `${movieName} ${releaseDate}` : movieName;
}
