const term = require('terminal-kit').terminal;
const api = require('./tidal-api');
const utils = require('./utils');

const MASTER = 'HI_RES';

function favouriteSortFn(a, b) {
  return a.favourited - b.favourited;
}

function getUsername() {
  return new Promise((resolve, reject) => {
    term('Username: ');

    term.inputField((usernameError, username) => {
      if (usernameError) {
        return reject();
      }

      resolve(username);
    });
  });
}

function getPassword() {
  return new Promise((resolve, reject) => {
    term('\nPassword: ');

    term.inputField({ echo: false }, (passwordError, password) => {
      if (passwordError) {
        return reject();
      }

      resolve(password);
    });
  });
}

module.exports = {
  authenticate(usernameArg) {
    return new Promise((resolve, reject) => {
      new Promise((innerResolve, innerReject) => {
        if (!usernameArg) {
          getUsername().then(usernameInput => {
            getPassword()
              .then(passwordInput => innerResolve({
                username: usernameInput,
                password: passwordInput,
              }))
              .catch(innerReject);
          }).catch(innerReject);
        } else {
          getPassword()
            .then(passwordInput => innerResolve({
              username: usernameArg,
              password: passwordInput,
            }))
            .catch(innerReject);
        }
      }).then((credentials) => {
        api.authenticate(credentials.username, credentials.password).then((token) => {
          resolve(token);
        }).catch(() => {
          term.red('Failed.\n');

          reject();
        });
      });
    });
  },

  checkAlbums(sessionId1, sessionId2, countryCode1, countryCode2, userId1) {
    return new Promise((resolve, reject) => {
      api.albums(sessionId1, countryCode1, userId1).then(albums => {
        term('\nChecking Albums\n');

        let chain = Promise.resolve();

        albums.forEach(album => {
          chain = chain.then(data => {
            if (data) {
              term.green(`${album.audioQuality === MASTER ? 'M' : '*'} ${data.title} - ${data.artist.name}\n`);
            }

            return api.album(sessionId2, countryCode2, album.id);
          }).catch(() => new Promise(innerResolve => {
            api.album(sessionId1, countryCode1, album.id).then(data => {
              term.red(`${album.audioQuality === MASTER ? 'M' : '*'} ${data.title} - ${data.artist.name}\n`);

              innerResolve();
            }).catch(() => {
              term.yellow(`${album.audioQuality === MASTER ? 'M' : '*'} ${album.title} [${album.id}] - ${album.artist.name} - Not available on any account\n`);

              innerResolve();
            });
          }));
        });

        chain.then(resolve);
      }).catch(reject);
    });
  },

  checkArtists(sessionId1, sessionId2, countryCode1, countryCode2, userId1) {
    return new Promise((resolve, reject) => {
      api.artists(sessionId1, countryCode1, userId1).then(artists => {
        term('\nChecking Artists\n');

        let chain = Promise.resolve();

        artists.forEach(artist => {
          chain = chain.then(data => {
            if (data) {
              term.green(`* ${data.name}\n`);
            }

            return api.artist(sessionId2, countryCode2, artist.id);
          }).catch(() => new Promise(innerResolve => {
            api.artist(sessionId1, countryCode1, artist.id).then(data => {
              term.red(`* ${data.name}\n`);

              innerResolve();
            }).catch(() => {
              term.yellow(`* ${artist.name} [${artist.id}] - Not available on any account\n`);

              innerResolve();
            });
          }));
        });

        chain.then(resolve);
      }).catch(reject);
    });
  },

  checkPlaylists(sessionId1, sessionId2, countryCode1, countryCode2, userId1) {
    return new Promise((resolve, reject) => {
      api.playlists(sessionId1, countryCode1, userId1).then(playlists => {
        term('\nChecking Playlists\n');

        let chain = Promise.resolve();

        playlists.forEach(playlist => {
          chain = chain.then(data => {
            if (data) {
              term.green(`* ${data.title}\n`);
            }

            return api.playlist(sessionId2, countryCode2, playlist.uuid);
          }).catch(() => new Promise(innerResolve => {
            api.playlist(sessionId1, countryCode1, playlist.uuid).then(data => {
              term.red(`* ${data.title}\n`);

              innerResolve();
            }).catch(() => {
              term.yellow(`* ${playlist.title} [${playlist.uuid}] - Not available on any account\n`);

              innerResolve();
            });
          }));
        });

        chain.then(resolve);
      }).catch(reject);
    });
  },

  cloneAlbums(sessionId1, sessionId2, countryCode1, countryCode2, userId1, userId2) {
    return new Promise((resolve, reject) => {
      api.albums(sessionId1, countryCode1, userId1).then(albums => {
        term('\nCloning Albums\n');

        let chain = Promise.resolve();

        albums.sort(favouriteSortFn).forEach(album => {
          chain = chain.then(() => {
            if (album.title) {
              term.green(`* ${album.title} - ${album.artist.name}\n`);
            }

            return api.favouriteAlbum(sessionId2, countryCode2, album.id, userId2);
          }).catch(() => {
            term.red(`* ${album.title} [${album.id}] - ${album.artist.name} - Not available\n`);

            return Promise.resolve();
          });
        });

        chain.then(resolve);
      }).catch(reject);
    });
  },

  cloneArtists(sessionId1, sessionId2, countryCode1, countryCode2, userId1, userId2) {
    return new Promise((resolve, reject) => {
      api.artists(sessionId1, countryCode1, userId1).then(artists => {
        term('\nCloning Artists\n');

        let chain = Promise.resolve();

        artists.sort(favouriteSortFn).forEach(artist => {
          chain = chain.then(() => {
            if (artist.name) {
              term.green(`* ${artist.name}\n`);
            }

            return api.favouriteArtist(sessionId2, countryCode2, artist.id, userId2);
          }).catch(() => {
            term.red(`* ${artist.name} [${artist.id}] - Not available\n`);

            return Promise.resolve();
          });
        });

        chain.then(resolve);
      }).catch(reject);
    });
  },

  clonePlaylists(sessionId1, sessionId2, countryCode1, countryCode2, userId1, userId2) {
    return new Promise((resolve, reject) => {
      api.playlists(sessionId1, countryCode1, userId1).then(playlists => {
        term('\nCloning Playlists\n');

        let chain = Promise.resolve();

        playlists.sort(favouriteSortFn).forEach(playlist => {
          chain = chain.then(() => {
            if (playlist.title) {
              term.green(`* ${playlist.title}\n`);
            }

            return api.favouritePlaylist(sessionId2, countryCode2, playlist.uuid, userId2);
          }).catch(() => {
            term.red(`* ${playlist.title} [${playlist.uuid}] - Not available\n`);

            return Promise.resolve();
          });
        });

        chain.then(resolve);
      }).catch(reject);
    });
  },

  cloneUserPlaylists(sessionId1, sessionId2, countryCode1, countryCode2, userId1, userId2) {
    return new Promise((resolve, reject) => {
      const clonablePlaylists = [];

      api.userPlaylists(sessionId1, countryCode1, userId1).then(playlists => {
        term('\nRetrieving User Playlists\n');

        let chain = Promise.resolve();

        playlists
          .sort((a, b) => utils.parseJSONDate(a.created) - utils.parseJSONDate(b.created))
          .forEach(playlist => {
            chain = chain.then(() => {
              term.green(`* ${playlist.title}\n`);

              return api.createUserPlaylist(sessionId2, countryCode2, userId2, playlist.title);
            }).then(data => {
              clonablePlaylists.push({
                id: data,
                originalId: playlist.uuid,
                title: playlist.title,
                tracks: [],
                total: playlist.numberOfTracks,
              });

              return api.playlist(sessionId2, countryCode2, data);
            }).then(data => {
              clonablePlaylists[clonablePlaylists.length - 1].eTag = data.etag;

              return Promise.resolve();
            }).catch(() => {
              term.red(`* ${playlist.title} [${playlist.uuid}] - Failed\n`);

              return Promise.resolve();
            });
          });

        chain.then(() => {
          let tracksChain = Promise.resolve();

          term('\nRetrieving Tracks\n');

          clonablePlaylists.forEach(clonablePlaylist => {
            const pages = Math.ceil(clonablePlaylist.total / 100);

            Array.from(Array(pages).keys()).forEach(index => {
              tracksChain = tracksChain.then(() => {
                term.green(`* ${clonablePlaylist.title}\n`);

                return api.playlistTracks(
                  sessionId1,
                  countryCode1,
                  clonablePlaylist.originalId,
                  index * 100,
                );
              }).then(data => {
                const tracks = data.map(track => track.id);

                clonablePlaylist.tracks = clonablePlaylist.tracks.concat(tracks);

                return Promise.resolve();
              });
            });
          });

          tracksChain.then(() => {
            let cloneChain = Promise.resolve();

            term('\nCloning User Playlists\n');

            clonablePlaylists.forEach(clonablePlaylist => {
              cloneChain = cloneChain.then(() => {
                term.green(`* ${clonablePlaylist.title}\n`);

                return api.addTracksToUserPlaylist(
                  sessionId2,
                  countryCode2,
                  clonablePlaylist.id,
                  clonablePlaylist.eTag,
                  clonablePlaylist.tracks,
                );
              });
            });

            cloneChain.then(resolve).catch(reject);
          }).catch(reject);
        });
      }).catch(reject);
    });
  },

  clearAlbums(sessionId, countryCode, userId) {
    return new Promise((resolve, reject) => {
      api.albums(sessionId, countryCode, userId).then(albums => {
        term('\nClearing Albums\n');

        let chain = Promise.resolve();

        albums.forEach(album => {
          chain = chain.then(() => {
            if (album.title) {
              term.green(`* ${album.title} - ${album.artist.name}\n`);
            }

            return api.unfavouriteAlbum(sessionId, countryCode, album.id, userId);
          }).catch(() => {
            term.red(`* ${album.title} [${album.id}] - ${album.artist.name} - Not available\n`);

            return Promise.resolve();
          });
        });

        chain.then(resolve);
      }).catch(reject);
    });
  },

  clearArtists(sessionId, countryCode, userId) {
    return new Promise((resolve, reject) => {
      api.artists(sessionId, countryCode, userId).then(artists => {
        term('\nClearing Artists\n');

        let chain = Promise.resolve();

        artists.forEach(artist => {
          chain = chain.then(() => {
            if (artist.name) {
              term.green(`* ${artist.name}\n`);
            }

            return api.unfavouriteArtist(sessionId, countryCode, artist.id, userId);
          }).catch(() => {
            term.red(`* ${artist.name} [${artist.id}] - Not available\n`);

            return Promise.resolve();
          });
        });

        chain.then(resolve);
      }).catch(reject);
    });
  },

  clearPlaylists(sessionId, countryCode, userId) {
    return new Promise((resolve, reject) => {
      api.playlists(sessionId, countryCode, userId).then(playlists => {
        term('\nClearing Playlists\n');

        let chain = Promise.resolve();

        playlists.forEach(playlist => {
          chain = chain.then(() => {
            if (playlist.title) {
              term.green(`* ${playlist.title}\n`);
            }

            return api.unfavouritePlaylist(sessionId, countryCode, playlist.uuid, userId);
          }).catch(() => {
            term.red(`* ${playlist.title} [${playlist.id}] - Not available\n`);

            return Promise.resolve();
          });
        });

        chain.then(resolve);
      }).catch(reject);
    });
  },

  clearUserPlaylists(sessionId, countryCode, userId) {
    return new Promise((resolve, reject) => {
      api.userPlaylists(sessionId, countryCode, userId).then(playlists => {
        term('\nClearing User Playlists\n');

        let chain = Promise.resolve();

        playlists.forEach(playlist => {
          chain = chain.then(() => {
            if (playlist.title) {
              term.green(`* ${playlist.title}\n`);
            }

            return api.deleteUserPlaylist(sessionId, countryCode, playlist.uuid);
          });
        });

        chain.then(resolve).catch(reject);
      }).catch(reject);
    });
  },
};
