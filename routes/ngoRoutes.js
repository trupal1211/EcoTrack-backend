const express = require("express");
const router = express.Router();

const{takeReport,
    completeReport,
    getTakenReports,
    getCompletedReports,
    getIncompletedReports
}=require("../controllers/ngoController")

const auth = require('../middleware/authMiddleware')
const role = require('../middleware/roleMiddleware')
const upload = require('../middleware/upload')

router.use(auth);

router.put("/take/:reportId", role(['ngo','admin']), takeReport);
router.put("/complete/:reportId", role(['ngo','admin']), upload.array("resolvedImages", 5), completeReport);
router.get("/taken/:userId", getTakenReports);
router.get("/completed/:userId",  getCompletedReports);
router.get("/incompleted/:userId", getIncompletedReports);

module.exports = router;
