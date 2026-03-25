const fs = require('fs');
const opentype = require('opentype.js');

async function testWoff() {
  try {
    const filename = 'HelveticaNowDisplay-Black.woff';
    const buffer = fs.readFileSync(filename).buffer;
    
    // Create Font object (API logic)
    const font = opentype.parse(buffer);
    
    // Write TTF
    const ttf = Buffer.from(font.toArrayBuffer());
    console.log(`TTF success! Size: ${ttf.length} bytes`);
    
  } catch (e) {
    console.error("Test Error:", e);
  }
}

testWoff();
