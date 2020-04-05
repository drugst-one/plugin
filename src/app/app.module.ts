import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {NgSelectModule} from '@ng-select/ng-select';

import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {ExplorerPageComponent} from './pages/explorer-page/explorer-page.component';
import {AboutPageComponent} from './pages/about-page/about-page.component';
import {HomePageComponent} from './pages/home-page/home-page.component';
import {HttpClientModule} from '@angular/common/http';
import {QueryComponent} from './components/query/query.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ProteinAnalysisComponent} from './components/protein-analysis/protein-analysis.component';
import {SelectDatasetComponent} from './components/select-dataset/select-dataset.component';
import {AnalysisWindowComponent} from './components/analysis-window/analysis-window.component';
import {TaskListComponent} from './components/task-list/task-list.component';
import {AnalysisService} from './analysis.service';


@NgModule({
  declarations: [
    AppComponent,
    ExplorerPageComponent,
    AboutPageComponent,
    HomePageComponent,
    QueryComponent,
    ProteinAnalysisComponent,
    SelectDatasetComponent,
    AnalysisWindowComponent,
    TaskListComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgSelectModule,
    FormsModule,
    CommonModule,
    HttpClientModule,
    BrowserAnimationsModule,
  ],
  providers: [AnalysisService],
  bootstrap: [AppComponent]

})
export class AppModule {
}
