"use strict";

const {sendJSON} = require("../middleware/return-object");
const createHttpError = require("http-errors");
const { registerService, serviceHeartbeat, getService, verifyData } = require("../middleware/service-registry");
const router = require("express")();

// /services
router.route("/")
  .get(getServices)
  .post(verifyServiceData, serviceRegistry);



/** Returns List of Services - Refine Search with Query Parameters & Regex
 * @param {Object} req Request Object
 * @param {Object} res Response Object
 * @returns {undefined}
*/
function getServices(req, res) {
  sendJSON.call(res, null, getService(req.query));
}

/** Register Service and Handle Heartbeats
 * @param {object} req Request Object
 * @param {object} res Response Object
 * @param {function} next Express Next Function
 * @returns {undefined}
*/
function verifyServiceData (req, res, next) {
  
  const missing = verifyData(req.body);

  next(missing ? missing : undefined);

}

/** Register Service and Handle Heartbeats
 * @param {object} req Request Object
 * @param {object} res Response Object
 * @param {function} next Express Next Function
 * @returns {undefined}
*/
function serviceRegistry(req, res, next) {

  if (req.body.id === undefined) {

    // Add Service
    var registry = registerService(req.body);
     
  } else {

    // Handle Heartbeat
    registry = serviceHeartbeat(req.body);

  }

  // Return Error or Id Object
  if (typeof registry === "string") {
    next(createHttpError(400, registry));
  } else {
    sendJSON.call(res, null, registry);
  }

}

module.exports = router;