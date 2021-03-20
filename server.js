const express = require('express');
const app = express();
const port = process.env.PORT || 2021;
const fs = require('fs');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);
const puppeteer = require('puppeteer');
const path = require('path');

async function getCertificate() {
	// const config = JSON.parse(fs.readFileSync('./config.json', { flag: "r" }));
	const browser = await puppeteer.launch({
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
		],
	});
	const page = await browser.newPage();
	const downloadPath = path.resolve('./');
	await page._client.send('Page.setDownloadBehavior', {
		behavior: 'allow',
		downloadPath: downloadPath,
	});
	await page.goto('https://media.interieur.gouv.fr/attestation-deplacement-derogatoire-covid-19/', { waitUntil: 'domcontentloaded' });
	await page.evaluate((e) => {
		const formatDate = (date) => date.toString().length === 1 ? '0' + date : date;
		document.getElementById('field-firstname').value = '';
		document.getElementById('field-lastname').value = '';
		document.getElementById('field-birthday').value = '';
		document.getElementById('field-placeofbirth').value = '';
		document.getElementById('field-address').value = ''
		document.getElementById('field-city').value = '';
		document.getElementById('field-zipcode').value = '';
		document.getElementById('field-heuresortie').value = `${formatDate(new Date().getUTCHours() + 1)}:${formatDate(new Date().getUTCMinutes())}`;
		document.getElementById('checkbox-travail').checked = true;
		document.getElementById('generate-btn').click();
	});
	setTimeout(() => browser.close(), 5000);
}

app.get('/setattes', async function (req, res) {
	const files = await readdir('.');
	for (file of files) {
		if ((/(.pdf)$/gm).test(file)) {
			unlink(file, () => console.log('deleted old pdf'));
		}
	}
	await getCertificate();
});

app.get('/getattes', async function (req, res) {
	const files = await readdir('.');
	while (files.filter((file) => (/(.pdf)$/gm).test(file)).length == 0) {
		files = await readdir('.');
	}

	const attestationPath = files.find((file) => (/(.pdf)$/gm).test(file));
	fs.readFile(__dirname + '/' + attestationPath, function (err, data) {
        res.contentType("application/pdf");
        res.send(data);
    });
});

app.listen(port, console.log('server listening on port ' + port));