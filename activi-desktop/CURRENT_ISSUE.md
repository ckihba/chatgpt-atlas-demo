# Current Issue: BrowserView Blocking UI

## Problem
The BrowserView is covering the entire window and blocking all mouse interactions with the renderer.html UI elements (including the chat button).

## Why This Happens
- BrowserView in Electron always renders **on top** of the window content
- It's not part of the DOM, it's a separate view layer
- Mouse events go to the BrowserView, not to the underlying HTML

## Solution Options

### Option 1: Use `<webview>` tag instead (RECOMMENDED)
- Webview is part of the DOM
- Can be styled and positioned with CSS
- Allows other UI elements to be on top
- Chat panel can slide over it

### Option 2: Adjust BrowserView bounds dynamically
- Shrink BrowserView when chat opens
- Complex to manage
- Performance overhead

### Option 3: Separate windows
- Chat in separate window
- Not ideal UX

## Implementing Option 1

Change from BrowserView to webview tag:
1. Remove BrowserView from browser-controller.ts
2. Add `<webview>` tag to renderer.html
3. Control webview via IPC
4. Chat panel can now slide over the webview

This is the proper way to build this UI.
