import * as React from "react";
import styles from '../IntranetBreadcrumb.module.scss';
import { IIntranetBreadcrumbProps, IIntranetBreadcrumbState } from "./IIntranetBreadcrumb";
import { override } from '@microsoft/decorators';
import { Breadcrumb } from '@fluentui/react';

export default class IntranetBreadcrumb extends React.Component<IIntranetBreadcrumbProps, IIntranetBreadcrumbState> {
    constructor(props: IIntranetBreadcrumbProps) {
        super(props);
        this.state = {};
    }

    @override
    public render(): React.ReactElement<IIntranetBreadcrumbProps> {
        return (
            <div className={styles.breadcrumb}>
                <Breadcrumb items={this.props.breadcrumbItems} className={styles.breadcrumbLinks} />
            </div>
        );
    }

    @override
    public componentDidMount(): void {
        console.log("REACT IntranetBreadcrumb COMPONENT MOUNTED");
    }

    @override
    public componentWillUnmount(): void {
        // Dispose
    }

}