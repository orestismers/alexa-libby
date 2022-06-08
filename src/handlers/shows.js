import getProvider, {PROVIDER_TYPE} from '../api/getProvider';

import buildCard from '../lib/buildCard';
import buildReprompt from '../lib/buildReprompt';
import getArtwork from '../lib/getArtwork';

import {
  ADD_SHOW,
  ALREADY_WANTED,
  NO_SHOW_FOUND,
  NO_SHOW_QUEUED
} from '../responses/shows';

export async function handleFindShowIntent(req, resp) {
  const api = getProvider(PROVIDER_TYPE.SHOWS);
  const showName = req.slot('showName');

  let shows = await api.list(showName);
  const [result] = shows;

  if (!result) {
    resp.say(NO_SHOW_QUEUED(showName));
    shows = await api.search(showName);

    if (!shows || !shows.length) {
      return resp.say(NO_SHOW_FOUND(showName)).send();
    }

    return resp
      .say(ADD_SHOW(shows[0].title))
      .session('promptData', buildReprompt(shows, PROVIDER_TYPE.SHOWS))
      .shouldEndSession(false);
  }
  else {
    const responseText = ALREADY_WANTED(result.title.replace('\'s', 's'));

    const artwork = await getArtwork(result);
    if (artwork) {
      resp.card(buildCard(result.title, artwork, responseText));
    }

    return resp.say(responseText);
  }
}

export async function handleAddShowIntent(req, resp) {
  const api = getProvider(PROVIDER_TYPE.SHOWS);
  const showName = req.slot('showName');

  const shows = await api.search(showName);

  if (!shows || !shows.length) {
    return resp.say(NO_SHOW_FOUND(showName)).send();
  }

  return resp
    .say(ADD_SHOW(shows[0].title))
    .session('promptData', buildReprompt(shows, PROVIDER_TYPE.SHOWS))
    .shouldEndSession(false);
}
