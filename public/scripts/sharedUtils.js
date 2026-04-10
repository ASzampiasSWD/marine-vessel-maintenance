function transformDate(strDate) {
	if (strDate == null) {
		return "N/A";	
	}
	let dtDate = Date.parse(strDate);
	let dateObject = new Date(dtDate);
	const options = { hour: '2-digit', minute: '2-digit' };
	const timeWithoutSeconds = dateObject.toLocaleTimeString(undefined, options);
	return dateObject.toLocaleDateString() + " " + timeWithoutSeconds;
}

const usMoneyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2, // Ensure at least 2 decimal places are shown
  maximumFractionDigits: 2  // Cap at 2 decimal places (rounding if necessary)
});