const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
});

// Verifica si el modelo ya fue definido, si no, créalo
const Schedule = mongoose.models.Schedule || mongoose.model("Schedule", ScheduleSchema);

export default Schedule;
