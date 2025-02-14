import config from 'config';
import SonarrAPI from 'sonarr-api';

import serverConfig from './config';
import { PROVIDER_TYPE } from './getProvider';

/**
 * @typedef {Object} MediaResult
 * @property {String} title
 * @property {String} slug
 * @property {Number} year
 * @property {String} tvdbId
 * @property {String} imdbId
 * @property {Array} images
 * @property {String} [status]
 * @property {String} [quality]
 */

let _sonarr, _qualityProfiles;

export default function sonarr() {
  if (!_sonarr) {
    _sonarr = new SonarrAPI(serverConfig(PROVIDER_TYPE.SHOWS));
  }

  return _sonarr;
}

/**
 * Returns the list of shows currently being tracked by sonarr.
 *
 * @param {String} [title] -- Optional title to filter the list of shows by.
 * @returns {Array<MediaResult>}
 */
export async function list(title) {
  await loadQualityProfiles();

  const resp = await sonarr().get('v3/series');
  const shows = resp.map(mapToMediaResult);

  if (title) {
    return shows.filter((show) => {
      return show.title.toLowerCase().indexOf(title.toLowerCase()) !== -1;
    });
  }

  return shows;
}

/**
 * Searches for a new show not in the library.
 *
 * @param {String} query -- Search query to use when looking for the show.
 * @returns {Array<MediaResult>}
 */
export async function search(query) {
  await loadQualityProfiles();
  const resp = await sonarr().get('v3/series/lookup', { term: query });

  return resp.map(mapToMediaResult);
}

/**
 * Adds a show to the library.
 *
 * @param {MediaResult} show -- Show to add to the library.
 * @returns {Object} -- sonarr response object
 */
export async function add(show) {
  const [rootFolderResp] = await sonarr().get('v3/rootfolder');
  const preferredQuality = getPreferredQuality();
  const qualities = await loadQualityProfiles();
  const quality = qualities.find((qt) => {
    return qt.name === preferredQuality;
  });

  const req = {
    tvdbId: show.tvdbId,
    title: show.title,
    titleSlug: show.slug,
    images: show.images,
    seasons: show.seasons,
    qualityProfileId: quality ? quality.id : 1, // Default to 'Any' if no profile set in config
    profileId: quality ? quality.id : 1, // Default to 'Any' if no profile set in config
    rootFolderPath: rootFolderResp.path,
    monitored: true,
    addOptions: {
      searchForMissingEpisodes: true
    }
  };
  return await sonarr().post('series', req);
}

async function loadQualityProfiles() {
  if (!_qualityProfiles) {
    _qualityProfiles = await sonarr().get('v3/qualityprofile');
  }

  return _qualityProfiles;
}

function mapToMediaResult(show) {
  const preferredQuality = getPreferredQuality();
  const quality = _qualityProfiles.find((profile) => {
    return profile.id === show.qualityProfileId || profile.name === preferredQuality;
  });

  return {
    title: show.title,
    slug: show.titleSlug,
    year: show.year,
    tvdbId: show.tvdbId,
    imdbId: show.imdbId,
    images: show.images,
    status: show.status,
    quality: quality ? quality.name : '',
    seasons: show.seasons
  };
}

function getPreferredQuality() {
  const path = `alexa-libby.${PROVIDER_TYPE.SHOWS}.quality`;

  if (config.has(path)) {
    return config.get(path);
  }

  return null;
}
