import { ApplicationCustomizerContext } from '@microsoft/sp-application-base';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';

export class ApiHelper {

  public static async makeApiCall(context: ApplicationCustomizerContext, url: string, rootUrl?: string): Promise<any> {
    try {
      console.log('makeApiCall', `${rootUrl ?? context.pageContext.web.absoluteUrl}/${url}`);
      const response: SPHttpClientResponse = await context.spHttpClient
        .get(`${rootUrl ?? context.pageContext.web.absoluteUrl}/${url}`,
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
      
    } catch (error) {
      console.error(`Error making API call to ${rootUrl ?? context.pageContext.web.absoluteUrl}/${url}:`, error);
      throw error;
    }
  }
}