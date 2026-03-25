const fs = require('fs');
const wawoff2 = require('wawoff2');

async function test() {
  try {
    const buffer = fs.readFileSync('test.woff2');
    console.log("File size:", buffer.length);
    
    console.log("Decompressing WOFF2...");
    const ttf = await wawoff2.decompress(buffer);
    console.log("TTF size:", ttf.length);
    
    console.log("Success with wawoff2!");
  } catch (e) {
    console.error("Test Error:", e);
  }
}

test();
