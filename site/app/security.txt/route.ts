import { securityTxtResponse } from "@/lib/securityTxt";

/** RFC 9116 optional root alias: /security.txt */
export function GET() {
  return securityTxtResponse();
}
