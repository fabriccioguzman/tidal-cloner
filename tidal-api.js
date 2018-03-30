const term = require('terminal-kit').terminal;
const fetch = require('node-fetch');
const utils = require('./utils');

const host = 'https://api.tidal.com/v1';
const options = { limit: 9999 };

function getFavouritesForEntity(entity, sessionToken, countryCode, userId, embedded = true) {
  return new Promise((resolve, reject) => {
    const { limit } = options;

    if (!sessionToken || !userId) {
      return reject();
    }

    fetch(`${host}/users/${userId}/favorites/${entity}s?limit=${limit}&countryCode=${countryCode}`, {
      method: 'GET',
      headers: {
        'X-Tidal-SessionId': sessionToken,
      },
    }).then((response) => {
      if (response.status === 200) {
        return response.json().then((json) => {
          resolve(json.items.map(item => {
            let data = item;

            if (embedded) {
              data = item.item;
              data.favourited = utils.parseJSONDate(item.created);
            }

            return data;
          }));
        }).catch(reject);
      }

      reject();
    }).catch(reject);
  });
}

function getEntity(entity, entityId, sessionToken, countryCode) {
  return new Promise((resolve, reject) => {
    if (!sessionToken || !entityId) {
      return reject();
    }

    fetch(`${host}/${entity}s/${entityId}?countryCode=${countryCode}`, {
      method: 'GET',
      headers: {
        'X-Tidal-SessionId': sessionToken,
      },
    }).then((response) => {
      if (response.status === 200) {
        return response.json().then((json) => {
          resolve(Object.assign({ etag: response.headers.get('ETag') }, json));
        }).catch(reject);
      }

      reject();
    }).catch(reject);
  });
}

function getEntityTracks(entity, entityId, sessionToken, countryCode, offset = 0) {
  return new Promise((resolve, reject) => {
    if (!sessionToken || !entityId) {
      return reject();
    }

    fetch(`${host}/${entity}s/${entityId}/items?countryCode=${countryCode}&limit=100` +
      `&offset=${offset}&order=INDEX&orderDirection=ASC`, {
      method: 'GET',
      headers: {
        'X-Tidal-SessionId': sessionToken,
      },
    }).then((response) => {
      if (response.status === 200) {
        return response.json();
      }

      reject();
    }).then((json) => {
      if (json.items) {
        resolve(json.items.map(item => item.item));
      } else {
        reject();
      }
    }).catch(reject);
  });
}

