const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const http = require('http');
const https = require('https');
const multer = require('multer');
const app = express();
var pg = require('pg');
const db = require('./db');
//const credentials = require('./credentials');
var favicon = require('serve-favicon');

// Set up Handlebars view engine
app.engine('.hbs', exphbs.engine({ // Note the .engine here
	defaultLayout: 'main', // Assumes a 'main.hbs' in your layouts folder
	extname: '.hbs', // Specifies the file extension
	// Add other configurations like partialsDir or helpers here
}))

app.set('view engine', '.hbs');
app.set('views', path.join(process.cwd(), 'views'));
app.use(express.static('public'));
app.use(favicon(path.join(__dirname, 'public', 'styles', 'favicon.ico')));

// Built-in middleware to parse URL-encoded bodies (form data)
app.use(express.urlencoded({ extended: true }));

// Configure Multer for basic file destination
const upload = multer({ dest: 'uploads/' });

function getFormattedDate(date) {
  let year = date.getFullYear();
  // getMonth() returns 0-11, so add 1 for actual month number (1-12)
  let month = (date.getMonth() + 1).toString().padStart(2, '0');
  let day = date.getDate().toString().padStart(2, '0');

  // Combine the parts in MM-DD-YYYY format
  return `${month}-${day}-${year}`;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Specify the destination folder
  },
  filename: function (req, file, cb) {
    let today = new Date();
    let arFileName = file.originalname.split('.'); // get extension.
    cb(null, req.body.productName + '_' + getFormattedDate(today) + '.' + arFileName[1]);
  }
});

const uploadCustom = multer({ storage: storage });

app.get('/', async (req, res) => {
	try {
		let vesselTypes = await db.query('SELECT vessel_type_id, vessel_type_name, price FROM vessel_types INNER JOIN product_prices ON vessel_types.product_price_id=product_prices.product_price_id');
		let activeTechnicians = await db.query('SELECT technician_id FROM technicians WHERE is_active = TRUE');
		let vesselParts = await db.query('SELECT vessel_parts_used_for_vessel_type.vessel_part_id, vessel_parts_used_for_vessel_type.vessel_type_id, vessel_part_name, price, popularity_score FROM vessel_parts_used_for_vessel_type INNER JOIN vessel_parts ON vessel_parts_used_for_vessel_type.vessel_part_id=vessel_parts.vessel_part_id INNER JOIN product_prices ON vessel_parts.product_price_id=product_prices.product_price_id ORDER BY popularity_score');
		let issues = await db.query('SELECT * FROM issues ORDER BY popularity_score');
		res.render('index', {
			vessel_types: JSON.stringify(vesselTypes.rows),
			active_technicians: JSON.stringify(activeTechnicians.rows),
			vessel_parts: JSON.stringify(vesselParts.rows),
			issues: JSON.stringify(issues.rows)
		});
	} catch (err) {
		console.error(err);
		res.status(500).send('Server Error');
	}
})

app.get('/success', (req, res) => {
	res.render('success');
})

app.get('/error', (req, res) => {
	let passedVariable = req.query.technicianname;
	let vesselVariable = req.query.vessel;
	let strMessage = '';
	let url = '/list';

	if (passedVariable != undefined) {
		strMessage = 'Technician ' + passedVariable + ' already exists';
		url = '/join';
	}
	if (passedVariable == 'DNE') {
		strMessage = 'Technician Does Not Exist';
		url = '/join';
	}
	if (vesselVariable != undefined) {
		strMessage = 'Vessel Does Not Exist';
		url = '/list';
	}

	res.render('error', {
		title: 'Save the Vessels',
		errMessage: strMessage,
		url: url
	});
})

async function getIssuesByHullNumber(hullIdNumber) {
	try {
		const queryIssuesByHullNumberId = 'SELECT repairs.repair_id, issues.issue_id, issues.issue_description, repairs.technician_id, repairs.hull_id_number FROM issues_resolved_on_repair INNER JOIN repairs ON issues_resolved_on_repair.repair_id=repairs.repair_id INNER JOIN issues ON issues_resolved_on_repair.issue_id=issues.issue_id WHERE repairs.hull_id_number=$1';
		const queryIssuesByHullNumberIdValues = [hullIdNumber];
		const { rows } = await db.query(queryIssuesByHullNumberId, queryIssuesByHullNumberIdValues);
		return rows;
	} catch (err) {
		console.error(err);
		return err;
	}
}

