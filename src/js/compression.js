/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */

export default async function getCompressor(name) {
    if (typeof name !== "string" || !name)
        throw new Error("compressor name is required");

    if (name === "brotli") {
        const compressor = new BrotliCompressor();
        await compressor.initialize();
        return compressor;
    } else if (name === "gzip") {
        return Promise.resolve(new GZipCompressor());
    }

    throw new Error(`${name} unknown`);
}

class BrotliCompressor {

    constructor() {
        if (BrotliCompressor.instance)
            return BrotliCompressor.instance;

        BrotliCompressor.instance = this;
    }

    async initialize() {
        if (this.brotli)
            return Promise.resolve();

        const brotli = await import("https://unpkg.com/brotli-wasm@3.0.0/index.web.js?module").then(m => m.default);
        this.brotli = brotli;
    }

    compress(input) {
        const textEncoder = new TextEncoder();
        const uncompressedData = textEncoder.encode(input);

        const compressedData = this.brotli.compress(uncompressedData);

        const compressedString = compressedData.toBase64();
        return Promise.resolve(compressedString);
    }

    decompress(input) {
        const compressedData = Uint8Array.fromBase64(input);

        const decompressedData = this.brotli.decompress(compressedData);

        const textDecoder = new TextDecoder();
        const decompressedString = textDecoder.decode(decompressedData);
        return Promise.resolve(decompressedString);
    }

}

class GZipCompressor {

    async compress(string) {
        const blobToBase64 = blob => new Promise((resolve, _) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(blob);
        });
        const byteArray = new TextEncoder().encode(string);
        const cs = new CompressionStream('gzip');
        const writer = cs.writable.getWriter();
        writer.write(byteArray);
        writer.close();
        const blob = await new Response(cs.readable).blob();
        return blobToBase64(blob);
    }

    async decompress(base64string) {
        const bytes = Uint8Array.from(atob(base64string), c => c.charCodeAt(0));
        const cs = new DecompressionStream('gzip');
        const writer = cs.writable.getWriter();
        writer.write(bytes);
        writer.close();
        const arrayBuffer = await new Response(cs.readable).arrayBuffer();
        return new TextDecoder().decode(arrayBuffer);
    }
}