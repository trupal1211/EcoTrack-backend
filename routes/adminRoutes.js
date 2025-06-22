const express = require("express");
const router = express.Router();

const {getAllUsers,
    getAllNGOs,
    getAllReports,
    deleteReport,
    changeReportStatus,
    handleNgoApproval,
    removeNgoRole,
    getAllNgoRequests
}=require('../controllers/adminController')

const auth = require("../middleware/authMiddleware");
const role = require('../middleware/roleMiddleware')

router.use(auth);
router.use(role(['admin']));


router.get("/users", getAllUsers);
router.get("/ngos", getAllNGOs);
router.get("/reports", getAllReports);
router.delete("/report/:reportId", deleteReport);
router.put("/report/:reportId/status", changeReportStatus);

router.get("/ngo-requests",getAllNgoRequests);
router.put("/ngo-request/:requestId", handleNgoApproval);
router.put("/remove-ngo-role/:id", removeNgoRole);



module.exports = router;
