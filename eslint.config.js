import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'android/**', 'ios/**', 'firebase/**']
  },
  {
    ...js.configs.recommended,
    rules: {
      ...js.configs.recommended.rules,
      'no-empty': 'off',
      'no-extra-boolean-cast': 'off',
      'no-irregular-whitespace': 'off',
      'no-misleading-character-class': 'off',
      'no-unused-vars': 'off',
      'no-useless-assignment': 'off'
    }
  },
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser
      }
    }
  },
  {
    files: ['test/**/*.js', 'tools/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    },
    rules: {
      'no-unused-vars': ['error', {argsIgnorePattern: '^_'}]
    }
  },
  {
    files: [
      'src/cardUi.js',
      'src/calloutAudio.js',
      'src/gameView.js',
      'src/homeView.js',
      'src/langMenu.js',
      'src/modalViews.js',
      'src/profileSettings.js',
      'src/roomView.js',
      'src/roomGameRuntime.js',
      'src/roomLifecycle.js',
      'src/roomMutations.js',
      'src/roomRosterSync.js',
      'src/roomSubscription.js',
      'src/roomTimeouts.js',
      'src/soloState.js'
    ],
    rules: {
      'no-unused-vars': ['error', {argsIgnorePattern: '^_'}]
    }
  }
];
