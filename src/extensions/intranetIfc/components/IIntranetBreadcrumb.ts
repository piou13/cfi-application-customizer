import {ApplicationCustomizerContext} from "@microsoft/sp-application-base";
import { IBreadcrumbItem } from '@fluentui/react';

export interface IIntranetBreadcrumbProps {
    context: ApplicationCustomizerContext;
    breadcrumbItems: IBreadcrumbItem[];
}

export interface IIntranetBreadcrumbState {}