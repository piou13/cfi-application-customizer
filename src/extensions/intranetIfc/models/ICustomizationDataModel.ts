import { Guid } from '@microsoft/sp-core-library';
export interface ICustomizationDataModel {
    Id: Guid;
    Title: string;
    Url: string;
    IsHubSite: boolean;
    HubSiteId: Guid;
    ParentHubSiteId: string;
    ParentHubSiteUrl: string;
    ParentHubSiteTitle: string;
    Navigation: Array<string>;
    HighlightedNavItemUrl: string;
}