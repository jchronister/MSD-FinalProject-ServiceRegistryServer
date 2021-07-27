"use strict";

const ObjectID = require("bson-objectid");
const { isMissing } = require("./verify-data");

// Services with Id as Key
let registry = {};

// Services with Identity as Key
let services = {};


/** Verify Data Supplied for Service
 * @param {Object} data Data Object
 * @returns {string | Object} String for Error & '' for Success
*/
module.exports.verifyData = function (data) {

    // Required Fields
    const fields = ["name", "category", "version", "description", "endpoint", "heartbeatIntervalms", "documentationURL"];

    // Verify Data
    return isMissing(fields, data);

};


/** Register Service
 * @param {Object} data Data Object
 * @returns {string | Object} String for Error & Object for Success
*/
module.exports.registerService = function (data) {
  
  // Extract Service Data
  let {name, category, version, description, endpoint, heartbeatIntervalms, documentationURL} = data;
  const identity = getServiceIdentity(data);

  // Verify Service Does Not Exist
  const duplicate = Object.entries(registry).filter(([key, n]) => n.identity === identity); // eslint-disable-line no-unused-vars

  if (duplicate.length) {

    const [id, n] = duplicate[0];

    // Assume the Same Service if Endpoint Matches
    if (endpoint === n.endpoint) {
      
      // Update Last Contact
      n.lastContact = Date.now();

      // Return Existing Id
      return {id};
      
    }

    // Endpoint Does Not Match - Different Service
    return "Service Already Exists: name + category + version";

  }   

  // Add Service to Registry
  const id = ObjectID();

  // Create Service Registry Object
  const service = {
                name, category, version, description, identity,
                endpoint, documentationURL, heartbeatIntervalms,
                lastContact: Date.now(),     
                };

  // Update Registry
  registry = {...registry, [id]: service};
  services = {...services, [identity]: service};
    
  // Return Id
  return {id};

};


/** Handle Service Heartbeat
 * @param {object} data Service Data Object
 * @returns {string | Object} String for Error & Object for Success
*/
module.exports.serviceHeartbeat = function ({id, ...data}) {

  const identity = getServiceIdentity(data);

  // Verify Heartbeat
  if (!registry[id]) {
    return "Invalid Id";
  } else if (!identity) {
    return "Invalid Identity";
  } else if (registry[id].identity !== identity) {
    return "Different Identity: name + category + version";
  }

  // Update Last Contact
  registry[id].lastContact = Date.now();

  // Return Id Object
  return {id};

};


/** Handle Service Heartbeat
 * @param {object} data Data Object with id & identity Property
 * @returns {string | Object} String for Error & Object for Success
*/
function getServiceIdentity ({name, category, version}) {
  return name + " " + category + " " + version;
}


/** Return Service Search
 * @param {object} searchObj Data Object with Search Criteria
 * @returns {object[]} Result Array
*/
module.exports.getService = function (searchObj = {default: "[\\s\\S]*"}) {

  const search = Object.entries(searchObj);

  // Search Registry
  if (search.length === 1 && search[0][0] === "identity") {

    // Simple Search by Identity
    var query = services[search[0][1]] ? [services[search[0][1]]] : [];

  } else {

    // Filter for Critera
    query = Object.values(registry).filter( n => {
      return search.reduce( (a, [key, value]) => a && (new RegExp(value)).test(n[key]), true);
    });

  }

  // Filter Services Out of Date
  const filtered = query.filter( 
    n => Date.now() <= n.lastContact + (n.heartbeatIntervalms * 1.5)
  );

  // Schedule Cleanup if Out of Date Services Exist
  if (query.length !== filtered.length) {
    setImmediate(purgeOutofDateServices);
  }

  // Map Only Certain Values
  return filtered.map(
    ({name, category, version, description, documentationURL, endpoint, identity}) => 
    ({name, category, version, description, documentationURL, endpoint, identity})
  );

};


/** Purge Out of Date Services from Registry
 * @returns {undefined}
*/
function purgeOutofDateServices () {

  const currentMS = Date.now();

  Object.entries(registry).forEach( ([id, data]) => {
    if (currentMS > data.lastContact + (data.heartbeatIntervalms * 1.5)) {

        // Destructure to Remove Item
        const {[id]: oldR, ...reg} = registry; // eslint-disable-line no-unused-vars
        const {[data.identity]: oldS, ...ser} = services; // eslint-disable-line no-unused-vars

        // Set to Remaining Items
        registry = reg;
        services = ser;

    }
  });

}