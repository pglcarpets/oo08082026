import { securityTxtResponse } from "@/lib/securityTxt";

/** RFC 9116 canonical location: /.well-known/security.txt */
export function GET() {
  return securityTxtResponse();
}
