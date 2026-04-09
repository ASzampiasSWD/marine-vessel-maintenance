// The old way of doing credentials. Deprecated, but good to have. 
const fs = require('fs');
require('dotenv').config();

let credentials = {};

// HTTPS Certificate
if (process.env.NODE_ENV === 'production') {
	try {
	const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8');
	const certificate = fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8');
	const ca = fs.readFileSync(process.env.SSL_CA_PATH, 'utf8');

	credentials = {
		key: privateKey,
		cert: certificate,
		ca: ca
	};

	} catch (err) {
		console.log(err);
	}
} else {
	credentials = {
		key: fs.readFileSync(process.env.SSL_KEY_PATH_DEV),
		cert: fs.readFileSync(process.env.SSL_CERT_PATH_DEV),
		ca: fs.readFileSync(process.env.SSL_CA_PATH_DEV)
	};
	console.log('Using self-signed certificates for development');	
}

module.exports = {
	credentials
}