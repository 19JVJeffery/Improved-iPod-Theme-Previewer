export async function extractFilteredImages(buffer, json) {
    const { IPSWUnpacker } = await import('./IPSWUnpacker.js');
    const { MseUnpacker } = await import('./MseUnpacker.js');
    const { Img1Unpacker } = await import('./Img1Unpacker.js');
    const { Fat16Parser } = await import('./Fat16Parser.js');
    const { SilverDBUnpacker } = await import('./SilverDBUnpacker.js');

    // --- 1. Unpack IPSW ---
    const ipsw = new IPSWUnpacker(buffer);
    let firmwareMSE = null;
    try {
        firmwareMSE = await ipsw.findAndExtract('Firmware.MSE');
    } catch (error) {
        const message = String(error?.message || error || "");
        if (message.toLowerCase().includes("compression type") && typeof window !== "undefined" && window.JSZip) {
            firmwareMSE = await extractFirmwareMseWithJsZip(buffer);
        } else {
            throw error;
        }
    }
    if (!firmwareMSE && typeof window !== "undefined" && window.JSZip) {
        firmwareMSE = await extractFirmwareMseWithJsZip(buffer);
    }
    if (!firmwareMSE) throw new Error('Firmware.MSE not found');

    // --- 2. Unpack MSE to get rsrc.img1 ---
    const mse = new MseUnpacker(firmwareMSE);
    const rsrcImage = mse.findImageByType('rsrc');
    if (!rsrcImage) throw new Error('rsrc image not found');
    const rsrcBuffer = mse.extractImage(rsrcImage);

    // --- 3. Unpack IMG1 ---
    const img1 = new Img1Unpacker();
    const { bodyBin } = await img1.unpack(rsrcBuffer);

    // --- 4. FAT16 → SilverImagesDB.LE.bin ---
    const fat = new Fat16Parser(bodyBin);
    const dbEntry = fat.findFileRecursive('SilverImagesDB.LE.bin');
    if (!dbEntry) throw new Error('SilverImagesDB.LE.bin not found');

    const dbBufferRaw = fat.extractFile(dbEntry);
    const dbBuffer = dbBufferRaw instanceof ArrayBuffer ? dbBufferRaw : dbBufferRaw.buffer;

    // --- 5. Unpack the SilverDB —
    const silver = new SilverDBUnpacker();
    const allImages = await silver.unpack(dbBuffer);

    const extractedIds = allImages.map(img => `${img.id}_${img.format.toString(16).padStart(4, '0')}`);

    const expectedIds = [];
    for (const color in json.wallpapers_by_color) {
        for (const style in json.wallpapers_by_color[color]) {
            const entry = json.wallpapers_by_color[color][style];
            if (entry?.preview) expectedIds.push(entry.preview);
            if (entry?.full_res) expectedIds.push(entry.full_res);
        }
    }

    const missing = expectedIds.filter(id => !extractedIds.includes(id));
    console.warn("⚠️ Missing expected image IDs:", missing);


    console.log(`🖼️ Extracted ${allImages.length} images from SilverDB`);

    return allImages; // Unfiltered
}

async function extractFirmwareMseWithJsZip(buffer) {
    const zip = await window.JSZip.loadAsync(buffer);
    let target = null;
    zip.forEach((relativePath, file) => {
        if (!target && !file.dir && relativePath.toUpperCase().endsWith("FIRMWARE.MSE")) {
            target = file;
        }
    });
    if (!target) return null;
    return await target.async("arraybuffer");
}