async function getTechnicianByTechnicianId(technicianId) {
	try {
		const queryTechnicianByTechnicianId = 'SELECT * FROM technicians WHERE technician_id=$1';
		const queryTechnicianByTechnicianIdValues = [technicianId];
		const { rows } = await db.query(queryTechnicianByTechnicianId, queryTechnicianByTechnicianIdValues);
		return rows[0];
	} catch (err) {
		console.error(err);
		return err;
	}
}

async function getLastRepairId() {
	try {
		const queryLastRepairId = 'SELECT repair_id FROM repairs ORDER BY repair_id DESC LIMIT 1';
		const { rows } = await db.query(queryLastRepairId);
		return rows[0].repair_id;
	} catch (err) {
		console.error(err);
		return err;
	}
}

async function insertMarinaByTechnician(marinaId) {
	const upperMarina = marinaId.toUpperCase();
	const insertMarinaByTechnician = 'INSERT INTO marinas VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
	const insertMarinaByTechnicianValues = [upperMarina, 'TODO', 'TODO', 'NA', 'N/A', 'N/A'];

	try {
		let dbAnswer = await db.query(insertMarinaByTechnician, insertMarinaByTechnicianValues);
		return dbAnswer;
	} catch (err) {
		console.log(err);
		return err;
	}
}

async function getMarinaByMarinaId(marinaId) {
	try {
		const queryMarinasByMarinaId = 'SELECT * FROM marinas WHERE marina_id=$1';
		const queryMarinasByMarinaIdValues = [marinaId];
		const { rows } = await db.query(queryMarinasByMarinaId, queryMarinasByMarinaIdValues);
		return rows[0];
	} catch (err) {
		console.error(err);
		return err;
	}
}

async function getTechniciansByMarinaId(marinaId) {
	try {
		const queryTechnicianByMarinaId = 'SELECT * FROM technicians WHERE marina_id = $1';
		const queryTechnicianByMarinaIdValues = [marinaId];
		const { rows } = await db.query(queryTechnicianByMarinaId, queryTechnicianByMarinaIdValues);
		return rows;
	} catch (err) {
		console.error(err);
		return err;
	}
}

async function getTotalRepairsByAllMarinas() {
	try {
		const queryTotalRepairsByMarinas = 'SELECT technicians.marina_id, COUNT(technicians.marina_id), SUM(repair_cost) AS repair_cost, SUM(money_saved) AS money_saved FROM repairs INNER JOIN vessels ON repairs.hull_id_number = vessels.hull_id_number INNER JOIN vessel_types ON vessels.vessel_type_id = vessel_types.vessel_type_id INNER JOIN technicians ON repairs.technician_id=technicians.technician_id GROUP BY technicians.marina_id ORDER BY count DESC';
		const { rows } = await db.query(queryTotalRepairsByMarinas);
		return rows;
	} catch (err) {
		console.error(err);
		return err;
	}
}

async function getBestTechniciansFromAllMarinas() {
	try {
		const queryBestTechniciansFromAllMarinas = 'SELECT repairs.technician_id, COUNT(repair_id) as "total_repairs", SUM(repair_cost) AS repair_cost, SUM(money_saved) AS money_saved, technicians.marina_id FROM repairs INNER JOIN vessels ON repairs.hull_id_number = vessels.hull_id_number INNER JOIN vessel_types ON vessels.vessel_type_id = vessel_types.vessel_type_id INNER JOIN technicians ON repairs.technician_id=technicians.technician_id GROUP BY repairs.technician_id, technicians.marina_id ORDER BY "total_repairs" DESC';
		const { rows } = await db.query(queryBestTechniciansFromAllMarinas);
		return rows;
	} catch (err) {
		console.error(err);
		return err;
	}
}

