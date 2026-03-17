const express = require("express");
const router = express.Router();

const {
    getManifiestos,
    createManifiesto
} = require("../controllers/manifiesto.controller");

router.get("/", getManifiestos);

router.post("/", createManifiesto);

module.exports = router;
