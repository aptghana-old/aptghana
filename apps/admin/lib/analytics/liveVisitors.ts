import { connectDB, AnalyticsModel } from "@apt/db";

/** Distinct session IDs with any event in the last 5 minutes. */
export async function getActiveSessionIds(): Promise<string[]> {
  try {
    await connectDB();
    const since5m = new Date(Date.now() - 5 * 60 * 1000);
    return await AnalyticsModel.distinct("sessionId", { createdAt: { $gte: since5m } });
  } catch {
    return [];
  }
}
