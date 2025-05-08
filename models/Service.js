import mongoose from "mongoose";

//Nueva colección creada para los servicios

const ServiceSchema = new mongoose.Schema(
    {
    name: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true
    },
    cost: {
        type: Number,
        required: true
    },
    color: {
        type: String,
        required: true
    },
},
    { timestamps: true }
)

const Service = mongoose.models.Service || mongoose.model("Service", ServiceSchema);

export default Service