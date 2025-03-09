import dbConnect from "@/lib/dbConnect";
import Schedule from "@/models/Shedule";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    let schedule = await Schedule.findOne();
    if (!schedule) {
      schedule = new Schedule({ startTime: "08:00:00", endTime: "18:00:00" });
      await schedule.save();
    }
    return res.status(200).json(schedule);
  }

  if (req.method === "PUT") {
    try {
      const { startTime, endTime } = req.body;

      let schedule = await Schedule.findOne();
      if (!schedule) {
        schedule = new Schedule({ startTime, endTime });
      } else {
        schedule.startTime = startTime;
        schedule.endTime = endTime;
      }

      await schedule.save();
      return res.status(200).json(schedule);
    } catch (error) {
      console.error("Error en PUT /api/schedule:", error);
      return res.status(500).json({ error: "Error actualizando horario" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
