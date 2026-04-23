import { Jimp, intToRGBA } from "jimp";

type JimpImage = Awaited<ReturnType<typeof Jimp.read>>;

type ThemePalette = {
  primary: string;
  secondary: string;
  accent: string;
  ink: string;
};

export type ProcessedLogoResult = {
  transparentDataUrl: string;
  dominantColors: string[];
  theme: ThemePalette;
  width: number;
  height: number;
};

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function luminance(red: number, green: number, blue: number) {
  return ((0.2126 * red) + (0.7152 * green) + (0.0722 * blue)) / 255;
}

function colorDistance(left: { red: number; green: number; blue: number }, right: { red: number; green: number; blue: number }) {
  return Math.sqrt(((left.red - right.red) ** 2) + ((left.green - right.green) ** 2) + ((left.blue - right.blue) ** 2));
}

function averageCornerBackground(image: JimpImage) {
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const points = [
    { x: 0, y: 0 },
    { x: Math.max(0, width - 1), y: 0 },
    { x: 0, y: Math.max(0, height - 1) },
    { x: Math.max(0, width - 1), y: Math.max(0, height - 1) },
  ];
  const totals = points.reduce((result, point) => {
    const rgba = intToRGBA(image.getPixelColor(point.x, point.y));
    result.red += rgba.r;
    result.green += rgba.g;
    result.blue += rgba.b;
    return result;
  }, { red: 0, green: 0, blue: 0 });

  return {
    red: clampChannel(totals.red / points.length),
    green: clampChannel(totals.green / points.length),
    blue: clampChannel(totals.blue / points.length),
  };
}

function extractDominantColors(image: JimpImage) {
  const buckets = new Map<string, number>();
  const data = image.bitmap.data;

  for (let index = 0; index < data.length; index += 16) {
    const alpha = data[index + 3];

    if (alpha < 120) {
      continue;
    }

    const red = Math.floor(data[index] / 24) * 24;
    const green = Math.floor(data[index + 1] / 24) * 24;
    const blue = Math.floor(data[index + 2] / 24) * 24;

    if (luminance(red, green, blue) > 0.96) {
      continue;
    }

    const key = rgbToHex(red, green, blue);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return [...buckets.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([color]) => color)
    .slice(0, 5);
}

function deriveTheme(colors: string[]): ThemePalette {
  const [primary = "#1f7a53", secondary = "#204f8c", accent = "#c58e3d"] = colors;
  const ink = luminance(parseInt(primary.slice(1, 3), 16), parseInt(primary.slice(3, 5), 16), parseInt(primary.slice(5, 7), 16)) > 0.55
    ? "#102018"
    : "#ffffff";

  return { primary, secondary, accent, ink };
}

export async function processLogoImage(bytes: Uint8Array): Promise<ProcessedLogoResult> {
  const image = await Jimp.read(Buffer.from(bytes));
  const background = averageCornerBackground(image);
  const data = image.bitmap.data;

  for (let index = 0; index < data.length; index += 4) {
    const color = { red: data[index], green: data[index + 1], blue: data[index + 2] };
    const alpha = data[index + 3];

    if (alpha === 0) {
      continue;
    }

    if (colorDistance(color, background) < 38 || (luminance(color.red, color.green, color.blue) > 0.97 && colorDistance(color, background) < 58)) {
      data[index + 3] = 0;
    }
  }

  const dominantColors = extractDominantColors(image);
  const theme = deriveTheme(dominantColors);
  const transparentDataUrl = await image.getBase64("image/png");

  return {
    transparentDataUrl,
    dominantColors,
    theme,
    width: image.bitmap.width,
    height: image.bitmap.height,
  };
}