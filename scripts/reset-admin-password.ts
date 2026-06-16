import { hashPassword } from "../packages/auth/src/crypto";
import { connectDB, AdminModel } from "../packages/db/src";

async function main() {
  await connectDB();
  const hash = await hashPassword("Admin1234!");
  const result = await AdminModel.updateOne(
    { email: "admin@aptghana.com" },
    { $set: { passwordHash: hash } }
  );
  console.log("Updated:", result.modifiedCount, "document(s)");
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
