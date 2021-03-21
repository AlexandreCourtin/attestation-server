# attestation-server
Node JS app used to generate and deliver a French Gouv certificate.

# Install
`npm install`

# Configuration
You need to setup your personal infromations in the `config.json` file.

Those informations will be used to complete the certificate.

# Run
`npm run start`

# Usage
This app wil run on port 2021 but you can easily modify this from the `server.js` file.

You can then use the `/setattes` route to generate a certificate for work and/or going to school.

You can fetch the PDF certificate from any browser by using the route `/getattes`.

This application is running very well with `forever` so the application is always running and accessible.
