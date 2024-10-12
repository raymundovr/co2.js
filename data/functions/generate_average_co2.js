/**
 * @fileoverview This script generates average CO2 emissions intensity data for countries using the Ember API.
 * It processes the data and saves it in various formats for use in the CO2.js library.
 * @author Chris Adams
 * @version 1.0.0
 */

const fs = require("fs");

/**
 * The URL for the Ember API that provides country overview data on a yearly basis.
 * @constant {string}
 */
const sourceURL =
  "https://ember-data-api-scg3n.ondigitalocean.app/ember/country_overview_yearly.json?_sort=rowid&_shape=array";


/**
 * Object to store the grid intensity results for each country.
 * @type {Object.<string, number>}
 */
const gridIntensityResults = {};


/**
 * Object to store general results including additional country information.
 * @type {Object.<string, Object>}
 */
const generalResults = {};


/**
 * The type of intensity data being processed (average or marginal).
 * @constant {string}
 */
const type = "average";

/**
 * Fetches data from the Ember API, processes it to extract the latest average CO2 emissions
 * intensity data for each country, and saves the results in various formats.
 * @async
 * @function
 * @returns {Promise<void>}
 */

// Use async/await
// Use fetch to get the data from the API
// Use the reduce method to group the data by country_code
// Use the reduce method again to find the latest year for each country
// Use a for loop to get the emissions intensity data
// Save the data to the gridIntensityResults object
// Save the full data set to a JSON file
// Save the country code and emissions data only to a JS file
// Save a minified version of the JS file to the src/data folder

(async () => {
  const response = await fetch(sourceURL);
  const data = await response.json();

  /**
   * Groups the API data by country code.
   * @type {Object.<string, Array>}
   */
  const groupedData = await data.reduce((acc, item) => {
    const key =
      item.country_code === "" ? item.country_or_region : item.country_code;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  /**
   * Extracts the latest year's data for each country.
   * @type {Object.<string, Object>}
   */
  const latestData = await Object.keys(groupedData).reduce((acc, key) => {
    // Find the last year in the array with emissions intensity data
    const latestYear = groupedData[key].reduce((acc, item, index) => {
      if (
        item.emissions_intensity_gco2_per_kwh === null ||
        item.emissions_intensity_gco2_per_kwh === ""
      ) {
        return acc;
      }
      return index;
    }, 0);

    acc[key] = groupedData[key][latestYear];
    return acc;
  }, {});

  // Loop through the data and extract the emissions intensity data
  // Save it to the gridIntensityResults object with the country code as the key
  Object.values(latestData).forEach((row) => {
    if (
      row.emissions_intensity_gco2_per_kwh === null ||
      row.emissions_intensity_gco2_per_kwh === ""
    ) {
      return;
    }

    const country =
      row.country_code === "" ? row.country_or_region : row.country_code;

    gridIntensityResults[country.toUpperCase()] =
      row.emissions_intensity_gco2_per_kwh;

    generalResults[country] = {
      country_code: row.country_code,
      country_or_region: row.country_or_region,
      year: row.year,
      emissions_intensity_gco2_per_kwh: row.emissions_intensity_gco2_per_kwh,
    };
  });

  /**
   * Saves the country code and emissions data for use in the CO2.js library.
   * @type {void}
   */
  fs.writeFileSync(
    "data/output/average-intensities.js",
    `
    const data = ${JSON.stringify(gridIntensityResults, null, "  ")}; 
    const type = "${type}";
    export { data, type }; 
    export default { data, type };
    `
  );
  /**
   * Saves a minified version of the data for easy import into the library.
   * @type {void}
   */
  fs.writeFileSync(
    "src/data/average-intensities.min.js",
    `const data = ${JSON.stringify(gridIntensityResults)}; const type = "${type}"; export { data, type }; export default { data, type };`
  );

  /**
   * Saves the full data set as a JSON file for reference.
   * @type {void}
   */
  fs.writeFileSync(
    "data/output/average-intensities.json",
    JSON.stringify(generalResults, null, "  ")
  );
})();