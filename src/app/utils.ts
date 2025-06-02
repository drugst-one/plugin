// From https://stackoverflow.com/a/27709336/3850564
import {ɵisListLikeIterable} from '@angular/core';
import {NetworkEdge, Node} from './interfaces';

export function getGradientColor(
  startColor: string,
  endColor: string,
  percent: number
) {
  // strip the leading # if it's there
  startColor = startColor.replace(/^\s*#|\s*$/g, '');
  endColor = endColor.replace(/^\s*#|\s*$/g, '');

  // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
  if (startColor.length === 3) {
    startColor = startColor.replace(/(.)/g, '$1$1');
  }

  if (endColor.length === 3) {
    endColor = endColor.replace(/(.)/g, '$1$1');
  }

  // get colors
  const startRed = parseInt(startColor.substr(0, 2), 16);
  const startGreen = parseInt(startColor.substr(2, 2), 16);
  const startBlue = parseInt(startColor.substr(4, 2), 16);

  const endRed = parseInt(endColor.substr(0, 2), 16);
  const endGreen = parseInt(endColor.substr(2, 2), 16);
  const endBlue = parseInt(endColor.substr(4, 2), 16);

  // calculate new color
  const diffRed = endRed - startRed;
  const diffGreen = endGreen - startGreen;
  const diffBlue = endBlue - startBlue;

  let diffRedStr = `${
    (diffRed * percent + startRed).toString(16).split('.')[0]
  }`;
  let diffGreenStr = `${
    (diffGreen * percent + startGreen).toString(16).split('.')[0]
  }`;
  let diffBlueStr = `${
    (diffBlue * percent + startBlue).toString(16).split('.')[0]
  }`;

  // ensure 2 digits by color
  if (diffRedStr.length === 1) {
    diffRedStr = '0' + diffRedStr;
  }
  if (diffGreenStr.length === 1) {
    diffGreenStr = '0' + diffGreenStr;
  }
  if (diffBlueStr.length === 1) {
    diffBlueStr = '0' + diffBlueStr;
  }

  return '#' + diffRedStr + diffGreenStr + diffBlueStr;
}

export function removeUnderscoreFromKeys(obj) {
  const result = {};
  Object.keys(obj).forEach((x) => {
    const y = x.replace('_', '');
    result[y] = obj[x];
  });
  return result;
}

// https://gist.github.com/whitlockjc/9363016
function trim(str) {
  return str.replace(/^\s+|\s+$/gm, '');
}

export function rgbaToHex(rgba) {
  const inParts = rgba.substring(rgba.indexOf('(')).split(','),
    r = parseInt(trim(inParts[0].substring(1)), 10),
    g = parseInt(trim(inParts[1]), 10),
    b = parseInt(trim(inParts[2]), 10),
    a: number = parseFloat(
      parseFloat(trim(inParts[3].substring(0, inParts[3].length - 1))).toFixed(
        2
      )
    );
  const outParts = [
    r.toString(16),
    g.toString(16),
    b.toString(16),
    Math.round(a * 255)
      .toString(16)
      .substring(0, 2),
  ];

  // Pad single-digit output values
  outParts.forEach(function (part, i) {
    if (part.length === 1) {
      outParts[i] = '0' + part;
    }
  });

  return '#' + outParts.join('');
}

// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function componentToHex(c) {
  const hex = c.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

export function rgbToHex(rgb) {
  const inParts = rgb.substring(rgb.indexOf('(')).split(','),
    r = parseInt(trim(inParts[0].substring(1)), 10),
    g = parseInt(trim(inParts[1]), 10),
    b = parseInt(trim(inParts[2]), 10);
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export function rgbaWithoutAToHex(rgb) {
  const inParts = rgb.substring(rgb.indexOf('(')).split(','),
    r = parseInt(trim(inParts[0].substring(1)), 10),
    g = parseInt(trim(inParts[1]), 10),
    b = parseInt(trim(inParts[2]), 10);
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// https://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes/47355187#47355187
export function standardizeColor(str) {
  var ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = str;
  return ctx.fillStyle.toString();
}

export function removeDuplicateObjectsFromList(
  nodes: Node[],
  attribute: string
): Node[] {
  const seenIds = new Set();
  const filteredArray = new Array();
  for (const node of nodes) {
    if (node[attribute] != null && seenIds.has(node[attribute])) {
      continue;
    }
    filteredArray.push(node);
    seenIds.add(node[attribute]);
  }
  return filteredArray;
}

/**
 * Method is use to download file.
 * @param data - Array Buffer data
 * @param type - type of the document.
 */
export function downLoadFile(
  data: any,
  type: string,
  fmt: string,
  label: string = 'drugstone_network'
) {
  let blob = new Blob([data], {type: type});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${label}_${new Date().getTime()}.${fmt}`;
  a.click();
  return a.download;
}

export function RGBAtoRGBwithoutA(rgbaString) {
  const rgbaStringSplit = rgbaString.slice(5, -1).split(',');
  const RGBA = {
    red: rgbaStringSplit[0],
    green: rgbaStringSplit[1],
    blue: rgbaStringSplit[2],
    alpha: rgbaStringSplit[3],
  };
  return `rgb(${RGBA.red},${RGBA.green},${RGBA.blue})`;
}

function hexToRGBA(hex, alpha) {
  let r;
  let g;
  let b;
  if (hex.startsWith('rgba')) {
    return hex;
  }
  let h = hex.trim()
  if (h.length < 5) {
    r = parseInt(h.slice(1, 2) + h.slice(1, 2), 16);
    g = parseInt(h.slice(2, 3) + h.slice(2, 3), 16);
    b = parseInt(h.slice(3, 4) + h.slice(3, 4), 16);
  } else {
    r = parseInt(h.slice(1, 3), 16);
    g = parseInt(h.slice(3, 5), 16);
    b = parseInt(h.slice(5, 7), 16);
  }
  if (alpha) {
    return (
      'rgba(' +
      (isNaN(r) ? 0 : r) +
      ', ' +
      (isNaN(g) ? 0 : g) +
      ', ' +
      (isNaN(b) ? 0 : b) +
      ', ' +
      alpha +
      ')'
    );
  } else {
    return 'rgb(' + (isNaN(r) ? 0 : r) + ', ' + isNaN(g)
      ? 0
      : g + ', ' + isNaN(b)
        ? 0
        : b + ')';
  }
}

// https://gist.github.com/JordanDelcros/518396da1c13f75ee057?permalink_comment_id=2075095#gistcomment-2075095
export function blendColors(args: any) {
  let base = [0, 0, 0, 0];
  let mix;
  for (let added of args) {
    added = RGBAtoArray(added);
    if (typeof added[3] === 'undefined') {
      added[3] = 1;
    }
    // check if both alpha channels exist.
    if (base[3] && added[3]) {
      mix = [0, 0, 0, 0];
      // alpha
      mix[3] = 1 - (1 - added[3]) * (1 - base[3]);
      // red
      mix[0] = Math.round(
        (added[0] * added[3]) / mix[3] +
        (base[0] * base[3] * (1 - added[3])) / mix[3]
      );
      // green
      mix[1] = Math.round(
        (added[1] * added[3]) / mix[3] +
        (base[1] * base[3] * (1 - added[3])) / mix[3]
      );
      // blue
      mix[2] = Math.round(
        (added[2] * added[3]) / mix[3] +
        (base[2] * base[3] * (1 - added[3])) / mix[3]
      );
    } else if (added) {
      mix = added;
    } else {
      mix = base;
    }
    base = mix;
  }

  return 'rgba(' + mix[0] + ', ' + mix[1] + ', ' + mix[2] + ', ' + mix[3] + ')';
}

export function RGBAtoArray(rgbaString) {
  const rgbaStringSplit = rgbaString.slice(5, -1).split(',');
  return [
    rgbaStringSplit[0],
    rgbaStringSplit[1],
    rgbaStringSplit[2],
    rgbaStringSplit[3],
  ];
}

export function pieChartContextRenderer({
                                          ctx,
                                          x,
                                          y,
                                          state: {selected, hover},
                                          style,
                                          label,
                                        }) {
  ctx.drawPieLabel = function (style, x, y, label) {
    ctx.font = 'normal 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue('--drgstn-text-primary');
    ctx.fillText(label, x, y + style.size + 12);
  };

  function startShadow() {
    if (style.shadow) {
      ctx.save();
      ctx.shadowColor = style.shadowColor;
      ctx.shadowOffsetX = style.shadowX;
      ctx.shadowOffsetY = style.shadowY;
      ctx.shadowBlur = 10;
    }
  }

  function colorToHex(color) {
    if (color.startsWith('#')) {
      return color;
    }
    if (color.startsWith('rgba')) {
      return rgbToHex(color);
    }
    if (color.startsWith('rgb')) {
      return rgbToHex(color);
    }
    return null;
  }

  function endShadow() {
    if (style.shadow) {
      // removing shadow application of future fill or stroke calls
      ctx.restore();
    }
  }

  ctx.drawPie = function (style, x, y, state: { selected; hover }) {
    const selection =
      RGBAtoRGBwithoutA(style.borderColor) !== RGBAtoRGBwithoutA(style.color);
    const bgOpacity = 0.15;
    const fgOpacity = 0.5;
    const lineOpacity = 0.6;
    const fullCircle = 2 * Math.PI;
    const fallbackColor = '#FF0000';
    const colorOrFallback = style.color
      ? colorToHex(style.color)
      : fallbackColor;
    let outerBorderColor = style.borderColor;
    if (selection) {
      outerBorderColor = style.borderColor
        ? rgbaWithoutAToHex(style.borderColor)
        : fallbackColor;
    }
    if (selected) {
      style.borderColor = style.color;
    }

    ctx.beginPath();
    ctx.arc(x, y, style.size - 1, 0, 2 * Math.PI, false);
    // fill like background of graph panel
    ctx.fillStyle = RGBAtoRGBwithoutA(
      blendColors([
        hexToRGBA(
          window
            .getComputedStyle(document.documentElement)
            .getPropertyValue('--drgstn-panel'),
          1
        ),
        hexToRGBA(colorOrFallback, bgOpacity),
      ])
    );
    startShadow();
    ctx.fill();
    endShadow();
    ctx.stroke();

    // draw pi-chart
    ctx.fillStyle = hexToRGBA(colorOrFallback, fgOpacity);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, style.size - 1, 0, style.opacity * fullCircle, false);
    ctx.fill();
    ctx.lineTo(x, y);

    ctx.lineWidth = selected ? 3 : 2;
    if (style.opacity < 1) {
      // avoid the inner line when circle is complete
      ctx.strokeStyle = hexToRGBA(outerBorderColor, lineOpacity);
      ctx.stroke();
    }

    // draw outer circle
    ctx.strokeStyle = outerBorderColor;
    ctx.beginPath();
    ctx.arc(x, y, style.size - (selected ? 0 : 1), 0, fullCircle);
    ctx.stroke();

    // draw inner circle (double circle if selected)
    if (selected || selection) {
      ctx.beginPath();
      ctx.strokeStyle = hexToRGBA(colorOrFallback, lineOpacity);
      ctx.arc(x, y, style.size - 2, 0, fullCircle);
      ctx.stroke();
    }
  };

  return {
    // bellow arrows
    // primarily meant for nodes and the labels inside of their boundaries
    drawNode() {
      ctx.drawPie(style, x, y);
    },
    // above arrows
    // primarily meant for labels outside of the node
    drawExternalLabel() {
      ctx.drawPieLabel(style, x, y, label);
    },
    // node dimensions defined by node drawing
    // nodeDimensions: { width: style.size*2, height: style.size*2 },
  };
}

export const downloadEdgeAttributes = ['from', 'to', 'groupName', 'isStimulation', 'isDirected', 'isInhibition'];
export const downloadNodeAttributes = [
  'label',
  'id',
  'drugId', // DrugBank ID
  'symbol',
  'uniprot',
  'ensg',
  'entrez',
  'proteinName',
  'isSeed',
  'score',
  'rank',
  'status',
  'groupName',
  'cluster',
  'layer',
  'cellularComponent',
  'group',
  'degreeInNetwork',
  'spd',
  'degreeInPpi',
  'localClusteringCoefficient',
  'rank',
];

const _formatNetworkData = function (
  nodes: any[],
  edges: string[],
  nodeAttrs: string[],
  edgeAttrs: string[]
) {
  const nodeData = {};
  let iNode = 0;
  nodes.forEach((nodeObj) => {
    const item = {};
    nodeAttrs.forEach((attr) => {
      if (nodeObj.hasOwnProperty(attr)) {
        item[attr] = nodeObj[attr];
      }
    });
    nodeData[iNode] = item;
    iNode++;
  });

  const edgeData = {};
  let iEdge = 0;
  edges.forEach((edgeObj) => {
    const item = {};
    edgeAttrs.forEach((attr) => {
      if (edgeObj.hasOwnProperty(attr)) {
        item[attr] = edgeObj[attr];
      }
    });
    edgeData[iEdge] = item;
    iEdge++;
  });
  return {nodes: nodeData, edges: edgeData};
};

export const downloadJSON = function (
  nodes: Node[],
  edges: any[],
  nodeAttrs: string[],
  edgeAttrs: string[],
  label: string = 'drugstone'
) {
  const dataFormatted = _formatNetworkData(nodes, edges, nodeAttrs, edgeAttrs);
  const output = JSON.stringify(dataFormatted);
  const fmt = 'json';
  return downLoadFile(output, `application/${fmt}`, fmt, label);
};


export const downloadGraphml = function (
  nodes: any[],
  edges: any[],
  nodeAttrs: string[],
  edgeAttrs: string[],
  label: string = 'drugstone'
) {
  // const dataFormatted = _formatNetworkData(nodes, edges, nodeAttrs, edgeAttrs);

  const graphml = [
    '<graphml xmlns="http://graphml.graphdrawing.org/xmlns" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd"> ',
  ];
  for (let i = edgeAttrs.length + nodeAttrs.length - 1; i >= nodeAttrs.length; i--) {
    graphml.push(`<key id="d${i}" for="edge" attr.name="${edgeAttrs[i]}" attr.type="string" />`);
  }
  for (let i = nodeAttrs.length - 1; i >= 0; i--) {
    graphml.push(`<key id="d${i}" for="node" attr.name="${nodeAttrs[i]}" attr.type="string" />`);
  }
  graphml.push('<graph edgedefault="undirected">');

  nodes.forEach(node => {
    graphml.push(`<node id="${node.id}">`);
    for (let i = 0; i < nodeAttrs.length; i++) {
      if (node.hasOwnProperty(nodeAttrs[i])) {
        graphml.push(`<data key="d${i}">${node[nodeAttrs[i]]}</data>`);
      }
    }
    graphml.push(`</node>`);
  });

  edges.forEach(edge => {
    graphml.push(`<edge source="${edge.from}" target="${edge.to}">`);
    for (let i = nodeAttrs.length; i < nodeAttrs.length + edgeAttrs.length; i++) {
      if (edge.hasOwnProperty(edgeAttrs[i - nodeAttrs.length])) {
        graphml.push(`<data key="d${i}">${edge[edgeAttrs[i - nodeAttrs.length]]}</data>`);
      }
    }
    graphml.push(`</edge>`);
  });

  graphml.push('</graph>');
  graphml.push('</graphml>');

  const output = graphml.join('');
  const fmt = 'graphml';
  return downLoadFile(output, `application/${fmt}`, fmt, label);
};

export const downloadCSV = function (
  nodes: any[],
  edges: any[],
  nodeAttrs: string[],
  edgeAttrs: string[],
  label: string = 'drugstone'
) {
  const dataFormatted = _formatNetworkData(nodes, edges, nodeAttrs, edgeAttrs);
  const array = [];
  const idx_map = {};
  const value_map = {};
  const nr_of_nodes = Object.keys(dataFormatted.nodes).length;
  Object.keys(dataFormatted.nodes).forEach((key) => {
    idx_map[key] = dataFormatted.nodes[key].id;
    value_map[dataFormatted.nodes[key].id] = key;
    let line = []
    // @ts-ignore
    for (let i = 0; i < nr_of_nodes; i++) {
      line.push(0)
    }
    array.push(line)
  });
  Object.values(dataFormatted.edges).forEach( value => {
    let id1 = value_map[value['from']]
    let id2 = value_map[value['to']]
    array[id1][id2] = 1
    array[id2][id1] = 1;
  })

  const header = Object.keys(value_map)
  header.unshift('')
  array.unshift(header)
  let rows = []
  for (let i = 1; i < array.length; i++) {
    array[i].unshift(header[i])
  }
  array.forEach( row => {
    rows.push(row.join(','))
  })

  const output = rows.join('\n');
  const fmt = 'csv';
  return downLoadFile(output, `application/${fmt}`, fmt, label);
}

export const downloadResultCSV = function (
  array: any[],
  columns: string[],
  label: string = 'drugstone'
) {
  const flattenedArray = array.map((el) => {
    if ('properties' in el && typeof el.properties === 'object') {
      const properties = el.properties;
      Object.keys(properties).forEach((key) => {
        el[key] = properties[key];
      });
      delete el.properties;
    }
    return el;
  });
  // test which columns occur in array elements, function should not fail if columns do not occur
  const headerColumns = [];
  columns.forEach((col) => {
    if (col in array[0]) {
      headerColumns.push(col);
    }
  });

  // headerColumns has all attributes from 'columns' that appear in the elements of 'array'
  let output = headerColumns.join(',') + '\n';
  // fetch data from array, consider only attributes in headerColumns
  flattenedArray.forEach((el) => {
    const row = [];
    headerColumns.forEach((col) => {
      let value = el[col];
      if (value instanceof Array) {
        value = value.join('|');
      }
      if (!(typeof value == 'string' || value instanceof String)) {
        value = String(value);
      }
      if (value.includes(',')) {
        value = `"${value}"`;
      }
      row.push(value);
    });
    output += row.join(',');
    output += '\n';
  });
  const fmt = 'csv';
  return downLoadFile(output, `application/${fmt}`, fmt, label);
};
