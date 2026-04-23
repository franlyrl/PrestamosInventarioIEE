

async function test(query) {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=filetype:bitmap|drawing ${encodeURIComponent(query)}&gsrlimit=1&prop=imageinfo&iiprop=url&format=json`;
    const res = await fetch(url, { headers: { "User-Agent": "UTN-SPIEE-Bot/1.0" } });
    if (!res.ok) {
        const txt = await res.text();
        return;
    }
    const data = await res.json();
    if (data.query && data.query.pages) {
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];
        if(page.imageinfo && page.imageinfo.length > 0) {
        } else {
        }
    } else {
    }
}

async function run() {
    await test("osciloscopio");
    await test("arduino");
    await test("resistencia electrica");
    await test("cautin");
}

run();
