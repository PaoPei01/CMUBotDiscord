import { handleFaqCsvImportRequest } from "../routeUtils";

export async function POST(request: Request): Promise<Response> {
  return handleFaqCsvImportRequest(request, false);
}
