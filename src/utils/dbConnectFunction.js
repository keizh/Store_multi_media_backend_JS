import mongoose from "mongoose";

// Promise denotes  promise is being performed
// void denotes the return type of the function
async function dbConnect() {
  try {
    const mongoURL = process.env.MONGODB ?? "";
    if (mongoURL == "") {
      console.error(
        `SERVER_CONFIGURATION_ERROR : no mongodn connect url provided`
      );
      throw new Error("No MONGODB_URL");
    }
    const dbConnectObject = await mongoose.connect(mongoURL);
    console.log(`Successfully made MONGODB connection`);
  } catch (error) {
    console.error(
      `Failed to Make DB Connection`,
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
}

export default dbConnect;
