import { connectDB, AdminModel } from "@apt/db";

/** Active sales/manager admins eligible for customer assignment. */
export async function getSalesReps(): Promise<{ value: string; label: string }[]> {
  try {
    await connectDB();
    const reps = await AdminModel.find({ role: { $in: ["sales", "manager"] }, status: "active" })
      .select("_id name")
      .sort({ name: 1 })
      .lean() as unknown as { _id: { toString(): string }; name: string }[];
    return reps.map((r) => ({ value: r._id.toString(), label: r.name }));
  } catch {
    return [];
  }
}
