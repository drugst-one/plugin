import {getGradientColor} from './utils';
import {
  Node,
} from './interfaces';
import { IConfig, defaultConfig} from './config';
import * as merge from 'lodash/fp/merge'; 

export class NetworkSettings {

  // colors
  private static Grey = '#A0A0A0'
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
    length: 250,
  };
  private static mainPhysics = {
    enabled: false,
  };

  // Node size
  private static hostSize = 20;
  private static drugSize = 15;

  // Node shape
  private static hostShape = 'ellipse';
  private static drugNotInTrialShape = 'box';
  private static drugInTrialShape = 'triangle';

  static getOptions(network: 'main' | 'analysis' | 'analysis-big') {
    if (network === 'main') {
      return {
        layout: this.mainLayout,
        edges: this.mainEdges,
        physics: this.mainPhysics,
      };
    } else if (network === 'analysis') {
      return {
        layout: this.analysisLayout,
        edges: this.analysisEdges,
        physics: this.analysisPhysics,
      };
    } else if (network === 'analysis-big') {
      return {
        layout: this.analysisLayout,
        edges: this.analysisEdges,
        physics: this.analysisBigPhysics,
      };
    }
  }

  static getColor(color: 'protein' | 'approvedDrug' | 'unapprovedDrug' | 'hostFont' | 'drugFont' |
    'nonSeedHost' | 'selectedForAnalysis' | 'selectedForAnalysisText' |
    'edgeHostDrug' | 'edgeHostDrugHighlight' | 'edgeGeneGene' | 'edgeGeneGeneHighlight') 
    /**
     * Collection of all colors per use-case
     */
    {
    if (color === 'protein') {
      return this.hostColor;
    } else if (color === 'approvedDrug') {
      return this.approvedDrugColor;
    } else if (color === 'unapprovedDrug') {
      return this.unapprovedDrugColor;
    } else if (color === 'hostFont') {
      return this.hostFontColor;
    } else if (color === 'drugFont') {
      return this.drugFontColor;
    } else if (color === 'nonSeedHost') {
      return this.nonSeedHostColor;
    } else if (color === 'edgeHostDrug') {
      return this.edgeHostDrugColor;
    } else if (color === 'edgeHostDrugHighlight') {
      return this.edgeHostDrugHighlightColor;
    } else if (color === 'edgeGeneGene') {
      return this.edgeGeneGeneColor;
    } else if (color === 'edgeGeneGeneHighlight') {
      return this.edgeGeneGeneHighlightColor;
    }
  }

  static getNodeStyle(
    node: Node,
    config: IConfig,
    isSeed: boolean,
    isSelected: boolean,
    gradient: number = 1): Node {
      // delete possible old styles
      Object.keys(defaultConfig.nodeGroups.default).forEach(e => delete node[e]);
      // set group styles
      if (node.group === 'default') {
        node = merge(node, defaultConfig.nodeGroups.default);
      } else {
        node = merge(node, config.nodeGroups[node.group]);
      }
      // note that seed and selected node style are applied after the node style is fetched. 
      // this allows to overwrite only attributes of interest, therefor in e.g. seedNode group
      // certain attributes like shape can remain undefined
      // use lodash merge to not lose deep attributes, e.g. "font.size"
      if (isSeed) {
        // apply seed node style to node
        node = merge(node, config.nodeGroups.seedNode);
      } else if (isSelected) {
        // apply selected node style to node
        console.log(node)
        node = merge(node, config.nodeGroups.selectedNode);
        console.log(node)
      }
      // show image if image url is given
      if (node.image) {
        node.shape = 'image';
      }
      // use opactiy as gradient
      if (gradient === null) {
          node.opacity = 0
        } else {
          node.opacity = gradient
        }
      return node;
    }
}

