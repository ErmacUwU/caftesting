// lib/dbConnect.js
import mongoose from 'mongoose';
//Aqui estamos estableciendo la conexion con el cluster de la base de datos
const MONGODB_URI =
  "mongodb+srv://al20760258:0PvtPfbr6xNVwyeJ@cluster0.i2b42a1.mongodb.net/datosDB";

/* mongodb+srv://ermac:<password>@cluster0.3nkggsl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0 */
/*

 user: al20760258
 password: 0PvtPfbr6xNVwyeJ

 */

 
if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside your environment configuration'
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect; 
