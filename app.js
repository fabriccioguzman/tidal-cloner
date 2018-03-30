#!/usr/bin/env node

const term = require('terminal-kit').terminal;
const argv = require('minimist')(process.argv.slice(2));
const helpers = require('./helpers');

const commands = ['copy', 'check', 'clear'];
const options = {
  master: null,
  clone: null,
  'albums-only': null,
  'artists-only': null,
  'playlists-only': null,
  'user-playlists-only': null,
};
const master = { userId: '', sessionId: '', countryCode: '' };
const clone = { userId: '', sessionId: '', countryCode: '' };

const [command] = argv._;

term.magenta('Tidal Cloner\n\n');

// ensure ctrl-c terminates the process
term.on('key', name => {
  if (name === 'CTRL_C') {
    process.exit();
  }
});

// parse arguments
Object.keys(argv).forEach(key => {
  if (options[key] !== undefined) {
    options[key] = argv[key];
  }
});

if (!commands.includes(command)) {
  term.yellow('Missing command: copy, check or clear.\n');

  process.exit();
}

term.blue('Master Account\n');

helpers.authenticate(options.master).then(response => {
  master.userId = response.userId;
  master.sessionId = response.sessionId;
  master.countryCode = response.countryCode;

  return Promise.resolve();
}).then(() => {
  term.blue('\nClone Account\n');

  return helpers.authenticate(options.clone);
}).then(response => {
  clone.userId = response.userId;
  clone.sessionId = response.sessionId;
  clone.countryCode = response.countryCode;

  if (command === 'check') {
    helpers.checkAlbums(
      master.sessionId,
      clone.sessionId,
      master.countryCode,
      clone.countryCode,
      master.userId,
    ).then(() => helpers.checkArtists(
      master.sessionId,
      clone.sessionId,
      master.countryCode,
      clone.countryCode,
      master.userId,
    )).then(() => helpers.checkPlaylists(
      master.sessionId,
      clone.sessionId,
      master.countryCode,
      clone.countryCode,
      master.userId,
    )).then(() => {
      term('\nDone.\n');

      process.exit();
    }).catch(() => {
      term.red('Failed.');

      process.exit();
    });
  } else if (command === 'copy') {
    helpers.cloneAlbums(
      master.sessionId,
      clone.sessionId,
      master.countryCode,
      clone.countryCode,
      master.userId,
      clone.userId,
    ).then(() => helpers.cloneArtists(
      master.sessionId,
      clone.sessionId,
      master.countryCode,
      clone.countryCode,
      master.userId,
      clone.userId,
    )).then(() => helpers.clonePlaylists(
      master.sessionId,
      clone.sessionId,
      master.countryCode,
      clone.countryCode,
      master.userId,
      clone.userId,
    )).then(() => helpers.cloneUserPlaylists(
      master.sessionId,
      clone.sessionId,
      master.countryCode,
      clone.countryCode,
      master.userId,
      clone.userId,
    )).then(() => {
      term('\nDone.\n');

      process.exit();
    }).catch(() => {
      term.red('Failed.');

      process.exit();
    });
  } else if (command === 'clear') {
    helpers.clearAlbums(
      clone.sessionId,
      clone.countryCode,
      clone.userId,
    ).then(() => helpers.clearArtists(
      clone.sessionId,
      clone.countryCode,
      clone.userId,
    )).then(() => helpers.clearPlaylists(
      clone.sessionId,
      clone.countryCode,
      clone.userId,
    )).then(() => helpers.clearUserPlaylists(
      clone.sessionId,
      clone.countryCode,
      clone.userId,
    )).then(() => {
      term('\nDone.\n');

      process.exit();
    }).catch(() => {
      term.red('Failed.');

      process.exit();
    });
  } else {
    process.exit();
  }
}).catch(process.exit);
