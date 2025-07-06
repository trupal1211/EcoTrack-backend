const cron = require("node-cron");
const Report = require("../models/Report");
const User = require("../models/User");
const { sendEmail } = require("../utils/mailer")

cron.schedule("0 * * * *", async () => {
  console.log("🔁 Running overdue report cleanup job...");

  const now = new Date();

  try {
    const overdueReports = await Report.find({
      status: "taken",
      dueDate: { $lt: now },
      resolvedOn: null
    }).populate("takenBy", "name email"); 

    for (const report of overdueReports) {

      const ngo = report.takenBy;
      
      const dueDateFormatted = report.dueDate?.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      });

      await sendEmail(
      ngo.email,
      "⏰ Report Deadline Missed",
      `
      <div style="font-family: Arial, sans-serif; background-color: #f6f9fc; padding: 20px; color: #333;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); padding: 30px;">
          <h2 style="color: #d32f2f;">Deadline Missed for Report</h2>
          <p>Hello <strong>${ngo.name || "NGO"}</strong>,</p>
          <p>We noticed that the due date <strong>(${dueDateFormatted})</strong> for the report titled <strong>${report.title}</strong> has passed without completion.</p>
          <p>As a result, the report has been returned to the pending list and is now available for other NGOs to take action.</p>
          <p>Please ensure timely completion of future assignments to avoid reassignment.</p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/report/${report._id}" target="_blank" style="display: inline-block; padding: 12px 25px; background-color: #1976d2; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Visit Report
            </a>
          </div>

          <hr style="margin: 40px 0 20px;">
          <p style="font-size: 14px; color: #777;">Thank you for being a part of GreenTrack’s mission to maintain cleaner communities.</p>
          <p style="font-size: 14px; color: #777;">— The GreenTrack Team</p>
        </div>
      </div>
      `
    );

      report.status = "pending";
      report.incompletedBy.push(report.takenBy);
      report.takenBy = null;
      report.dueDate = null;
      report.takenOn = null;

      await report.save();
    }

    console.log(`✅ ${overdueReports.length} reports updated to 'pending' due to overdue.`);
  } catch (err) {
    console.error("❌ Cron Job Error:", err.message);
  }
});
