import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgSelectModule} from '@ng-select/ng-select';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {TableModule} from 'primeng/table';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {ExplorerPageComponent} from './pages/explorer-page/explorer-page.component';
import {AboutPageComponent} from './pages/about-page/about-page.component';
import {HomePageComponent} from './pages/home-page/home-page.component';
import {QueryComponent} from './components/query/query.component';
import {LaunchAnalysisComponent} from './components/launch-analysis/launch-analysis.component';
import {SelectDatasetComponent} from './components/select-dataset/select-dataset.component';
import {AnalysisWindowComponent} from './components/analysis-window/analysis-window.component';
import {TaskListComponent} from './components/task-list/task-list.component';
import {ToggleComponent} from './components/toggle/toggle.component';
import {InfoBoxComponent} from './components/info-box/info-box.component';

import {AnalysisService} from './analysis.service';


@NgModule({
  declarations: [
    AppComponent,
    ExplorerPageComponent,
    AboutPageComponent,
    HomePageComponent,
    QueryComponent,
    LaunchAnalysisComponent,
    SelectDatasetComponent,
    AnalysisWindowComponent,
    TaskListComponent,
    ToggleComponent,
    InfoBoxComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgSelectModule,
    FormsModule,
    CommonModule,
    HttpClientModule,
    BrowserAnimationsModule,
    TableModule,
  ],
  providers: [AnalysisService],
  bootstrap: [AppComponent]

})
export class AppModule {
}
