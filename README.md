# Drugst.One App

Drugst.One is a plug-and-play solution to make your biomedical (web-)tool drug repurposing ready. With just three lines of code the plugin can be integrated into your website within a few minues of work. Drugst.One is a community driven project that aims to reduce development time and effort for scientists in the biomedical/bioinformatics fields, so that they can focus on the most important part of their work: research! Drugst.One is used by > 20 tools already, is highly configurable, light weight and focuses on drug repurposing. Learn more at [drugst.one](https://drugst.one). 

<img src="https://drugst.one/assets/Drugstone_preprint_figure1.png" alt="missing image">

## How to use Drugst.One

Drugst.One can be used by your website by adding the following two lines to the `<head></head>` section of your website index file.

``` html
<head>
   <script src="https://cdn.drugst.one/latest/drugstone.js"></script>
   <link rel="stylesheet" href="https://cdn.drugst.one/latest/styles.css">
</head>
```
After this, you can use the `<drugst-one></drugst-one>` component anywhere on your website and add some configuration as follows:

``` html
<drugst-one
   groups='{"nodeGroups":{"groupName":"Gene","shape":"circle"}}'
   config='{"identifier":"symbol","title":"Example network"}'
   network='{"nodes":[{"id":"CFTR","group":"gene","label":"CFTR"},{"id":"TGFB1","group":"gene","label":"TGFB1"}],"edges":[{"from":"DCTN4","to":"TGFB1"}]}'>
</drugst-one>
```

Styles of the component can be controlled by overriding the following CSS variables in your stylesheet. This might look as follows:

``` css
:root {
   --drgstn-primary:#347eee;
   --drgstn-secondary:#2e42f2;
   --drgstn-success:#48C774;
   --drgstn-warning:#ffdd00;
   --drgstn-danger:#ff2744;
   --drgstn-background:#f8f9fa;
   --drgstn-panel:#ffffff;
   --drgstn-info:#61c43d;
   --drgstn-text-primary:#151515;
   --drgstn-text-secondary:#eeeeee;
   --drgstn-border:rgba(0, 0, 0, 0.2);
   --drgstn-tooltip:rgba(74,74,74,0.9);
   --drgstn-panel-secondary:#FFFFFF;
   --drgstn-height:600px;
   --drgstn-font-family:Helvetica Neue, sans-serif;
}
```

Configuration and style might be created using the [Drugst.One playground](https://drugst.one/playground), a web interface that generates copy-pastable code.

## Compatability

We tested and provide example implementation code explicitly for the following web frameworks:

- Plain HTML/JS: [code](https://github.com/drugst-one/integration-examples/tree/main/basic); [documentation](https://drugst.one/doc#basic_integration)
- AngularJS: [code](https://github.com/drugst-one/integration-examples/tree/main/angular); [documentation](https://drugst.one/doc#angularjs_setup)
- Django: [code](https://gitlab.rrz.uni-hamburg.de/cosy-bio/drugst.one/template-django/-/tree/main/drugstone_template); [documentation](https://drugst.one/doc#djano_setup)
- Vue.js: [code](https://github.com/drugst-one/integration-examples/tree/main/vue); [documentation](https://drugst.one/doc#vuejs_setup)
- R-Shiny: [code](https://github.com/drugst-one/integration-examples/tree/main/shiny); [documentation](https://drugst.one/doc#rshiny_setup)

Some frameworks need additional configuration to allow or recognize the `<drugst-one>` component and tag but we ultimately any JavaScript-based framework is supported.

## Cite

Please refer to the cite section on our [website](https://drugst.one/cite).

# Development

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
