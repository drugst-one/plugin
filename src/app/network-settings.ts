import { getGradientColor } from './utils';
import {
  Node,
} from './interfaces';
import { IConfig, defaultConfig } from './config';
import * as merge from 'lodash/fp/merge';

export class NetworkSettings {

  // colors
  private static Grey = '#A0A0A0';
  private static White = '#FFFFFF';
  private static Black = '#000000';

  // Node color
  private static hostColor = '#123456';
  private static approvedDrugColor = '#48C774';
  private static unapprovedDrugColor = '#F8981D';
  private static nonSeedHostColor = '#3070B3';

  // Edge color
  private static edgeHostDrugColor = '#686868';
  private static edgeHostDrugHighlightColor = '#686868';
  private static edgeGeneGeneColor = '#686868';
  private static edgeGeneGeneHighlightColor = '#686868';

  private static hostFontColor = NetworkSettings.White;
  private static drugFontColor = NetworkSettings.White;

  // Network Layout
  private static analysisLayout = {
    improvedLayout: true,
  };
  private static analysisEdges = {
    smooth: false,
  };
  private static analysisPhysics = {
    enabled: true,
    stabilization: {
      enabled: true,
    },
    repulsion: {
      centralGravity: 0,
    },
    solver: 'repulsion',
  };
  private static analysisBigPhysics = {
    enabled: false,
  };

  private static mainLayout = {
    improvedLayout: false,
  };
  private static mainEdges = {
    smooth: false,
    length: 250
  };
  private static mainPhysics = {
    enabled: false
  };

  static getOptions(network: 'main' | 'analysis' | 'analysis-big', physicsOn) {
    if (network === 'main') {
      return {
        layout: this.mainLayout,
        edges: this.mainEdges,
        physics: physicsOn || this.mainPhysics,
      };
    } else if (network === 'analysis') {
      return {
        layout: this.analysisLayout,
        edges: this.analysisEdges,
        physics: physicsOn || this.analysisPhysics,
      };
    } else if (network === 'analysis-big') {
      return {
        layout: this.analysisLayout,
        edges: this.analysisEdges,
        physics: physicsOn || this.analysisBigPhysics,
      };
    }
  }

  static getNodeStyle(
    node: Node,
    config: IConfig,
    isSeed: boolean,
    isSelected: boolean,
    gradient: number = 1,
    renderer = null): Node {
    // delete possible old styles
    Object.keys(config.nodeGroups.default).forEach(e => delete node[e]);

    // set group styles
    if (node.group === 'default') {
      node = merge(node, config.nodeGroups.default);
    } else {
      node = merge(node, config.nodeGroups[node.group]);
    }

    // note that seed and selected node style are applied after the node style is fetched.
    // this allows to overwrite only attributes of interest, therefore in e.g. seedNode group
    // certain attributes like shape can remain undefined
    // use lodash merge to not lose deep attributes, e.g. "font.size"
    if (isSeed) {
      // apply seed node style to node
      node = merge(node, config.nodeGroups.seedNode);
    }
    // selection on purpose after seed style, so seed style will be combined with selection style
    if (isSelected) {
      // apply selected node style to node
      node = merge(node, config.nodeGroups.selectedNode);
    }
    // show image if image url is given. If seed nodes are highlighted, ignore image property
    if (node.image && !isSeed) {
      node.shape = 'image';
    }
    // use opactiy as gradient
    if (gradient === null) {
      node.opacity = 0
    } else {
      node.opacity = gradient
    }
    // custom ctx renderer for e.g. pie chart
    if (renderer !== null) {
      node.shape = 'custom';
      node.ctxRenderer = renderer;
    }
    return node;
  }
}