async function getPartNamesByHullNumberNumber(hullNumberId) {
	try {
		const queryPartNamesByHullNumberId = 'SELECT repairs.repair_id, vessel_parts.vessel_part_id, vessel_parts.vessel_part_name, price FROM vessel_parts_used_for_repair INNER JOIN repairs ON repairs.repair_id=vessel_parts_used_for_repair.repair_id INNER JOIN vessel_parts ON vessel_parts.vessel_part_id=vessel_parts_used_for_repair.vessel_part_id INNER JOIN product_prices ON vessel_parts.product_price_id = product_prices.product_price_id WHERE repairs.hull_id_number=$1';
		const queryPartNamesByHullNumberIdValues = [hullNumberId];
		const { rows } = await db.query(queryPartNamesByHullNumberId, queryPartNamesByHullNumberIdValues);
		return rows;
	} catch (err) {
		console.error(err);
		return err;
	}
}

/*app.get('/admin', async (req, res) => {
    let productNameRows = await getProductNames();
    let vesselPartNames = await getVesselPartNames();
    let vesselTypes = await getVesselTypes();
    res.render('admin', { productNames : JSON.stringify(productNameRows),
                          vesselPartNames : JSON.stringify(vesselPartNames),
                          vesselTypes : JSON.stringify(vesselTypes) });

});*/

