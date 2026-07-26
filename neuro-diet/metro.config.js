const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add 'mjs' to handle radix-ui web primitives resolution
config.resolver.sourceExts.push('mjs');

module.exports = config;
