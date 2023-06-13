# Drugst.One App

Drugst.One is a plug-and-play solution to make your biomedical (web-)tool drug repurposing ready. With just three lines of code the plugin can be integrated into your website within a few minues of work. Learn more at [drugst.one](https://drugst.one).

## Local development

Run `npm run start:dev` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Development for dev-backend 

Run `npm run start:dev_server` for a dev server using the backend-dev server on https://drugstone-dev-api.zbh.uni-hamburg.de/. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.


## Development for prod-backend 

Run `npm run start:prod` for a dev server using the backend-dev server on https://api.drugst.one/. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.


## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Techonlogies

This project was uses Angular 14.

## Build

Run `npm run build:drugstone` to build the project or `npm run build:drugstone-dev` to build for the dev-backend. The build artifacts will be stored in the `dist/` directory.

## Build testing

Open the `src/index_local_static.html` file in any browser to load and test the built application.


## For main devs only! Create and release js and css

`cd releases && ./release_tag.sh $VERSION $MESSAGE`
e.g.
`cd releases && ./release_tag.sh 1.0.0-rc1 "This release features new layouting"`

## Delete release from repository
`cd releases && ./delete_tag.sh $VERSION`
