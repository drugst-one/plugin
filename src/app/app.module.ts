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
import { CustomProteinsComponent } from './dialogs/custom-proteins/custom-proteins.component';
import { DownloadButtonComponent } from './components/network/network-menu/download-button/download-button.component';

import { MatTooltipModule } from '@angular/material/tooltip';

import { AnalysisService } from './services/analysis/analysis.service';
import { AddExpressedProteinsComponent } from './dialogs/add-expressed-proteins/add-expressed-proteins.component';
import { createCustomElement } from '@angular/elements';
import { NetworkLegendComponent } from './components/network/network-legend/network-legend.component';
import { ProtTableComponent } from './components/analysis-panel/prot-table/prot-table.component';
import { DrugTableComponent } from './components/analysis-panel/drug-table/drug-table.component';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import fontawesome from '@fortawesome/fontawesome';
import {
  faTimes, faAngleUp, faAngleLeft, faCapsules, faCrosshairs, faFlask, faCheck, faCamera, faDownload,
  faRulerVertical, faDna, faMicroscope, faBook, faPause, faTrash, faSpinner, faExclamationTriangle, faPlus,
  faExpand, faInfo, faRocket, faAngleDown, faSearch, faFastForward, faExternalLinkAlt, faTasks, faFilter,
  faMinus, faUpload, faAngleDoubleDown, faSync, faBroom, faAngleDoubleUp, faChild, faHeadSideMask, faBiohazard,
  faBullseye, faSeedling, faSyncAlt, faCompress, faKey, faInfoCircle, faWrench, faProjectDiagram
} from '@fortawesome/free-solid-svg-icons';
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
    CustomProteinsComponent,
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
  ],
  imports: [
    BrowserModule,
    NgSelectModule,
    FormsModule,
    CommonModule,
    HttpClientModule,
    BrowserAnimationsModule,
    TableModule,
    FontAwesomeModule,
    MatTooltipModule,
    TooltipModule,
  ],
  providers: [AnalysisService],
})
export class AppModule {


  constructor(injector: Injector) {
    // @ts-ignore
    fontawesome.library.add(faTimes, faTimes, faAngleUp, faAngleLeft, faCapsules, faCrosshairs, faFlask,
      faCheck, faCamera, faDownload, faRulerVertical, faDna, faMicroscope, faBook, faPause, faTrash,
      faSpinner, faExclamationTriangle, faPlus, faExpand, faInfo, faRocket, faAngleDown, faSearch,
      faFastForward, faExternalLinkAlt, faTasks, faFilter, faMinus, faUpload, faAngleDoubleDown,
      faSync, faBroom, faAngleDoubleUp, faChild, faHeadSideMask, faBiohazard, faBullseye, faSeedling, 
      faSyncAlt, faExpand, faCompress, faKey, faInfoCircle, faWrench, faProjectDiagram);
    const NetworkExpander = createCustomElement(ExplorerPageComponent, { injector });
    // Register the custom element with the browser.
    customElements.define('drugst-one', NetworkExpander);
  }

  ngDoBootstrap() {
  }

}
