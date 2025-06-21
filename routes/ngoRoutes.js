const express = require("express");
const router = express.Router();

const{takeReport,
    completeReport,
    getTakenReports,
    getCompletedReports,
    getUncompletedReports
}=require("../controllers/ngoController")

const auth = require('../middleware/authMiddleware')
const role = require('../middleware/roleMiddleware')
const upload = require('../middleware/upload')

router.use(auth);
router.use(role(['ngo','admin']));

router.put("/take/:reportId", takeReport);
router.put("/complete/:reportId", upload.array("resolvedImages", 5), completeReport);
router.get("/taken", getTakenReports);
router.get("/completed",  getCompletedReports);
router.get("/uncompleted", getUncompletedReports);

module.exports = router;
