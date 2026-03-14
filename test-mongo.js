import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testConnection() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log("Intentando conectar a MongoDB...");
    console.log("URI:", uri?.substring(0, 50) + "...");
    
    await mongoose.connect(uri, {
      dbName: "pdfmira",
    });
    
    console.log("✅ Conexión exitosa a MongoDB");
    
    // Verificar colecciones existentes
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log("\nColecciones existentes:");
    collections.forEach((col) => {
      console.log(`  - ${col.name}`);
    });
    
    await mongoose.disconnect();
    console.log("\n✅ Desconectado");
  } catch (error) {
    console.error("❌ Error de conexión:", error.message);
    process.exit(1);
  }
}

testConnection();
