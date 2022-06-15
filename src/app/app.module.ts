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
import { DownloadButtonComponent } from './components/download-button/download-button.component';

import { MatTooltipModule } from '@angular/material/tooltip';

import { AnalysisService } from './services/analysis/analysis.service';
import { AddExpressedProteinsComponent } from './dialogs/add-expressed-proteins/add-expressed-proteins.component';
import { createCustomElement } from '@angular/elements';
import { NetworkLegendComponent } from './components/network-legend/network-legend.component';
import { ProtTableComponent } from './components/analysis-panel/prot-table/prot-table.component';
import { DrugTableComponent } from './components/analysis-panel/drug-table/drug-table.component';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import fontawesome from '@fortawesome/fontawesome';
import {
  faTimes, faAngleUp, faAngleLeft, faCapsules, faCrosshairs, faFlask, faCheck, faCamera, faDownload,
  faRulerVertical, faDna, faMicroscope, faBook, faPause, faTrash, faSpinner, faExclamationTriangle, faPlus,
  faExpand, faInfo, faRocket, faAngleDown, faSearch, faFastForward, faExternalLinkAlt, faTasks, faFilter,
  faMinus, faUpload, faAngleDoubleDown, faSync, faBroom, faAngleDoubleUp, faChild, faHeadSideMask, faBiohazard,
  faBullseye
} from '@fortawesome/free-solid-svg-icons';
import { TooltipModule } from 'primeng/tooltip';
import { NetworkMenuComponent } from './components/network-menu/network-menu.component';

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
      faSync, faBroom, faAngleDoubleUp, faChild, faHeadSideMask, faBiohazard, faBullseye);
    const NetworkExpander = createCustomElement(ExplorerPageComponent, { injector });
    // Register the custom element with the browser.
    customElements.define('drugst-one', NetworkExpander);
  }

  ngDoBootstrap() {
  }

}
