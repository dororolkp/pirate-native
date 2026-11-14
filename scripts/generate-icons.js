const sharp = require("sharp");
const path = require("node:path");

// Vector brand mark, rasterized locally; no network or placeholder images.
const anchor = (color) =>
  `<g fill="none" stroke="${color}" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"><circle cx="512" cy="320" r="52"/><path d="M512 372v324M400 450h224M322 550v68c0 105 190 148 190 148s190-43 190-148v-68M322 550l-40 52m420-52 40 52"/></g>`;
const svg = (body) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">${body}</svg>`,
  );
const directory = path.join(__dirname, "..", "assets");
async function main() {
  const brand = svg(
    `<rect width="1024" height="1024" fill="#e87b42"/>${anchor("white")}`,
  );
  await Promise.all([
    sharp(brand).png().toFile(path.join(directory, "icon.png")),
    sharp(brand)
      .resize(64, 64)
      .png()
      .toFile(path.join(directory, "favicon.png")),
    sharp(brand).png().toFile(path.join(directory, "splash-icon.png")),
    sharp(svg(anchor("#e87b42")))
      .png()
      .toFile(path.join(directory, "android-icon-foreground.png")),
    sharp(svg('<rect width="1024" height="1024" fill="#fff1e7"/>'))
      .png()
      .toFile(path.join(directory, "android-icon-background.png")),
    sharp(svg(anchor("white")))
      .png()
      .toFile(path.join(directory, "android-icon-monochrome.png")),
  ]);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
