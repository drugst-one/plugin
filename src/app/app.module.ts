import {Injector, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgSelectModule} from '@ng-select/ng-select';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {TableModule} from 'primeng/table';

import {AppComponent} from './app.component';
import {ExplorerPageComponent} from './pages/explorer-page/explorer-page.component';
import {QueryTileComponent} from './components/query-tile/query-tile.component';
import {LaunchAnalysisComponent} from './dialogs/launch-analysis/launch-analysis.component';
import {DatasetTileComponent} from './components/dataset-tile/dataset-tile.component';
import {AnalysisPanelComponent} from './components/analysis-panel/analysis-panel.component';
import {TaskListComponent} from './components/task-list/task-list.component';
import {ToggleComponent} from './components/toggle/toggle.component';
import {InfoTileComponent} from './components/info-tile/info-tile.component';
import {CustomProteinsComponent} from './dialogs/custom-proteins/custom-proteins.component';

import {AnalysisService} from './analysis.service';
import { AddExpressedProteinsComponent } from './dialogs/add-expressed-proteins/add-expressed-proteins.component';
import {createCustomElement} from '@angular/elements';


@NgModule({
  declarations: [
    AppComponent,
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
  ],
  imports: [
    BrowserModule,
    NgSelectModule,
    FormsModule,
    CommonModule,
    HttpClientModule,
    BrowserAnimationsModule,
    TableModule,
  ],
  providers: [AnalysisService],
})
export class AppModule {

  constructor(injector: Injector) {
    // Convert `PopupComponent` to a custom element.
    const NetworkExpander = createCustomElement(ExplorerPageComponent, {injector});
    // Register the custom element with the browser.
    customElements.define('network-expander', NetworkExpander);
  }

}
