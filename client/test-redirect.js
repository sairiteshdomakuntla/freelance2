// Test script to check Expo redirect URI
const { makeRedirectUri } = require('expo-auth-session');

console.log('Testing redirect URIs:\n');

// For Expo Go (development)
const devRedirect = makeRedirectUri({
  scheme: 'client',
  path: 'auth-callback',
});
console.log('Development (Expo Go):', devRedirect);

// Using native scheme
const nativeRedirect = makeRedirectUri({
  scheme: 'client',
  path: 'auth-callback',
  native: 'client://auth-callback'
});
console.log('Native:', nativeRedirect);

// For production (using auth.expo.io proxy)
// Format: https://auth.expo.io/@username/slug
console.log('\nFor Google Console, add this redirect URI:');
console.log('https://auth.expo.io/@sairitesh06/client');
console.log('\nOR if you\'re using Expo Go for testing:');
console.log(devRedirect);
