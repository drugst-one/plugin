import { Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TableModule } from 'primeng/table';

import { ExplorerPageComponent } from './pages/explorer-page/explorer-page.component';
import { QueryTileComponent } from './components/query-tile/query-tile.component';
import { LaunchAnalysisComponent } from './dialogs/launch-analysis/launch-analysis.component';
import { DatasetTileComponent } from './components/dataset-tile/dataset-tile.component';
import { AnalysisPanelComponent } from './components/analysis-panel/analysis-panel.component';
import { TaskListComponent } from './components/task-list/task-list.component';
import { ToggleComponent } from './components/toggle/toggle.component';
import { InfoTileComponent } from './components/info-tile/info-tile.component';
import { DownloadButtonComponent } from './components/network/network-menu/download-button/download-button.component';

import { MatTooltipModule } from '@angular/material/tooltip';

import { AnalysisService } from './services/analysis/analysis.service';
import { AddExpressedProteinsComponent } from './dialogs/add-expressed-proteins/add-expressed-proteins.component';
import { createCustomElement } from '@angular/elements';
import { NetworkLegendComponent } from './components/network/network-legend/network-legend.component';
import { ProtTableComponent } from './components/analysis-panel/prot-table/prot-table.component';
import { DrugTableComponent } from './components/analysis-panel/drug-table/drug-table.component';

import { TooltipModule } from 'primeng/tooltip';
import { NetworkMenuComponent } from './components/network/network-menu/network-menu.component';
import { NetworkComponent } from './components/network/network.component';
import { ToggleInplaceComponent } from './components/network/network-menu/toggle-inplace/toggle-inplace.component';
import { NetworkMenuLeftComponent } from './components/network/network-menu-left/network-menu-left.component';
import { ToggleInplaceReversedComponent } from './components/network/network-menu-left/toggle-inplace-reversed/toggle-inplace-reversed.component';
import { DownloadButtonInverseComponent } from './components/network/network-menu-left/download-button-inverse/download-button-inverse.component';
import { NetworkControlComponent } from './components/network-control/network-control.component';
import { CenterViewComponent } from './components/network/network-menu/center-view/center-view.component';
import { CenterViewInverseComponent } from './components/network/network-menu-left/center-view-inverse/center-view-inverse.component';
import { LicenseAgreementComponent } from './components/license-agreement/license-agreement.component';
import { QuickDrugTargetComponent } from './components/quick-drug-target/quick-drug-target.component';
import { QuickDrugComponent } from './components/quick-drug/quick-drug.component';
import { ToastComponent } from './components/toast/toast.component';
import { GroupSelectionComponent } from './pages/explorer-page/group-selection/group-selection.component';
import { FaSolidIconComponent } from './components/fa-solid-icon/fa-solid-icon.component';
import { FaIconsComponent } from './pages/explorer-page/fa-icons/fa-icons.component';
import { LoadingScreenComponent } from './components/loading-screen/loading-screen.component';
import { PrivacyBannerComponent } from './components/privacy-banner/privacy-banner.component';
import { ParserWarningComponent } from './components/parser-warning/parser-warning.component';
import { GroupWarningComponent } from './components/group-warning/group-warning.component';
import { NetworkWarningComponent } from './components/network-warning/network-warning.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SummaryNodeComponent } from './pages/explorer-page/summary-node/summary-node/summary-node.component';
import { NetworkOverviewComponent } from './pages/explorer-page/network-overview/network-overview/network-overview.component';
import { InfoTileEdgeComponent } from './components/info-tile-edge/info-tile-edge/info-tile-edge.component';
import { NetworkEmptyWarningComponent } from './components/network-empty-warning/network-empty-warning.component';
import { BugReportComponent } from './components/bug-report/bug-report.component';
import { ViewListComponent } from './components/analysis-panel/view-list/view-list.component';
import { ImageComponent } from './image/image.component';
import { ImageFallbackDirective } from './directives/image-fallback/image-fallback.directive';
import { ExternalAnalysisButtonComponent } from './components/external-analysis-button/external-analysis-button.component';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';




@NgModule({
  declarations: [
    ExplorerPageComponent,
    QueryTileComponent,
    LaunchAnalysisComponent,
    DatasetTileComponent,
    AnalysisPanelComponent,
    TaskListComponent,
    ToggleComponent,
    InfoTileComponent,
    AddExpressedProteinsComponent,
    NetworkLegendComponent,
    ProtTableComponent,
    DrugTableComponent,
    DownloadButtonComponent,
    NetworkMenuComponent,
    NetworkComponent,
    ToggleInplaceComponent,
    NetworkMenuLeftComponent,
    ToggleInplaceReversedComponent,
    DownloadButtonInverseComponent,
    NetworkControlComponent,
    CenterViewComponent,
    CenterViewInverseComponent,
    LicenseAgreementComponent,
    QuickDrugTargetComponent,
    QuickDrugComponent,
    ToastComponent,
    GroupSelectionComponent,
    FaSolidIconComponent,
    FaIconsComponent,
    LoadingScreenComponent,
    PrivacyBannerComponent,
    ParserWarningComponent,
    GroupWarningComponent,
    NetworkWarningComponent,
    SummaryNodeComponent,
    NetworkOverviewComponent,
    InfoTileEdgeComponent,
    NetworkEmptyWarningComponent,
    BugReportComponent,
    ViewListComponent,
    ImageComponent,
    ImageFallbackDirective,
    ExternalAnalysisButtonComponent,
  ],
  imports: [
    BrowserModule,
    NgSelectModule,
    NgbModule,
    FormsModule,
    CommonModule,
    HttpClientModule,
    BrowserAnimationsModule,
    TableModule,
    MatTooltipModule,
    TooltipModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule
  ],
  providers: [AnalysisService],
})
export class AppModule {


  constructor(injector: Injector) {
    const NetworkExpander = createCustomElement(ExplorerPageComponent, { injector });
    // Register the custom element with the browser.
    customElements.define('drugst-one', NetworkExpander);
  }

  ngDoBootstrap() {
  }

}
