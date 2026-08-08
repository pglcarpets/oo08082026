import { readGitUserIdentity } from "../_lib/gitUser";

export async function GET() {
  const identity = await readGitUserIdentity();
  return Response.json(identity);
}
