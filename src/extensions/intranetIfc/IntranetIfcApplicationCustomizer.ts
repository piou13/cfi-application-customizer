import * as React from "react";
import * as ReactDOM from "react-dom";
import { override } from '@microsoft/decorators';
import { Guid, Log } from '@microsoft/sp-core-library';
import { BaseApplicationCustomizer, PlaceholderContent, PlaceholderName } from '@microsoft/sp-application-base';
import { ICustomizationDataModel } from './models/ICustomizationDataModel';
import { IBreadcrumbItem } from '@fluentui/react';
import IntranetBreadcrumb from "./components/IntranetBreadcrumb";
import { IIntranetBreadcrumbProps } from "./components/IIntranetBreadcrumb";
import { md5 } from 'js-md5';
import * as strings from 'IntranetIfcApplicationCustomizerStrings';
import { ApiHelper } from "./helpers/helpers";

const LOG_SOURCE: string = 'IntranetIfcApplicationCustomizer';

export interface IIntranetIfcApplicationCustomizerProperties {
  Top: string;
  Bottom: string;
  CustomizationInformation: ICustomizationDataModel;
}

export default class IntranetIfcApplicationCustomizer
  extends BaseApplicationCustomizer<IIntranetIfcApplicationCustomizerProperties> {

  private _topPlaceholder: PlaceholderContent | undefined;
  private _bottomPlaceholder: PlaceholderContent | undefined;

  @override
  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized ${strings.Title}`);
    console.log(`Initialized ${strings.Title} v1.0`);

    this.context.placeholderProvider.changedEvent.add(this, this.renderTopPlaceHolders);
    this.context.placeholderProvider.changedEvent.add(this, this.renderBottomPlaceHolders);
    this.context.application.navigatedEvent.add(this, () => { this.renderBreadcrumb(); }); // to fix the breadcrumb refresh for intra site navigation

    return Promise.resolve();
  }

  private renderTopPlaceHolders(): void {
    if (this.context.placeholderProvider.placeholderNames.indexOf(PlaceholderName.Top) !== -1) {
      if (!this._topPlaceholder || !this._topPlaceholder.domElement) {
        this._topPlaceholder = this.context.placeholderProvider.tryCreateContent(
          PlaceholderName.Top,
          { onDispose: this._onDispose }
        );
      }

      this.renderBreadcrumb();

    } else {
      console.log(`The following placeholder names are available`, this.context.placeholderProvider.placeholderNames);
    }
  }

  private renderBottomPlaceHolders(): void {
    this.getCustomizationInformation().then((model: ICustomizationDataModel) => {
      this.properties.CustomizationInformation = model;

      if (!this._bottomPlaceholder) {
        this._bottomPlaceholder = this.context.placeholderProvider.tryCreateContent(
          PlaceholderName.Bottom,
          { onDispose: this._onDispose }
        );

        if (!this._bottomPlaceholder) {
          console.error("The expected placeholder (Bottom) was not found.");
          return;
        }

        if (this.properties) {
          let bottomString: string = this.properties.Bottom;
          if (!bottomString) {
            bottomString = "(Bottom property was not defined.)";
          }

          if (this._bottomPlaceholder.domElement) {
            this._bottomPlaceholder.domElement.innerHTML = `
            <style>
            .ms-HubNav span.ms-HorizontalNavItem a[href='${this.properties.CustomizationInformation.HighlightedNavItemUrl}'] {
              background-color: rgba(0,0,0,0.1);
              border-radius: 5px;
              padding: 5px;
            }
            </style>
            <div class="">
              <div class="">
                <i class="ms-Icon ms-Icon--Info" aria-hidden="true"></i> ${bottomString}
              </div>
            </div>`;
          }
        }
      }
    }).catch((e: any) => {
      console.log("Error A");
      console.log(JSON.stringify(e));
    });
  }

  private renderBreadcrumb(): void {
    if (this._topPlaceholder && this._topPlaceholder.domElement) {
      this.getBreadcrumbData()
        .then((items: IBreadcrumbItem[]) => {
          const intranetBreadcrumb: React.ReactElement<IIntranetBreadcrumbProps> = React.createElement(IntranetBreadcrumb, {
            context: this.context,
            breadcrumbItems: items
          });
          if (this._topPlaceholder && this._topPlaceholder.domElement) {
            ReactDOM.render(intranetBreadcrumb, this._topPlaceholder.domElement);
          }
        })
        .catch((e: any) => {
          console.log(JSON.stringify(e));
        });
    } else {
      console.log('DOM element of the header is undefined. Start to re-render.');
      this.renderTopPlaceHolders(); // placeholder not initialized, callback to re-render
    }
  }

  private async getCustomizationInformation(): Promise<ICustomizationDataModel> {
    try {
      // Site
      const site: any = await ApiHelper.makeApiCall(this.context, "_api/site?$select=Id,IsHubSite,HubSiteId");
      const siteId: Guid = site.Id;
      const isHubSite: boolean = site.IsHubSite;
      const hubSiteId: Guid = site.HubSiteId;

      //Hub
      const hub: any = await ApiHelper.makeApiCall(this.context, "_api/web/HubSiteData?$select=parentHubSiteId,relatedHubSiteIds,navigation");
      const resultHub: any = JSON.parse(hub.value);
      let parentHubId: string;
      let parentHubTitle: string;
      let parentHubUrl: string;
      let parent: { Title: string, Url: string };

      if (isHubSite) {
        if (resultHub.parentHubSiteId === "00000000-0000-0000-0000-000000000000") {
          parentHubId = "";
          parentHubTitle = "";
          parentHubUrl = "";
        } else {
          parent = await this.getSiteTitleAndUrl(resultHub.parentHubSiteId);
          parentHubId = resultHub.parentHubSiteId;
          parentHubTitle = parent.Title;
          parentHubUrl = parent.Url;
        }
      } else {
        const relatedHubSiteIds: Array<string> = resultHub.relatedHubSiteIds;
        const indexHub: number = relatedHubSiteIds.indexOf(resultHub.parentHubSiteId);
        if (indexHub > -1) {
          relatedHubSiteIds.splice(indexHub, 1);
        }
        parent = await this.getSiteTitleAndUrl(resultHub.relatedHubSiteIds[0]);
        parentHubId = relatedHubSiteIds[0];
        parentHubTitle = parent.Title;
        parentHubUrl = parent.Url;
      }

      const navNodes = new Array<string>();
      if (resultHub.navigation.length > 0) {
        resultHub.navigation.map((n: any) => navNodes.push(n.Url));
      }

      const model: ICustomizationDataModel = {
        HubSiteId: hubSiteId,
        Id: siteId,
        IsHubSite: isHubSite,
        Title: this.context.pageContext.web.title,
        Url: this.context.pageContext.web.absoluteUrl,
        ParentHubSiteId: parentHubId,
        ParentHubSiteTitle: parentHubTitle,
        ParentHubSiteUrl: parentHubUrl,
        Navigation: navNodes,
        HighlightedNavItemUrl: isHubSite ? this.context.pageContext.web.absoluteUrl : parentHubUrl
      };

      return model;

    } catch (error: any) {
      // manage error
      console.log("ERROR IN getCustomizationInformation: " + error);
      return error;
    }
  }

  private async getSiteTitleAndUrl(siteId: string): Promise<{ Title: string, Url: string }> {
    try {
      const site: any = await ApiHelper.makeApiCall(this.context, `_api/HubSites/GetById?hubSiteId='${siteId}'&$select=Title,SiteUrl`);
      return { Title: site.Title, Url: site.SiteUrl }

    } catch (error: any) {
      // manage error
      console.log("ERROR IN getCustomizationInformation: " + error);
      return error;
    }
  }

  private async getBreadcrumbData(): Promise<IBreadcrumbItem[]> {
    try {
      let breadcrumbItems: Array<IBreadcrumbItem> = new Array<IBreadcrumbItem>();

      // Get current page name (Home or Others for titleonly and to be the last breadcrumb item)
      if (this.context.pageContext.listItem !== undefined) {
        const welcome: any = await ApiHelper.makeApiCall(this.context, "_api/web/WelcomePage");
        const page: any = await ApiHelper.makeApiCall(this.context, `_api/web/lists/getByTitle('Site Pages')/items(${this.context.pageContext.listItem.id})/File?$select=Title,ServerRelativeUrl`);

        if (page.ServerRelativeUrl.indexOf(welcome.value) === -1) {
          breadcrumbItems.unshift({ key: this.context.pageContext.listItem.id.toString(), text: page.Title });
        }
      }

      // Get the current site, to add to the breadcrumb
      breadcrumbItems.unshift({ key: this.context.pageContext.web.id.toString(), text: this.context.pageContext.web.title, href: this.context.pageContext.web.absoluteUrl });

      // Get recursively the remaining parent sites from the current site and up to the root, to add to the breadcrumb
      breadcrumbItems = await this.getWebInfosForBreadcrumb(this.context.pageContext.web.absoluteUrl, breadcrumbItems);

      return breadcrumbItems;

    } catch (error: any) {
      // manage error
      console.log("ERROR IN getBreadcrumbData: " + error);
      return error;
    }
  }

  private async getWebInfosForBreadcrumb(siteUrl: string, items: IBreadcrumbItem[]): Promise<IBreadcrumbItem[]> {
    // Get hub site data information
    const web: any = await ApiHelper.makeApiCall(this.context, `_api/web/HubSiteData?$select=parentHubSiteId,relatedHubSiteIds,name,url`, siteUrl);
    const resultWeb: any = JSON.parse(web.value);

    // Site is hubsite?
    const site: any = await ApiHelper.makeApiCall(this.context, `_api/site?$select=IsHubSite`, siteUrl);
    const isHubSite: boolean = site.IsHubSite;

    // Apply the logic
    if (resultWeb.parentHubSiteId !== "00000000-0000-0000-0000-000000000000") {
      let relatedId: string;
      if (!isHubSite) {
        const relatedHubSiteIds: Array<string> = resultWeb.relatedHubSiteIds;
        const indexHub: number = relatedHubSiteIds.indexOf(resultWeb.parentHubSiteId);
        if (indexHub > -1) {
          relatedHubSiteIds.splice(indexHub, 1);
        }
        relatedId = relatedHubSiteIds[0];
      } else {
        relatedId = resultWeb.parentHubSiteId;
      }

      const parentWeb: any = await ApiHelper.makeApiCall(this.context, `_api/HubSites/GetById?hubSiteId='${relatedId}'&?$select=Title,SiteUrl`, siteUrl);
      items.unshift({ key: md5(parentWeb.SiteUrl), text: parentWeb.Title, href: parentWeb.SiteUrl });
      items = await this.getWebInfosForBreadcrumb(parentWeb.SiteUrl, items);
    }
    return items;
  }

  private _onDispose(): void {
    console.log('[_onDispose] Disposed custom top and bottom placeholders.');
    if (this._topPlaceholder) {
      ReactDOM.unmountComponentAtNode(this._topPlaceholder.domElement);
    }
  }
}