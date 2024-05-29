import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';

export async function makeApiCall(context: any, url: string, select: string): Promise<any> {
  const response: SPHttpClientResponse = await context.spHttpClient
    .get(`${context.pageContext.web.absoluteUrl}/${url}?$select=${select}`,
      SPHttpClient.configurations.v1, {
      headers: [
        ['accept', 'application/json;odata.metadata=none']
      ]
    });

  if (!response.ok) {
    const responseText: string = await response.text();
    throw new Error(responseText);
  }

  const data: any = await response.json();
  return data;
}