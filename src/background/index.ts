import { initializeStorage } from '@/storage';

chrome.runtime.onInstalled.addListener(() => {
  initializeStorage();
});
