import dotenv from "dotenv";
dotenv.config();

async function seed() {
  try {
    const { createUser } = await import("./lib/userService");
    const user = await createUser({
      username: "AQI01",
      email: "AQI01@assureqai.com",
      fullName: "Insure24",
      role: "Administrator",
      password: "AQI01$67#@jHjj_)",
    });
    if (user) {
      console.log("Admin user seeded successfully:", user);
    } else {
      console.log("Failed to seed admin user");
    }
  } catch (error) {
    console.error("Error seeding user:", error);
  }
}

seed();
