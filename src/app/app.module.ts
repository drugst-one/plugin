import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {ExplorerPageComponent} from './pages/explorer-page/explorer-page.component';
import {AboutPageComponent} from './pages/about-page/about-page.component';
import {HomePageComponent} from './pages/home-page/home-page.component';


@NgModule({
  declarations: [
    AppComponent,
    ExplorerPageComponent,
    AboutPageComponent,
    HomePageComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    CommonModule
  ],
  providers: [],
  bootstrap: [AppComponent]

})
export class AppModule { }
