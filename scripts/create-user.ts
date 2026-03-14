import crypto from "crypto";
import mongoose from "mongoose";

// Configuración
const MONGODB_URI = "mongodb+srv://DiegoCiceri:Diego119720@cluster0.0i0kxlo.mongodb.net/pdfmira?retryWrites=true&w=majority";
const DB_NAME = "pdfmira";

// Modelo de usuario
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

const User = mongoose.model("User", userSchema);

// Hash password
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function createInitialUser() {
  try {
    console.log("Conectando a MongoDB...");
    await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });

    const username = "admin_Diego";
    const password = "password123";

    // Verificar si el usuario ya existe
    const existing = await User.findOne({ username });
    if (existing) {
      console.log(`✓ El usuario '${username}' ya existe.`);
      await mongoose.disconnect();
      return;
    }

    // Crear el usuario
    const user = await User.create({
      username,
      passwordHash: hashPassword(password),
    });

    console.log(`✓ Usuario creado exitosamente:`);
    console.log(`  - Username: ${user.username}`);
    console.log(`  - ID: ${user._id}`);
    console.log(`  - Creado: ${user.createdAt}`);
    console.log();
    console.log("Puedes iniciar sesión con:");
    console.log(`  Usuario: ${username}`);
    console.log(`  Contraseña: ${password}`);

    await mongoose.disconnect();
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("Error:", error);
    }
    process.exit(1);
  }
}

createInitialUser();
