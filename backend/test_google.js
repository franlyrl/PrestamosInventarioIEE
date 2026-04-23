const google = require('googlethis');

async function test(query) {
    try {
        const images = await google.image(query, { safe: false });
        if (images && images.length > 0) {
        } else {
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
