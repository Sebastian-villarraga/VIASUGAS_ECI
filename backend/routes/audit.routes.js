const router = require("express").Router();
const controller = require("../controllers/audit.controller");

router.get("/", controller.getLogs);

module.exports = router;