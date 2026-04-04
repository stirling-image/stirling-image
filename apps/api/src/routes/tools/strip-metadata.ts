import { basename } from "node:path";
import { stripMetadata } from "@stirling-image/image-engine";
import exifReader from "exif-reader";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import sharp from "sharp";
import { z } from "zod";
import { createToolRoute } from "../tool-factory.js";

const settingsSchema = z.object({
  stripExif: z.boolean().default(false),
  stripGps: z.boolean().default(false),
  stripIcc: z.boolean().default(false),
  stripXmp: z.boolean().default(false),
  stripAll: z.boolean().default(true),
});

/**
 * Serialize a value for JSON — convert Buffers/Dates and drop overly large blobs.
 */
function sanitizeValue(v: unknown): unknown {
  if (v instanceof Date) return v.toISOString();
  if (Buffer.isBuffer(v)) {
    if (v.length > 256) return `<binary ${v.length} bytes>`;
    return Array.from(v);
  }
  if (Array.isArray(v)) return v.map(sanitizeValue);
  if (v !== null && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) {
      out[k] = sanitizeValue(val);
    }
    return out;
  }
  return v;
}

/**
 * Parse GPS coordinates from EXIF GPSInfo into decimal degrees.
 */
function parseGpsCoordinates(gps: Record<string, unknown>): {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
} {
  let latitude: number | null = null;
  let longitude: number | null = null;
  let altitude: number | null = null;

  const lat = gps.GPSLatitude as number[] | undefined;
  const latRef = gps.GPSLatitudeRef as string | undefined;
  if (lat && lat.length === 3 && lat.every((v) => typeof v === "number" && !Number.isNaN(v))) {
    latitude = lat[0] + lat[1] / 60 + lat[2] / 3600;
    if (latRef === "S") latitude = -latitude;
  }

  const lon = gps.GPSLongitude as number[] | undefined;
  const lonRef = gps.GPSLongitudeRef as string | undefined;
  if (lon && lon.length === 3 && lon.every((v) => typeof v === "number" && !Number.isNaN(v))) {
    longitude = lon[0] + lon[1] / 60 + lon[2] / 3600;
    if (lonRef === "W") longitude = -longitude;
  }

  if (typeof gps.GPSAltitude === "number" && !Number.isNaN(gps.GPSAltitude)) {
    altitude = gps.GPSAltitude;
    if (gps.GPSAltitudeRef === 1) altitude = -altitude;
  }

  return { latitude, longitude, altitude };
}

/**
 * Parse XMP XML buffer into key-value pairs.
 */
function parseXmp(xmpBuffer: Buffer): Record<string, string> {
  const xml = xmpBuffer.toString("utf-8");
  const result: Record<string, string> = {};

  for (const match of xml.matchAll(/(\w+:\w+)="([^"]+)"/g)) {
    const key = match[1];
    if (key.startsWith("xmlns:") || key.startsWith("rdf:")) continue;
    result[key] = match[2];
  }

  return result;
}

/**
 * Parse ICC profile buffer into basic info.
 */
function parseIccProfile(iccBuffer: Buffer): Record<string, string> {
  const info: Record<string, string> = {};

  if (iccBuffer.length < 128) return info;

  info["Profile Size"] = `${iccBuffer.length} bytes`;

  const colorSpace = iccBuffer.subarray(16, 20).toString("ascii").trim();
  if (colorSpace) info["Color Space"] = colorSpace;

  const pcs = iccBuffer.subarray(20, 24).toString("ascii").trim();
  if (pcs) info["Connection Space"] = pcs;

  const classMap: Record<string, string> = {
    scnr: "Input (Scanner)",
    mntr: "Display (Monitor)",
    prtr: "Output (Printer)",
    link: "Device Link",
    spac: "Color Space",
    abst: "Abstract",
    nmcl: "Named Color",
  };
  const deviceClass = iccBuffer.subarray(12, 16).toString("ascii").trim();
  if (deviceClass) info["Device Class"] = classMap[deviceClass] ?? deviceClass;

  const major = iccBuffer[8];
  const minor = (iccBuffer[9] >> 4) & 0xf;
  if (major) info.Version = `${major}.${minor}`;

  // Extract description tag from ICC tag table
  const tagCount = iccBuffer.readUInt32BE(128);
  for (let i = 0; i < tagCount && i < 50; i++) {
    const tagOffset = 132 + i * 12;
    if (tagOffset + 12 > iccBuffer.length) break;
    const sig = iccBuffer.subarray(tagOffset, tagOffset + 4).toString("ascii");
    if (sig === "desc") {
      const dataOffset = iccBuffer.readUInt32BE(tagOffset + 4);
      const dataLen = iccBuffer.readUInt32BE(tagOffset + 8);
      if (dataOffset + dataLen <= iccBuffer.length && dataLen > 12) {
        const descType = iccBuffer.subarray(dataOffset, dataOffset + 4).toString("ascii");
        if (descType === "desc") {
          const strLen = iccBuffer.readUInt32BE(dataOffset + 8);
          if (strLen > 0 && strLen < 256) {
            const desc = iccBuffer
              .subarray(dataOffset + 12, dataOffset + 12 + strLen - 1)
              .toString("ascii");
            info.Description = desc;
          }
        } else if (descType === "mluc") {
          const recCount = iccBuffer.readUInt32BE(dataOffset + 8);
          if (recCount > 0) {
            const strOffset = iccBuffer.readUInt32BE(dataOffset + 20);
            const strLength = iccBuffer.readUInt32BE(dataOffset + 16);
            if (strOffset && strLength && dataOffset + strOffset + strLength <= iccBuffer.length) {
              const raw = iccBuffer.subarray(
                dataOffset + strOffset,
                dataOffset + strOffset + strLength,
              );
              // ICC mluc strings are UTF-16BE: swap bytes for Node's utf16le decoder
              const swapped = Buffer.alloc(raw.length);
              for (let j = 0; j < raw.length - 1; j += 2) {
                swapped[j] = raw[j + 1];
                swapped[j + 1] = raw[j];
              }
              const desc = swapped.toString("utf16le");
              info.Description = desc.replace(/\0/g, "");
            }
          }
        }
      }
      break;
    }
  }

  return info;
}

