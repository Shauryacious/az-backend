const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const tmp = require('tmp');
const { promisify } = require('util');
const stream = require('stream');
const finished = promisify(stream.finished);

async function downloadImageToTempFile(url) {
    const response = await axios.get(url, { responseType: 'stream' });
    const tempFile = tmp.fileSync({ postfix: path.extname(url) });
    const writer = fs.createWriteStream(tempFile.name);
    response.data.pipe(writer);
    await finished(writer);
    return tempFile;
}

async function matchImageWithDescription(imagePath, description) {
    let form = new FormData();
    let tempFile = null;
    let fileStream;

    try {
        // If imagePath is a URL, download it first
        if (/^https?:\/\//i.test(imagePath)) {
            tempFile = await downloadImageToTempFile(imagePath);
            fileStream = fs.createReadStream(tempFile.name);
        } else {
            fileStream = fs.createReadStream(imagePath);
        }

        form.append('image', fileStream);
        form.append('description', description);

        const response = await axios.post('http://localhost:8001/predict', form, {
            headers: form.getHeaders(),
            timeout: 20000,
        });

        return response.data; // { label, score }
    } catch (err) {
        throw new Error('BLIP API error: ' + err.message);
    } finally {
        // Cleanup temp file if used
        if (tempFile) tempFile.removeCallback();
    }
}

module.exports = { matchImageWithDescription };
