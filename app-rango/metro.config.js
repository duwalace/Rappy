const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Adicionar suporte para TypeScript
config.resolver.sourceExts.push('ts', 'tsx');

// Resolver módulos nativos para mocks na web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    // Retornar um mock vazio para react-native-maps na web
    return {
      type: 'empty',
    };
  }
  // Usar o resolver padrão para outros casos
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;