export function registerStripMetadata(app: FastifyInstance) {
  // Inspect endpoint — returns parsed metadata as JSON
  app.post(
    "/api/v1/tools/strip-metadata/inspect",
    async (request: FastifyRequest, reply: FastifyReply) => {
      let fileBuffer: Buffer | null = null;
      let filename = "image";

      try {
        const parts = request.parts();
        for await (const part of parts) {
          if (part.type === "file") {
            const chunks: Buffer[] = [];
            for await (const chunk of part.file) {
              chunks.push(chunk);
            }
            fileBuffer = Buffer.concat(chunks);
            filename = basename(part.filename ?? "image");
          }
        }
      } catch (err) {
        return reply.status(400).send({
          error: "Failed to parse multipart request",
          details: err instanceof Error ? err.message : String(err),
        });
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        return reply.status(400).send({ error: "No image file provided" });
      }

      try {
        const metadata = await sharp(fileBuffer).metadata();

        const result: Record<string, unknown> = {
          filename,
          fileSize: fileBuffer.length,
        };

        // Parse EXIF
        if (metadata.exif) {
          try {
            const parsed = exifReader(metadata.exif);
            const exifData: Record<string, unknown> = {};
            const gpsData: Record<string, unknown> = {};

            if (parsed.Image) {
              for (const [k, v] of Object.entries(parsed.Image)) {
                exifData[k] = sanitizeValue(v);
              }
            }

            if (parsed.Photo) {
              for (const [k, v] of Object.entries(parsed.Photo)) {
                exifData[k] = sanitizeValue(v);
              }
            }

            if (parsed.Iop) {
              for (const [k, v] of Object.entries(parsed.Iop)) {
                exifData[k] = sanitizeValue(v);
              }
            }

            if (parsed.GPSInfo) {
              for (const [k, v] of Object.entries(parsed.GPSInfo)) {
                gpsData[k] = sanitizeValue(v);
              }
              const coords = parseGpsCoordinates(parsed.GPSInfo as Record<string, unknown>);
              if (coords.latitude !== null) gpsData._latitude = coords.latitude;
              if (coords.longitude !== null) gpsData._longitude = coords.longitude;
              if (coords.altitude !== null) gpsData._altitude = coords.altitude;
            }

            if (Object.keys(exifData).length > 0) result.exif = exifData;
            if (Object.keys(gpsData).length > 0) result.gps = gpsData;
          } catch {
            result.exif = null;
            result.exifError = "Failed to parse EXIF data";
          }
        }

        // Parse ICC
        if (metadata.icc) {
          try {
            result.icc = parseIccProfile(metadata.icc);
          } catch {
            result.icc = null;
          }
        }

        // Parse XMP
        if (metadata.xmp) {
          try {
            result.xmp = parseXmp(metadata.xmp);
          } catch {
            result.xmp = null;
          }
        }

        return reply.send(result);
      } catch (err) {
        return reply.status(422).send({
          error: "Failed to read image metadata",
          details: err instanceof Error ? err.message : "Unknown error",
        });
      }
    },
  );

  // Strip endpoint — processes and returns cleaned image
  createToolRoute(app, {
    toolId: "strip-metadata",
    settingsSchema,
    process: async (inputBuffer, settings, filename) => {
      const metadata = await sharp(inputBuffer).metadata();
      const format = metadata.format ?? "png";
      const image = sharp(inputBuffer);
      const result = await stripMetadata(image, settings);

      // Re-encode in the original format so we don't inflate the file.
      // Sharp re-encodes from scratch, so we pick settings that stay close
      // to the original size while still stripping metadata.
      switch (format) {
        case "jpeg":
          result.jpeg({ quality: 90, mozjpeg: true });
          break;
        case "png":
          result.png({ compressionLevel: 9 });
          break;
        case "webp":
          result.webp({ quality: 85 });
          break;
        case "avif":
          result.avif({ quality: 50 });
          break;
        case "tiff":
          result.tiff({ compression: "lzw" });
          break;
        default:
          break;
      }

      const buffer = await result.toBuffer();
      const mimeMap: Record<string, string> = {
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
        avif: "image/avif",
        tiff: "image/tiff",
        gif: "image/gif",
      };
      return { buffer, filename, contentType: mimeMap[format] ?? "image/png" };
    },
  });
}
