const fs = require('fs');
const { Font, woff2 } = require('fonteditor-core');

async function test() {
  try {
    const buffer = fs.readFileSync('test.woff2');
    console.log("File size:", buffer.length);
    await woff2.init();
    
    console.log("Creating Font object...");
    const font = Font.create(buffer, { type: 'woff2', hinting: true });
    
    console.log("Writing TTF...");
    const ttf = font.write({ type: 'ttf' });
    console.log("TTF size:", ttf.length);
    
    console.log("Writing OTF...");
    const otf = font.write({ type: 'otf' });
    console.log("OTF size:", otf.length);
    
    console.log("Success");
  } catch (e) {
    console.error("Test Error:", e);
  }
}

test();
