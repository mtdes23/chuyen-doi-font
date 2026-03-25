const fs = require('fs');
const { Font, woff2 } = require('fonteditor-core');

async function test() {
  try {
    await woff2.init();
    console.log("woff2 initialized");
    // We don't have a woff2 file yet, but we can verify it imports correctly
  } catch (e) {
    console.error(e);
  }
}

test();
