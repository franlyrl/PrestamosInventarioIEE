const google = require('googlethis');

async function test(query) {
    console.log(`\nSearching: ${query}`);
    try {
        const images = await google.image(query, { safe: false });
        if (images && images.length > 0) {
            console.log(`First image URL: ${images[0].url}`);
        } else {
            console.log("No images found");
        }
    } catch(e) {
        console.error("Error:", e.message);
    }
}

async function run() {
    await test("Cautín Bakú");
    await test("Multímetro Fluke");
    await test("Arduino Uno original");
}

run();
