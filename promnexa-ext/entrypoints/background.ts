export default defineBackground(() => {
  // Context menu setup
  browser.runtime.onInstalled.addListener(() => {
    // Create context menu items
    const menuItems = [
      {
        id: 'promnexa-optimize',
        title: 'Optimize with Promnexa',
        contexts: ['selection'] as ['selection'],
      },
      {
        id: 'promnexa-explain',
        title: 'Explain with Promnexa',
        contexts: ['selection'] as ['selection'],
      },
      {
        id: 'promnexa-summarize',
        title: 'Summarize with Promnexa',
        contexts: ['selection'] as ['selection'],
      },
      {
        id: 'promnexa-create-prompt',
        title: 'Create prompt from selection',
        contexts: ['selection'] as ['selection'],
      },
    ];

    for (const item of menuItems) {
      browser.contextMenus.create(item);
    }

    console.log('Promnexa: Context menus created');
  });

  // Handle context menu clicks
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    const selectedText = info.selectionText;
    if (!selectedText) return;

    // Store the selected text and action for the popup to use
    let action = '';
    switch (info.menuItemId) {
      case 'promnexa-optimize':
        action = 'optimize';
        break;
      case 'promnexa-explain':
        action = 'explain';
        break;
      case 'promnexa-summarize':
        action = 'summarize';
        break;
      case 'promnexa-create-prompt':
        action = 'create-prompt';
        break;
    }

    if (action) {
      await browser.storage.local.set({
        promnexa_context_action: {
          action,
          text: selectedText,
          timestamp: Date.now(),
        },
      });

      // Open the popup (via action)
      // Note: browser.action.openPopup() may not be available in all browsers
      // The user can click the extension icon to see the result
    }
  });

  // Handle messages from content scripts
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PROMNEXA_OPTIMIZE') {
      // Store for popup
      browser.storage.local.set({
        promnexa_context_action: {
          action: 'optimize',
          text: message.text,
          timestamp: Date.now(),
        },
      });
      sendResponse({ success: true });
    }
    return true;
  });

  console.log('Promnexa background script loaded');
});
