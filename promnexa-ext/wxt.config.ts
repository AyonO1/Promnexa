import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Promnexa — AI Prompt Optimizer',
    description: 'Turn ideas into better prompts. An intelligent prompt optimizer that transforms simple instructions into powerful, well-structured AI prompts.',
    version: '1.0.0',
    permissions: ['storage', 'contextMenus', 'activeTab'],
    icons: {
      16: '/icon/16.png',
      32: '/icon/32.png',
      48: '/icon/48.png',
      128: '/icon/128.png',
    },
    action: {
      default_title: 'Promnexa — AI Prompt Optimizer',
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Ctrl+Shift+P',
          mac: 'Command+Shift+P',
        },
        description: 'Open Promnexa',
      },
    },
    browser_specific_settings: {
      gecko: {
        id: 'promnexa@promnexa.com',
        strict_min_version: '109.0',
      },
    },
  },
});