app.get('/guide', async (req, res) => {
    try {
        res.render('guide', { });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.get('/technician', async (req, res) => {
	let passedVariable = req.query.technicianid;
	let technician = await getTechnicianByTechnicianId(passedVariable);
	try {
		const queryVesselsByTechnicianId = 'SELECT repair_id, repairs.hull_id_number, vessel_types.vessel_type_name, technician_id, dock_location, berth_number, repair_cost, money_saved, date_time_fixed FROM repairs INNER JOIN vessels ON repairs.hull_id_number = vessels.hull_id_number INNER JOIN vessel_types ON vessels.vessel_type_id = vessel_types.vessel_type_id WHERE technician_id = $1 ORDER BY repair_id DESC';
		const queryVesselsByTechnicianIdValues = [passedVariable];
		const { rows } = await db.query(queryVesselsByTechnicianId, queryVesselsByTechnicianIdValues);
		if (technician == undefined) {
			res.redirect('/error?technicianname=DNE');
		}
		res.render('technician', { rows: JSON.stringify(rows), 
                            technicianId: passedVariable, 
                            firstName: technician.first_name, 
                            lastName: technician.last_name, 
                            marinaId: technician.marina_id,
							created_at : getFormattedDate(technician.created_at) });
	} catch (err) {
		console.error(err);
		res.status(500).send('Server Error');
	}
})

app.get('/vessel', async (req, res) => {
	let hullNumber = req.query.hullnumber;
	const queryRepairsByHullNumberId = 'SELECT repair_id, repairs.hull_id_number, vessel_types.vessel_type_name, technician_id, dock_location, berth_number, repair_cost, money_saved, comments, date_time_fixed, vessels.warranty_start_date, vessels.warranty_end_date, vessels.is_active FROM repairs INNER JOIN vessels ON repairs.hull_id_number = vessels.hull_id_number INNER JOIN vessel_types ON vessels.vessel_type_id = vessel_types.vessel_type_id WHERE repairs.hull_id_number = $1 ORDER BY repair_id';
	const queryRepairsByHullNumberIdValues = [hullNumber];
	try {
		const { rows } = await db.query(queryRepairsByHullNumberId, queryRepairsByHullNumberIdValues);
		let issueRows = await getIssuesByHullNumber(hullNumber);
		let partNameRows = await getPartNamesByHullNumberNumber(hullNumber);

		if (rows.length == 0) {
			res.redirect('/error?vessel=DNE');
		}
		res.render('vessel', {
			rows: JSON.stringify(rows),
			issueRows: JSON.stringify(issueRows),
			partNameRows: JSON.stringify(partNameRows),
			hullNumber: hullNumber
		});
	} catch (err) {
		console.error(err);
		res.status(500).send('Server Error');
	}
})

app.get('/marina', async (req, res) => {
	let marinaId = req.query.marinaid;
	const queryRepairsByMarinaId = 'select repair_id, repairs.hull_id_number, vessel_types.vessel_type_name, technicians.technician_id, technicians.marina_id, repairs.dock_location, repairs.berth_number, repair_cost, money_saved, date_time_fixed FROM repairs INNER JOIN technicians on technicians.technician_id=repairs.technician_id INNER JOIN marinas ON marinas.marina_id=technicians.marina_id INNER JOIN vessels ON vessels.hull_id_number = repairs.hull_id_number INNER JOIN vessel_types ON vessel_types.vessel_type_id=vessels.vessel_type_id WHERE marinas.marina_id = $1 ORDER BY date_time_fixed DESC;';
	const queryRepairsByMarinaIdValues = [marinaId];
	try {
		const { rows } = await db.query(queryRepairsByMarinaId, queryRepairsByMarinaIdValues);
        let technicianRows = await getTechniciansByMarinaId(marinaId);
        let marinaRow = await getMarinaByMarinaId(marinaId);
        let repairRow = await getTotalRepairsByAllMarinas();

		if (rows.length == 0) {
			res.redirect('/error?marina=DNE');
		}
		res.render('marina', {
			rows: JSON.stringify(rows),
            technicianRows : JSON.stringify(technicianRows),
            marinaRow : marinaRow,
            repairRow : JSON.stringify(repairRow),
            marinaId: marinaId.toString()
		});
	} catch (err) {
		console.error(err);
		res.status(500).send('Server Error');
	}
})

app.get('/list', async (req, res) => {
	try {
		const { rows } = await db.query('SELECT repair_id, repairs.hull_id_number, vessel_types.vessel_type_name, repairs.technician_id, technicians.marina_id, dock_location, berth_number, repair_cost, money_saved, date_time_fixed FROM repairs INNER JOIN vessels ON repairs.hull_id_number = vessels.hull_id_number INNER JOIN vessel_types ON vessels.vessel_type_id = vessel_types.vessel_type_id INNER JOIN technicians ON repairs.technician_id=technicians.technician_id ORDER BY repair_id DESC');
		res.render('list', { rows: JSON.stringify(rows) });
	} catch (err) {
		console.error(err);
		res.status(500).send('Server Error');
	}
});

app.get('/leaderboard', async (req, res) => {
	try {
		let repairRows = await getTotalRepairsByAllMarinas();
        let technicianRows = await getBestTechniciansFromAllMarinas();
        res.render('leaderboard', { repairRows: JSON.stringify(repairRows),
                                    technicianRows : JSON.stringify(technicianRows) });
	} catch (err) {
		console.error(err);
		res.status(500).send('Server Error');
	}
});

app.get('/join', async (req, res) => {
	try {
		const { rows } = await db.query('SELECT marina_id FROM marinas');
		res.render('join', { rows: JSON.stringify(rows) });
	} catch (err) {
		console.error(err);
		res.status(500).send('Server Error');
	}
});

/*app.post('/submit-price', uploadCustom.single('file'), async (req, res) => {
    let { productName, price, referer, screenshot  } = req.body;
    console.log(req.file);
    console.log(req.body);
    console.log(productName);
    console.log(price);
    console.log(referer);
    console.log(screenshot);
    res.status(200).send('OK');
});*/

app.post('/submit-repair', async (req, res) => {
	let { hullNumberId, technicianId, vesselType, partNameNeeded, vesselLocation, berthNumber, issue, timeSpentOnTask, comments, repair_cost, money_saved } = req.body;
	hullNumberId = hullNumberId.toUpperCase();
    console.log(hullNumberId);
    console.log(technicianId);
    console.log(partNameNeeded);
    console.log(vesselLocation);
    console.log(berthNumber);
	if (berthNumber == "") {
		berthNumber = null;
	}
    if (timeSpentOnTask == "") {
        timeSpentOnTask = 15;
    }
	if (partNameNeeded == "") {
		partNameNeeded = null;
	} else {
        partNameNeeded = partNameNeeded.split(",");
    }
    if (issue == "") {
        issue = null;
    } else {
        issue = issue.split(",");
    }

	const queryVesselByHullNumberId = 'SELECT * FROM vessels WHERE hull_id_number = $1';
	const queryVesselByHullNumberIdValues = [hullNumberId];
	let vesselExists = true;
	try {
		const response = await db.query(queryVesselByHullNumberId, queryVesselByHullNumberIdValues);
		if (response.rows.length == 0) {
			vesselExists = false;
		}
	} catch (err) {
		console.log(err)
	}
	let repair_id = null;
	if (vesselExists == false) {
		const insertIntoVessels = 'INSERT INTO vessels(hull_id_number, vessel_type_id) VALUES($1, $2) RETURNING *';
		const insertIntoVesselsValues = [hullNumberId, vesselType];
		try {
			await db.query(insertIntoVessels, insertIntoVesselsValues);
		} catch (err) {
			console.log(err);
			res.send(err);
		}
	}
    let repairId = await getLastRepairId();
    let newRepairId = repairId + 1;
	const insertIntoRepairs = 'INSERT INTO repairs(repair_id, hull_id_number, technician_id, dock_location, berth_number, time_worked_on, comments, repair_cost, money_saved) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *';
	const insertIntoRepairsValues = [newRepairId, hullNumberId, technicianId, vesselLocation, berthNumber, timeSpentOnTask, comments, repair_cost, money_saved];

	try {
		const resInsertIntoRepairs = await db.query(insertIntoRepairs, insertIntoRepairsValues);
		repair_id = resInsertIntoRepairs.rows[0].repair_id;
	} catch (err) {
		console.log(err);
		res.send(err);
	}

	let arIssues = [];
	if (Array.isArray(issue)) {
		arIssues = issue;
	} else {
		arIssues.push(issue);
	}

	for (let i = 0; i < arIssues.length; i++) {
		const insertIntoIssuesResolved = 'INSERT INTO issues_resolved_on_repair(repair_id, issue_id) VALUES($1, $2) RETURNING *';
		const insertIntoIssuesResolvedValues = [repair_id, arIssues[i]];
		try {
			await db.query(insertIntoIssuesResolved, insertIntoIssuesResolvedValues);
		} catch (err) {
			console.log(err);
			res.send(err);
		}
	}

	let arPartNameNeeded = [];
	if (partNameNeeded != undefined) {
		if (Array.isArray(partNameNeeded)) {
			arPartNameNeeded = partNameNeeded;
		} else {
			arPartNameNeeded.push(partNameNeeded);
		}
	}

	for (let d = 0; d < arPartNameNeeded.length; d++) {
		let insertIntoVesselPartsUsed = 'INSERT INTO vessel_parts_used_for_repair(repair_id, vessel_part_id) VALUES($1, $2) RETURNING *';
		let insertIntoVesselPartsUsedValues = [repair_id, arPartNameNeeded[d]];
		try {
			await db.query(insertIntoVesselPartsUsed, insertIntoVesselPartsUsedValues);
		} catch (err) {
			console.log(err);
			res.send(err);
		}
	}
	res.redirect('/list');
});

app.post('/submit-new-technician', async (req, res) => {
	const { marinaId, technicianId, firstName, lastName } = req.body;
	const lowerCaseTechnicianId = technicianId.toLowerCase();
	let upperMarina = marinaId.toUpperCase();
	let currentMarina = await getMarinaByMarinaId(upperMarina);

	if (currentMarina == undefined) {
		let dbAnswer = await insertMarinaByTechnician(upperMarina);
	}

	const insertTechnician = 'INSERT INTO technicians(technician_id, marina_id, first_name, last_name) VALUES($1, $2, $3, $4) RETURNING *';
	const insertTechnicianValues = [lowerCaseTechnicianId, upperMarina, firstName, lastName];

	try {
		await db.query(insertTechnician, insertTechnicianValues);
		res.redirect('/success');
	} catch (err) {
		if (err.detail.includes('already exists.')) {
			let linky = '/error?technicianname=' + technicianId;
			res.redirect(linky);
		}
	}
})

/*
// FOR TEST WITHOUT CERTS
app.listen(3000, () => {
  console.log(`Example app listening on port 3000!`);
});
//FOR PRODUCTION
http.createServer((req, res) => {
	// Redirect to the HTTPS version of the same URL
	res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
	res.end();
}).listen(80, () => {
	console.log('HTTP Server listening on port 80 for redirects');
});

const httpsServer = https.createServer(credentials.credentials, app);
httpsServer.listen(443, () => {
	console.log('HTTPS Server running on port 443');
});*/

const server = http.createServer(app);
server.listen(3000, () => {
	console.log('Server is running on port 3000');
});