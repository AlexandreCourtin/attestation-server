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
	console.log('certificate init');
	const config = JSON.parse(fs.readFileSync('./config.json', { flag: "r" }));
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
	await page.evaluate((config) => {
		const formatDate = (date) => date.toString().length === 1 ? '0' + date : date;
		document.getElementById('field-firstname').value = config.firstname;
		document.getElementById('field-lastname').value = config.lastname;
		document.getElementById('field-birthday').value = config.birthday;
		document.getElementById('field-placeofbirth').value = config.placeofbirth;
		document.getElementById('field-address').value = config.address;
		document.getElementById('field-city').value = config.city;
		document.getElementById('field-zipcode').value = config.zipcode;
		document.getElementById('field-heuresortie').value = `${formatDate(new Date().getUTCHours() + 1)}:${formatDate(new Date().getUTCMinutes())}`;
		document.getElementById('checkbox-8-travail').checked = true;
		document.getElementById('generate-btn').click();
	}, config);
	setTimeout(() => browser.close(), 5000);
	console.log('certificate done');
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

	if (files) {
		const attestationPath = files.find((file) => (/(.pdf)$/gm).test(file));
		if (attestationPath) {
			fs.readFile(__dirname + '/' + attestationPath, function (err, data) {
				res.contentType("application/pdf");
				res.send(data);
			});
		}
	}
});

app.listen(port, console.log('server listening on port ' + port));