function favouriteEntity(entity, key, entityId, sessionToken, countryCode, userId) {
  return new Promise((resolve, reject) => {
    if (!sessionToken || !entityId || !userId) {
      return reject();
    }

    fetch(`${host}/users/${userId}/favorites/${entity}s?countryCode=${countryCode}`, {
      method: 'POST',
      headers: {
        'X-Tidal-SessionId': sessionToken,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `${key}=${entityId}`,
    }).then((response) => {
      if (response.status === 200) {
        resolve();
      }

      reject();
    }).catch(reject);
  });
}

function unfavouriteEntity(entity, entityId, sessionToken, countryCode, userId) {
  return new Promise((resolve, reject) => {
    if (!sessionToken || !entityId || !userId) {
      return reject();
    }

    fetch(`${host}/users/${userId}/favorites/${entity}s/${entityId}?countryCode=${countryCode}`, {
      method: 'DELETE',
      headers: {
        'X-Tidal-SessionId': sessionToken,
      },
    }).then((response) => {
      if (response.status === 200) {
        resolve();
      }

      reject();
    }).catch(reject);
  });
}

module.exports = {
  authenticate(username, password) {
    term.yellow('\n\nAuthenticating...\n');

    const muData = {
      username,
      password,
      clientUniqueKey: '39A39F0B398C100E',
    };
    const muBody = Object.keys(muData).map(key => `${key}=${muData[key]}`).join('&');

    return fetch(`${host}/login/username`, {
      method: 'POST',
      headers: {
        'X-Tidal-Token': 'BI218mwp9ERZ3PFI',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: muBody,
    }).then((response) => {
      if (response.status === 200) {
        return response.json().then((json) => {
          term.green('Authenticated.\n');

          return Promise.resolve({
            userId: json.userId,
            sessionId: json.sessionId,
            countryCode: json.countryCode,
          });
        }).catch(() => Promise.reject());
      }

      return Promise.reject();
    }).catch(() => Promise.reject());
  },

  albums(sessionToken, countryCode, userId) {
    return getFavouritesForEntity('album', sessionToken, countryCode, userId);
  },

  artists(sessionToken, countryCode, userId) {
    return getFavouritesForEntity('artist', sessionToken, countryCode, userId);
  },

  playlists(sessionToken, countryCode, userId) {
    return getFavouritesForEntity('playlist', sessionToken, countryCode, userId);
  },

  album(sessionToken, countryCode, albumId) {
    return getEntity('album', albumId, sessionToken, countryCode);
  },

  artist(sessionToken, countryCode, artistId) {
    return getEntity('artist', artistId, sessionToken, countryCode);
  },

  playlist(sessionToken, countryCode, playlistId) {
    return getEntity('playlist', playlistId, sessionToken, countryCode);
  },

  playlistTracks(sessionToken, countryCode, playlistId, offset = 0) {
    return getEntityTracks('playlist', playlistId, sessionToken, countryCode, offset);
  },

  favouriteAlbum(sessionToken, countryCode, albumId, userId) {
    return favouriteEntity('album', 'albumId', albumId, sessionToken, countryCode, userId);
  },

  favouriteArtist(sessionToken, countryCode, artistId, userId) {
    return favouriteEntity('artist', 'artistId', artistId, sessionToken, countryCode, userId);
  },

  favouritePlaylist(sessionToken, countryCode, playlistId, userId) {
    return favouriteEntity('playlist', 'uuid', playlistId, sessionToken, countryCode, userId);
  },

  unfavouriteAlbum(sessionToken, countryCode, albumId, userId) {
    return unfavouriteEntity('album', albumId, sessionToken, countryCode, userId);
  },

  unfavouriteArtist(sessionToken, countryCode, artistId, userId) {
    return unfavouriteEntity('artist', artistId, sessionToken, countryCode, userId);
  },

  unfavouritePlaylist(sessionToken, countryCode, playlistId, userId) {
    return unfavouriteEntity('playlist', playlistId, sessionToken, countryCode, userId);
  },

  userPlaylists(sessionToken, countryCode, userId) {
    return new Promise((resolve, reject) => {
      const { limit } = options;

      if (!sessionToken || !countryCode || !userId) {
        return reject();
      }

      fetch(`${host}/users/${userId}/playlists?countryCode=${countryCode}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'X-Tidal-SessionId': sessionToken,
        },
      }).then(response => {
        if (response.status === 200) {
          return response.json();
        }

        reject();
      }).then(json => {
        resolve(json.items);
      }).catch(reject);
    });
  },

  createUserPlaylist(sessionToken, countryCode, userId, title) {
    return new Promise((resolve, reject) => {
      if (!sessionToken || !countryCode || !userId || !title) {
        return reject();
      }

      fetch(`${host}/users/${userId}/playlists?countryCode=${countryCode}`, {
        method: 'POST',
        headers: {
          'X-Tidal-SessionId': sessionToken,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `title=${title}&description=`,
      }).then((response) => {
        if (response.status === 201) {
          return response.json();
        }

        reject();
      }).then((json) => {
        resolve(json.uuid);
      }).catch(reject);
    });
  },

  addTracksToUserPlaylist(sessionToken, countryCode, playlistId, eTag, trackIds = []) {
    return new Promise((resolve, reject) => {
      if (!sessionToken || !countryCode || !playlistId || !eTag) {
        return reject();
      }

      fetch(`${host}/playlists/${playlistId}/items?countryCode=${countryCode}`, {
        method: 'POST',
        headers: {
          'X-Tidal-SessionId': sessionToken,
          'If-None-Match': eTag,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `trackIds=${encodeURIComponent(trackIds.join())}&toIndex=0`,
      }).then((response) => {
        if (response.status === 200) {
          return resolve();
        }

        reject();
      }).catch(reject);
    });
  },

  deleteUserPlaylist(sessionToken, countryCode, playlistId) {
    return new Promise((resolve, reject) => {
      if (!sessionToken || !countryCode || !playlistId) {
        return reject();
      }

      fetch(`${host}/playlists/${playlistId}?countryCode=${countryCode}`, {
        method: 'DELETE',
        headers: {
          'X-Tidal-SessionId': sessionToken,
        },
      }).then((response) => {
        if (response.status === 204) {
          resolve();
        }

        reject();
      }).catch(reject);
    });
  },
};
