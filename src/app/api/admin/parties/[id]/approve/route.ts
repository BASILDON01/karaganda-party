import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { getSubmissionById, setSubmissionStatus } from "@/lib/party-submissions-store";
import { addPartyFromSubmission } from "@/lib/parties-store";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isAdmin(user.id)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const submission = getSubmissionById(id);
  if (!submission) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (submission.status !== "pending") {
    return NextResponse.json({ ok: false, error: "already_reviewed" }, { status: 400 });
  }

  const party = addPartyFromSubmission(submission);
  setSubmissionStatus(id, "approved", user.id);

  return NextResponse.json({ ok: true, party: { id: party.id, slug: party.slug } });
}
