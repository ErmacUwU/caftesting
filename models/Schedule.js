const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
});

const Schedule = mongoose.models.Schedule || mongoose.model("Schedule", ScheduleSchema);

export default Schedule;
