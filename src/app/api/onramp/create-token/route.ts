import { fetchCdpEndpoint } from "@/lib/cdp/api";
import { OnrampTokenData } from "@/lib/types/onramp";

export async function POST(req: Request) {
  const body = await req.json();

  try {
    const res = await fetchCdpEndpoint({
      requestMethod: 'POST',
      requestPath: '/onramp/v1/token',
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return Response.json({ error: `Failed to generate onramp session token ${res.statusText}` }, { status: res.status });
    }

    const data: OnrampTokenData = await res.json();

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: `Failed to generate onramp session token ${error}` }, { status: 500 });
  }
}
