/**
 * @class IPSWUnpacker
 * A standalone JavaScript class to unpack IPSW archives (which are ZIP files) using fflate
 * and extract a specific file.
 */
export class IPSWUnpacker {
    constructor(arrayBuffer) {
        this.buffer = new Uint8Array(arrayBuffer);
    }

    /**
     * Finds and extracts a single file from the IPSW archive.
     * @param {string} targetFilename - The full path/name of the file to find (case-insensitive).
     * @returns {Promise<ArrayBuffer|null>} A promise that resolves with the file's content as an ArrayBuffer, or null if not found.
     */
    findAndExtract(targetFilename) {
        const targetUpper = String(targetFilename || "").toUpperCase();

        const pickTarget = (archive) => {
            for (const [name, data] of Object.entries(archive || {})) {
                if (String(name).toUpperCase().endsWith(targetUpper)) {
                    const u8 = data instanceof Uint8Array ? data : new Uint8Array(data);
                    return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
                }
            }
            return null;
        };

        // Path 1: synchronous full unzip.
        if (typeof fflate.unzipSync === "function") {
            try {
                const archive = fflate.unzipSync(this.buffer);
                return Promise.resolve(pickTarget(archive));
            } catch (_syncError) {
                // fall through
            }
        }

        // Path 2: asynchronous full unzip.
        if (typeof fflate.unzip === "function") {
            return new Promise((resolve, reject) => {
                try {
                    fflate.unzip(this.buffer, (err, archive) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(pickTarget(archive));
                    });
                } catch (error) {
                    reject(error);
                }
            }).catch(() => {
                // fall through to streaming fallback
                return this.findAndExtractStream(targetUpper);
            });
        }

        return this.findAndExtractStream(targetUpper);
    }

    findAndExtractStream(targetUpper) {
        return new Promise((resolve, reject) => {
            let foundFile = false;

            const unzipper = new fflate.Unzip(file => {
                // Check if the filename (case-insensitive) matches our target
                if (file.name.toUpperCase().endsWith(targetUpper)) {
                    foundFile = true;
                    console.log(`Found target file in IPSW: ${file.name}`);
                    const chunks = [];

                    file.ondata = (err, chunk, final) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        chunks.push(chunk);
                        if (final) {
                            // Combine all chunks into a single Uint8Array
                            const combined = new Uint8Array(chunks.reduce((acc, val) => acc + val.length, 0));
                            let offset = 0;
                            for (const chunk of chunks) {
                                combined.set(chunk, offset);
                                offset += chunk.length;
                            }
                            resolve(combined.buffer);
                        }
                    };
                    // Start decompressing this specific file
                    file.start();
                }
            });

            unzipper.onend = (err) => {
                if (err) {
                    reject(err);
                } else {
                    // If onend is reached and we haven't resolved yet, the file was never found.
                    if (!foundFile) {
                        resolve(null);
                    }
                }
            };

            // Register ZIP compression handlers explicitly.
            // Method 0 = stored, method 8 = deflate (common in IPSWs).
            if (typeof unzipper.register === "function") {
                unzipper.register(fflate.UnzipPassThrough);
                unzipper.register(fflate.UnzipInflate);
                if (fflate.AsyncUnzipInflate) unzipper.register(fflate.AsyncUnzipInflate);
            }

            // Start the main unzipping process
            unzipper.push(this.buffer, true);
        });
    }
}
