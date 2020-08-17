var util = (function (exports) {
	'use strict';

	/**
	 * Clock component.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class MonotonicClock {
	  constructor(startTime = MonotonicClock.getReferenceTime()) {
	    this._timeAtLastReset = startTime;
	  }
	  getTime() {
	    return MonotonicClock.getReferenceTime() - this._timeAtLastReset;
	  }
	  getLastResetTime() {
	    return this._timeAtLastReset;
	  }
	  static getReferenceTime() {
	    return performance.now() / 1000.0 - MonotonicClock._referenceTime;
	  }
	  static getDateStr(format = 'YYYY-MM-DD_HH[h]mm.ss.SSS') {
	    return moment().format(format);
	  }
	}
	MonotonicClock._referenceTime = performance.now() / 1000.0;
	class Clock extends MonotonicClock {
	  constructor() {
	    super();
	  }
	  reset(newTime = 0) {
	    this._timeAtLastReset = MonotonicClock.getReferenceTime() + newTime;
	  }
	  add(deltaTime) {
	    this._timeAtLastReset += deltaTime;
	  }
	}
	class CountdownTimer extends Clock {
	  constructor(startTime = 0) {
	    super();
	    this._timeAtLastReset = MonotonicClock.getReferenceTime();
	    this._countdown_duration = startTime;
	    if (startTime) {
	      this.add(startTime);
	    }
	  }
	  add(deltaTime) {
	    this._timeAtLastReset += deltaTime;
	  }
	  reset(newTime = undefined) {
	    if (typeof newTime == 'undefined') {
	      this._timeAtLastReset = MonotonicClock.getReferenceTime() + this._countdown_duration;
	    } else {
	      this._countdown_duration = newTime;
	      this._timeAtLastReset = MonotonicClock.getReferenceTime() + newTime;
	    }
	  }
	  getTime() {
	    return this._timeAtLastReset - MonotonicClock.getReferenceTime();
	  }
	}

	/**
	 * Color management.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class Color {
	  constructor(obj = 'black', colorspace = Color.COLOR_SPACE.RGB) {
	    const response = {
	      origin: 'Color',
	      context: 'when defining a color'
	    };
	    if (typeof obj == 'string') {
	      if (colorspace !== Color.COLOR_SPACE.RGB) {
	        throw Object.assign(response, {
	          error: 'the colorspace must be RGB for' + ' a' + ' named color'
	        });
	      }
	      if (obj[0] === '#') {
	        this._hex = obj;
	      }
	      else {
	          if (!(obj.toLowerCase() in Color.NAMED_COLORS)) {
	            throw Object.assign(response, {
	              error: 'unknown named color: ' + obj
	            });
	          }
	          this._hex = Color.NAMED_COLORS[obj.toLowerCase()];
	        }
	      this._rgb = Color.hexToRgb(this._hex);
	    }
	    else if (typeof obj == 'number') {
	        if (colorspace !== Color.COLOR_SPACE.RGB) {
	          throw Object.assign(response, {
	            error: 'the colorspace must be RGB for' + ' a' + ' named color'
	          });
	        }
	        this._rgb = Color._intToRgb(obj);
	      }
	      else if (Array.isArray(obj)) {
	          Color._checkTypeAndRange(obj);
	          let [a, b, c] = obj;
	          if (colorspace !== Color.COLOR_SPACE.RGB255) {
	            Color._checkTypeAndRange(obj, [-1, 1]);
	            a = (a + 1.0) / 2.0;
	            b = (b + 1.0) / 2.0;
	            c = (c + 1.0) / 2.0;
	          }
	          switch (colorspace) {
	            case Color.COLOR_SPACE.RGB255:
	              Color._checkTypeAndRange(obj, [0, 255]);
	              this._rgb = [a / 255.0, b / 255.0, c / 255.0];
	              break;
	            case Color.COLOR_SPACE.RGB:
	              this._rgb = [a, b, c];
	              break;
	            case Color.COLOR_SPACE.HSV:
	              break;
	            case Color.COLOR_SPACE.DKL:
	              break;
	            case Color.COLOR_SPACE.LMS:
	              break;
	            default:
	              throw Object.assign(response, {
	                error: 'unknown colorspace: ' + colorspace
	              });
	          }
	        }
	  }
	  get rgb() {
	    return this._rgb;
	  }
	  get rgb255() {
	    return [Math.round(this._rgb[0] * 255.0), Math.round(this._rgb[1] * 255.0), Math.round(this._rgb[2] * 255.0)];
	  }
	  get hex() {
	    if (typeof this._hex === 'undefined') {
	      this._hex = Color._rgbToHex(this._rgb);
	    }
	    return this._hex;
	  }
	  get int() {
	    if (typeof this._int === 'undefined') {
	      this._int = Color._rgbToInt(this._rgb);
	    }
	    return this._int;
	  }
	  toString() {
	    return this.hex;
	  }
	  static hexToRgb255(hex) {
	    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	    if (result == null) {
	      throw {
	        origin: 'Color.hexToRgb255',
	        context: 'when converting an hexadecimal color code to its 255- or [0,1]-based RGB color representation',
	        error: 'unable to parse the argument: wrong type or wrong code'
	      };
	    }
	    return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
	  }
	  static hexToRgb(hex) {
	    const [r255, g255, b255] = Color.hexToRgb255(hex);
	    return [r255 / 255.0, g255 / 255.0, b255 / 255.0];
	  }
	  static rgb255ToHex(rgb255) {
	    const response = {
	      origin: 'Color.rgb255ToHex',
	      context: 'when converting an rgb triplet to its hexadecimal color representation'
	    };
	    try {
	      Color._checkTypeAndRange(rgb255, [0, 255]);
	      return Color._rgb255ToHex(rgb255);
	    } catch (error) {
	      throw Object.assign(response, {
	        error
	      });
	    }
	  }
	  static rgbToHex(rgb) {
	    const response = {
	      origin: 'Color.rgbToHex',
	      context: 'when converting an rgb triplet to its hexadecimal color representation'
	    };
	    try {
	      Color._checkTypeAndRange(rgb, [0, 1]);
	      return Color._rgbToHex(rgb);
	    } catch (error) {
	      throw Object.assign(response, {
	        error
	      });
	    }
	  }
	  static rgbToInt(rgb) {
	    const response = {
	      origin: 'Color.rgbToInt',
	      context: 'when converting an rgb triplet to its integer representation'
	    };
	    try {
	      Color._checkTypeAndRange(rgb, [0, 1]);
	      return Color._rgbToInt(rgb);
	    } catch (error) {
	      throw Object.assign(response, {
	        error
	      });
	    }
	  }
	  static rgb255ToInt(rgb255) {
	    const response = {
	      origin: 'Color.rgb255ToInt',
	      context: 'when converting an rgb triplet to its integer representation'
	    };
	    try {
	      Color._checkTypeAndRange(rgb255, [0, 255]);
	      return Color._rgb255ToInt(rgb255);
	    } catch (error) {
	      throw Object.assign(response, {
	        error
	      });
	    }
	  }
	  static _rgb255ToHex(rgb255) {
	    return "#" + ((1 << 24) + (rgb255[0] << 16) + (rgb255[1] << 8) + rgb255[2]).toString(16).slice(1);
	  }
	  static _rgbToHex(rgb) {
	    let rgb255 = [Math.round(rgb[0] * 255), Math.round(rgb[1] * 255), Math.round(rgb[2] * 255)];
	    return Color._rgb255ToHex(rgb255);
	  }
	  static _rgbToInt(rgb) {
	    let rgb255 = [Math.round(rgb[0] * 255), Math.round(rgb[1] * 255), Math.round(rgb[2] * 255)];
	    return Color._rgb255ToInt(rgb255);
	  }
	  static _rgb255ToInt(rgb255) {
	    return rgb255[0] * 0x10000 + rgb255[1] * 0x100 + rgb255[2];
	  }
	  static _intToRgb255(hex) {
	    const r255 = hex >>> 0x10;
	    const g255 = (hex & 0xFF00) / 0x100;
	    const b255 = hex & 0xFF;
	    return [r255, g255, b255];
	  }
	  static _intToRgb(hex) {
	    const [r255, g255, b255] = Color._intToRgb255(hex);
	    return [r255 / 255.0, g255 / 255.0, b255 / 255.0];
	  }
	  static _checkTypeAndRange(arg, range = undefined) {
	    if (!Array.isArray(arg) || arg.length !== 3 || typeof arg[0] !== 'number' || typeof arg[1] !== 'number' || typeof arg[2] !== 'number') {
	      throw 'the argument should be an array of numbers of length 3';
	    }
	    if (typeof range !== 'undefined' && (arg[0] < range[0] || arg[0] > range[1] || arg[1] < range[0] || arg[1] > range[1] || arg[2] < range[0] || arg[2] > range[1])) {
	      throw 'the color components should all belong to [' + range[0] + ', ' + range[1] + ']';
	    }
	  }
	}
	Color.COLOR_SPACE = {
	  RGB: Symbol.for('RGB'),
	  RGB255: Symbol.for('RGB255')
	};
	Color.NAMED_COLORS = {
	  'aliceblue': '#F0F8FF',
	  'antiquewhite': '#FAEBD7',
	  'aqua': '#00FFFF',
	  'aquamarine': '#7FFFD4',
	  'azure': '#F0FFFF',
	  'beige': '#F5F5DC',
	  'bisque': '#FFE4C4',
	  'black': '#000000',
	  'blanchedalmond': '#FFEBCD',
	  'blue': '#0000FF',
	  'blueviolet': '#8A2BE2',
	  'brown': '#A52A2A',
	  'burlywood': '#DEB887',
	  'cadetblue': '#5F9EA0',
	  'chartreuse': '#7FFF00',
	  'chocolate': '#D2691E',
	  'coral': '#FF7F50',
	  'cornflowerblue': '#6495ED',
	  'cornsilk': '#FFF8DC',
	  'crimson': '#DC143C',
	  'cyan': '#00FFFF',
	  'darkblue': '#00008B',
	  'darkcyan': '#008B8B',
	  'darkgoldenrod': '#B8860B',
	  'darkgray': '#A9A9A9',
	  'darkgreen': '#006400',
	  'darkkhaki': '#BDB76B',
	  'darkmagenta': '#8B008B',
	  'darkolivegreen': '#556B2F',
	  'darkorange': '#FF8C00',
	  'darkorchid': '#9932CC',
	  'darkred': '#8B0000',
	  'darksalmon': '#E9967A',
	  'darkseagreen': '#8FBC8B',
	  'darkslateblue': '#483D8B',
	  'darkslategray': '#2F4F4F',
	  'darkturquoise': '#00CED1',
	  'darkviolet': '#9400D3',
	  'deeppink': '#FF1493',
	  'deepskyblue': '#00BFFF',
	  'dimgray': '#696969',
	  'dodgerblue': '#1E90FF',
	  'firebrick': '#B22222',
	  'floralwhite': '#FFFAF0',
	  'forestgreen': '#228B22',
	  'fuchsia': '#FF00FF',
	  'gainsboro': '#DCDCDC',
	  'ghostwhite': '#F8F8FF',
	  'gold': '#FFD700',
	  'goldenrod': '#DAA520',
	  'gray': '#808080',
	  'green': '#008000',
	  'greenyellow': '#ADFF2F',
	  'honeydew': '#F0FFF0',
	  'hotpink': '#FF69B4',
	  'indianred': '#CD5C5C',
	  'indigo': '#4B0082',
	  'ivory': '#FFFFF0',
	  'khaki': '#F0E68C',
	  'lavender': '#E6E6FA',
	  'lavenderblush': '#FFF0F5',
	  'lawngreen': '#7CFC00',
	  'lemonchiffon': '#FFFACD',
	  'lightblue': '#ADD8E6',
	  'lightcoral': '#F08080',
	  'lightcyan': '#E0FFFF',
	  'lightgoldenrodyellow': '#FAFAD2',
	  'lightgray': '#D3D3D3',
	  'lightgreen': '#90EE90',
	  'lightpink': '#FFB6C1',
	  'lightsalmon': '#FFA07A',
	  'lightseagreen': '#20B2AA',
	  'lightskyblue': '#87CEFA',
	  'lightslategray': '#778899',
	  'lightsteelblue': '#B0C4DE',
	  'lightyellow': '#FFFFE0',
	  'lime': '#00FF00',
	  'limegreen': '#32CD32',
	  'linen': '#FAF0E6',
	  'magenta': '#FF00FF',
	  'maroon': '#800000',
	  'mediumaquamarine': '#66CDAA',
	  'mediumblue': '#0000CD',
	  'mediumorchid': '#BA55D3',
	  'mediumpurple': '#9370DB',
	  'mediumseagreen': '#3CB371',
	  'mediumslateblue': '#7B68EE',
	  'mediumspringgreen': '#00FA9A',
	  'mediumturquoise': '#48D1CC',
	  'mediumvioletred': '#C71585',
	  'midnightblue': '#191970',
	  'mintcream': '#F5FFFA',
	  'mistyrose': '#FFE4E1',
	  'moccasin': '#FFE4B5',
	  'navajowhite': '#FFDEAD',
	  'navy': '#000080',
	  'oldlace': '#FDF5E6',
	  'olive': '#808000',
	  'olivedrab': '#6B8E23',
	  'orange': '#FFA500',
	  'orangered': '#FF4500',
	  'orchid': '#DA70D6',
	  'palegoldenrod': '#EEE8AA',
	  'palegreen': '#98FB98',
	  'paleturquoise': '#AFEEEE',
	  'palevioletred': '#DB7093',
	  'papayawhip': '#FFEFD5',
	  'peachpuff': '#FFDAB9',
	  'peru': '#CD853F',
	  'pink': '#FFC0CB',
	  'plum': '#DDA0DD',
	  'powderblue': '#B0E0E6',
	  'purple': '#800080',
	  'red': '#FF0000',
	  'rosybrown': '#BC8F8F',
	  'royalblue': '#4169E1',
	  'saddlebrown': '#8B4513',
	  'salmon': '#FA8072',
	  'sandybrown': '#F4A460',
	  'seagreen': '#2E8B57',
	  'seashell': '#FFF5EE',
	  'sienna': '#A0522D',
	  'silver': '#C0C0C0',
	  'skyblue': '#87CEEB',
	  'slateblue': '#6A5ACD',
	  'slategray': '#708090',
	  'snow': '#FFFAFA',
	  'springgreen': '#00FF7F',
	  'steelblue': '#4682B4',
	  'tan': '#D2B48C',
	  'teal': '#008080',
	  'thistle': '#D8BFD8',
	  'tomato': '#FF6347',
	  'turquoise': '#40E0D0',
	  'violet': '#EE82EE',
	  'wheat': '#F5DEB3',
	  'white': '#FFFFFF',
	  'whitesmoke': '#F5F5F5',
	  'yellow': '#FFFF00',
	  'yellowgreen': '#9ACD32'
	};

	/**
	 * Color Mixin.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	let ColorMixin = superclass => class extends superclass {
	  constructor(args) {
	    super(args);
	  }
	  setColor(color, log) {
	    this._setAttribute('color', color, log);
	    this._needUpdate = true;
	  }
	  setContrast(contrast, log) {
	    this._setAttribute('contrast', contrast, log);
	    this._needUpdate = true;
	  }
	  getContrastedColor(color, contrast) {
	    const rgb = color.rgb.map(c => (c * 2.0 - 1.0) * contrast);
	    return new Color(rgb, Color.COLOR_SPACE.RGB);
	  }
	};

	/**
	 * Various utilities.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	let mix = superclass => new MixinBuilder(superclass);
	class MixinBuilder {
	  constructor(superclass) {
	    this.superclass = superclass;
	  }
	  with(...mixins) {
	    return mixins.reduce((c, mixin) => mixin(c), this.superclass);
	  }
	}
	function promiseToTupple(promise) {
	  return promise.then(data => [null, data]).catch(error => [error, null]);
	}
	function makeUuid() {
	  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
	    const r = Math.random() * 16 | 0,
	          v = c === 'x' ? r : r & 0x3 | 0x8;
	    return v.toString(16);
	  });
	}
	function getErrorStack() {
	  try {
	    throw Error('');
	  } catch (error) {
	    let stack = error.stack.split("\n");
	    stack.splice(1, 1);
	    return JSON.stringify(stack.join('\n'));
	  }
	}
	function isEmpty(x) {
	  if (typeof x === 'undefined') {
	    return true;
	  }
	  if (!Array.isArray(x)) {
	    return false;
	  }
	  if (x.length === 0) {
	    return true;
	  }
	  if (x.length === 1 && typeof x[0] === 'undefined') {
	    return true;
	  }
	  return false;
	}
	function detectBrowser() {
	  const isOpera = !!window.opr && !!opr.addons || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
	  if (isOpera) {
	    return 'Opera';
	  }
	  const isFirefox = typeof InstallTrigger !== 'undefined';
	  if (isFirefox) {
	    return 'Firefox';
	  }
	  const isSafari = /constructor/i.test(window.HTMLElement) || function (p) {
	    return p.toString() === "[object SafariRemoteNotification]";
	  }(!window['safari'] || typeof safari !== 'undefined' && safari.pushNotification);
	  if (isSafari) {
	    return 'Safari';
	  }
	  const isIE =
	   !!document.documentMode;
	  if (isIE) {
	    return 'IE';
	  }
	  const isEdge = !isIE && !!window.StyleMedia;
	  if (isEdge) {
	    return 'Edge';
	  }
	  const isChrome = window.chrome;
	  if (isChrome) {
	    return 'Chrome';
	  }
	  const isEdgeChromium = isChrome && navigator.userAgent.indexOf("Edg") !== -1;
	  if (isEdgeChromium) {
	    return 'EdgeChromium';
	  }
	  const isBlink = (isChrome || isOpera) && !!window.CSS;
	  if (isBlink) {
	    return 'Blink';
	  }
	  return 'unknown';
	}
	function toNumerical(obj) {
	  const response = {
	    origin: 'util.toNumerical',
	    context: 'when converting an object to its numerical form'
	  };
	  if (typeof obj === 'number') {
	    return obj;
	  }
	  if (typeof obj === 'string') {
	    obj = [obj];
	  }
	  if (Array.isArray(obj)) {
	    return obj.map(e => {
	      let n = Number.parseFloat(e);
	      if (Number.isNaN(n)) {
	        Object.assign(response, {
	          error: 'unable to convert: ' + e + ' to a' + ' number.'
	        });
	      }
	      return n;
	    });
	  }
	}
	function IsPointInsidePolygon(point, vertices) {
	  const x = point[0];
	  const y = point[1];
	  let isInside = false;
	  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
	    const xi = vertices[i][0],
	          yi = vertices[i][1];
	    const xj = vertices[j][0],
	          yj = vertices[j][1];
	    const intersect = yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
	    if (intersect) {
	      isInside = !isInside;
	    }
	  }
	  return isInside;
	}
	function shuffle(array) {
	  for (let i = array.length - 1; i > 0; i--) {
	    const j = Math.floor(Math.random() * (i + 1));
	    [array[i], array[j]] = [array[j], array[i]];
	  }
	  return array;
	}
	function getPositionFromObject(object, units) {
	  const response = {
	    origin: 'util.getPositionFromObject',
	    context: 'when getting the position of an object'
	  };
	  try {
	    if (typeof object === 'undefined') {
	      throw 'cannot get the position of an undefined object';
	    }
	    let objectWin = undefined;
	    if (typeof object.getPos === 'function') {
	      units = object.units;
	      objectWin = object.win;
	      object = object.getPos();
	    }
	    return to_px(object, units, objectWin);
	  } catch (error) {
	    throw Object.assign(response, {
	      error
	    });
	  }
	}
	function to_px(pos, posUnit, win) {
	  const response = {
	    origin: 'util.to_px',
	    context: 'when converting a position to pixel units'
	  };
	  if (posUnit === 'pix') {
	    return pos;
	  } else if (posUnit === 'norm') {
	    return [pos[0] * win.size[0] / 2.0, pos[1] * win.size[1] / 2.0];
	  } else if (posUnit === 'height') {
	    const minSize = Math.min(win.size[0], win.size[1]);
	    return [pos[0] * minSize, pos[1] * minSize];
	  } else {
	    throw Object.assign(response, {
	      error: `unknown position units: ${posUnit}`
	    });
	  }
	}
	function to_norm(pos, posUnit, win) {
	  const response = {
	    origin: 'util.to_norm',
	    context: 'when converting a position to norm units'
	  };
	  if (posUnit === 'norm') {
	    return pos;
	  }
	  if (posUnit === 'pix') {
	    return [pos[0] / (win.size[0] / 2.0), pos[1] / (win.size[1] / 2.0)];
	  }
	  if (posUnit === 'height') {
	    const minSize = Math.min(win.size[0], win.size[1]);
	    return [pos[0] * minSize / (win.size[0] / 2.0), pos[1] * minSize / (win.size[1] / 2.0)];
	  }
	  throw Object.assign(response, {
	    error: `unknown position units: ${posUnit}`
	  });
	}
	function to_height(pos, posUnit, win) {
	  const response = {
	    origin: 'util.to_height',
	    context: 'when converting a position to height units'
	  };
	  if (posUnit === 'height') {
	    return pos;
	  }
	  if (posUnit === 'pix') {
	    const minSize = Math.min(win.size[0], win.size[1]);
	    return [pos[0] / minSize, pos[1] / minSize];
	  }
	  if (posUnit === 'norm') {
	    const minSize = Math.min(win.size[0], win.size[1]);
	    return [pos[0] * win.size[0] / 2.0 / minSize, pos[1] * win.size[1] / 2.0 / minSize];
	  }
	  throw Object.assign(response, {
	    error: `unknown position units: ${posUnit}`
	  });
	}
	function to_win(pos, posUnit, win) {
	  const response = {
	    origin: 'util.to_win',
	    context: 'when converting a position to window units'
	  };
	  try {
	    if (win._units === 'pix') {
	      return to_px(pos, posUnit, win);
	    }
	    if (win._units === 'norm') {
	      return to_norm(pos, posUnit, win);
	    }
	    if (win._units === 'height') {
	      return to_height(pos, posUnit, win);
	    }
	    throw `unknown window units: ${win._units}`;
	  } catch (error) {
	    throw Object.assign(response, {
	      response,
	      error
	    });
	  }
	}
	function to_unit(pos, posUnit, win, targetUnit) {
	  const response = {
	    origin: 'util.to_unit',
	    context: 'when converting a position to different units'
	  };
	  try {
	    if (targetUnit === 'pix') {
	      return to_px(pos, posUnit, win);
	    }
	    if (targetUnit === 'norm') {
	      return to_norm(pos, posUnit, win);
	    }
	    if (targetUnit === 'height') {
	      return to_height(pos, posUnit, win);
	    }
	    throw `unknown target units: ${targetUnit}`;
	  } catch (error) {
	    throw Object.assign(response, {
	      error
	    });
	  }
	}
	function to_pixiPoint(pos, posUnit, win) {
	  const pos_px = to_px(pos, posUnit, win);
	  return new PIXI.Point(pos_px[0], pos_px[1]);
	}
	function toString(object) {
	  if (typeof object === 'undefined') {
	    return 'undefined';
	  }
	  if (!object) {
	    return 'null';
	  }
	  if (typeof object === 'string') {
	    return object;
	  }
	  if (object.constructor.toString().substring(0, 5) === 'class' && typeof object.toString === 'function') {
	    return object.toString();
	  }
	  try {
	    const symbolReplacer = (key, value) => {
	      if (typeof value === 'symbol') {
	        value = Symbol.keyFor(value);
	      }
	      return value;
	    };
	    return JSON.stringify(object, symbolReplacer);
	  } catch (e) {
	    return 'Object (circular)';
	  }
	}
	if (!String.prototype.format) {
	  String.prototype.format = function () {
	    var args = arguments;
	    return this.replace(/{(\d+)}/g, function (match, number) {
	      return typeof args[number] != 'undefined' ? args[number] : match;
	    }).replace(/{([$_a-zA-Z][$_a-zA-Z0-9]*)}/g, function (match, name) {
	      return args.length > 0 && args[0][name] !== undefined ? args[0][name] : match;
	    });
	  };
	}
	function getRequestError(jqXHR, textStatus, errorThrown) {
	  let errorMsg = 'unknown error';
	  if (typeof jqXHR.responseJSON !== 'undefined') {
	    errorMsg = jqXHR.responseJSON;
	  } else if (typeof jqXHR.responseText !== 'undefined') {
	    errorMsg = jqXHR.responseText;
	  } else if (typeof errorThrown !== 'undefined') {
	    errorMsg = errorThrown;
	  }
	  return errorMsg;
	}
	function isInt(obj) {
	  if (isNaN(obj)) {
	    return false;
	  }
	  const x = parseFloat(obj);
	  return (x | 0) === x;
	}
	function getUrlParameters() {
	  const urlQuery = window.location.search.slice(1);
	  return new URLSearchParams(urlQuery);
	}
	function addInfoFromUrl(info) {
	  const infoFromUrl = getUrlParameters();
	  infoFromUrl.forEach((value, key) => {
	    if (key.indexOf('__') !== 0) {
	      info[key] = value;
	    }
	  });
	  return info;
	}
	function selectFromArray(array, selection) {
	  if (isInt(selection)) {
	    return array[parseInt(selection)];
	  }
	  else if (Array.isArray(selection)) {
	      return array.filter((e, i) => selection.includes(i));
	    }
	    else if (typeof selection === 'string') {
	        if (selection.indexOf(',') > -1) {
	          return selection.split(',').map(a => selectFromArray(array, a));
	        }
	        else if (selection.indexOf(':') > -1) {
	            let sliceParams = selection.split(':').map(a => parseInt(a));
	            if (sliceParams.length === 3) {
	              return sliceArray(array, sliceParams[0], sliceParams[2], sliceParams[1]);
	            } else {
	              return sliceArray(array, ...sliceParams);
	            }
	          }
	      } else {
	        throw {
	          origin: 'selectFromArray',
	          context: 'when selecting entries from an array',
	          error: 'unknown selection type: ' + typeof selection
	        };
	      }
	}
	function flattenArray(array) {
	  return array.reduce((flat, next) => {
	    flat.push(Array.isArray(next) && Array.isArray(next[0]) ? flattenArray(next) : next);
	    return flat;
	  }, []);
	}
	function sliceArray(array, from = NaN, to = NaN, step = NaN) {
	  if (isNaN(from)) {
	    from = 0;
	  }
	  if (isNaN(to)) {
	    to = array.length;
	  }
	  let arraySlice = array.slice(from, to);
	  if (isNaN(step)) {
	    return arraySlice;
	  }
	  if (step < 0) {
	    arraySlice.reverse();
	  }
	  step = Math.abs(step);
	  if (step == 1) {
	    return arraySlice;
	  } else {
	    return arraySlice.filter((e, i) => i % step == 0);
	  }
	}
	function offerDataForDownload(filename, data, type) {
	  const blob = new Blob([data], {
	    type
	  });
	  if (window.navigator.msSaveOrOpenBlob) {
	    window.navigator.msSaveBlob(blob, filename);
	  } else {
	    let elem = window.document.createElement('a');
	    elem.href = window.URL.createObjectURL(blob);
	    elem.download = filename;
	    document.body.appendChild(elem);
	    elem.click();
	    document.body.removeChild(elem);
	  }
	}

	/**
	 * Event Emitter.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class EventEmitter {
	  constructor() {
	    this._listeners = new Map();
	    this._onceUuids = new Map();
	  }
	  on(name, listener) {
	    if (typeof listener !== 'function') {
	      throw new TypeError('listener must be a function');
	    }
	    let uuid = makeUuid();
	    if (!this._listeners.has(name)) {
	      this._listeners.set(name, []);
	    }
	    this._listeners.get(name).push({
	      uuid,
	      listener
	    });
	    return uuid;
	  }
	  once(name, listener) {
	    let uuid = this.on(name, listener);
	    if (!this._onceUuids.has(name)) {
	      this._onceUuids.set(name, []);
	    }
	    this._onceUuids.get(name).push(uuid);
	    return uuid;
	  }
	  off(name, uuid) {
	    let relevantUuidListeners = this._listeners.get(name);
	    if (relevantUuidListeners && relevantUuidListeners.length) {
	      this._listeners.set(name, relevantUuidListeners.filter(uuidlistener => uuidlistener.uuid != uuid));
	      return true;
	    }
	    return false;
	  }
	  emit(name, data) {
	    let relevantUuidListeners = this._listeners.get(name);
	    if (relevantUuidListeners && relevantUuidListeners.length) {
	      let onceUuids = this._onceUuids.get(name);
	      let self = this;
	      relevantUuidListeners.forEach(({
	        uuid,
	        listener
	      }) => {
	        listener(data);
	        if (typeof onceUuids !== 'undefined' && onceUuids.includes(uuid)) {
	          self.off(name, uuid);
	        }
	      });
	      return true;
	    }
	    return false;
	  }
	}

	/**
	 * Core Object.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class PsychObject extends EventEmitter {
	  constructor(psychoJS, name) {
	    super();
	    this._psychoJS = psychoJS;
	    this._userAttributes = new Set();
	    if (typeof name === 'undefined') {
	      name = this.constructor.name;
	    }
	    this._addAttribute('name', name);
	  }
	  get psychoJS() {
	    return this._psychoJS;
	  }
	  set psychoJS(psychoJS) {
	    this._psychoJS = psychoJS;
	  }
	  toString() {
	    let representation = this.constructor.name + '( ';
	    let addComma = false;
	    for (const attribute of this._userAttributes) {
	      if (addComma) {
	        representation += ', ';
	      }
	      addComma = true;
	      let value = toString(this['_' + attribute]);
	      const l = value.length;
	      if (l > 50) {
	        if (value[l - 1] === ')') {
	          value = value.substring(0, 50) + '~)';
	        } else {
	          value = value.substring(0, 50) + '~';
	        }
	      }
	      representation += attribute + '=' + value;
	    }
	    representation += ' )';
	    return representation;
	  }
	  _setAttribute(attributeName, attributeValue, log = false, operation = undefined, stealth = false) {
	    const response = {
	      origin: 'PsychObject.setAttribute',
	      context: 'when setting the attribute of an object'
	    };
	    if (typeof attributeName == 'undefined') {
	      throw Object.assign(response, {
	        error: 'the attribute name cannot be' + ' undefined'
	      });
	    }
	    if (typeof attributeValue == 'undefined') {
	      this._psychoJS.logger.warn('setting the value of attribute: ' + attributeName + ' in PsychObject: ' + this._name + ' as: undefined');
	    }
	    if (typeof operation !== 'undefined' && this.hasOwnProperty('_' + attributeName)) {
	      let oldValue = this['_' + attributeName];
	      if (typeof attributeValue == 'number' || Array.isArray(attributeValue) && (attributeValue.length === 0 || typeof attributeValue[0] == 'number')) {
	        if (Array.isArray(attributeValue)) {
	          if (Array.isArray(oldValue)) {
	            if (attributeValue.length !== oldValue.length) {
	              throw Object.assign(response, {
	                error: 'old and new' + ' value should have' + ' the same size when they are both arrays'
	              });
	            }
	            switch (operation) {
	              case '':
	                break;
	              case '+':
	                attributeValue = attributeValue.map((v, i) => oldValue[i] + v);
	                break;
	              case '*':
	                attributeValue = attributeValue.map((v, i) => oldValue[i] * v);
	                break;
	              case '-':
	                attributeValue = attributeValue.map((v, i) => oldValue[i] - v);
	                break;
	              case '/':
	                attributeValue = attributeValue.map((v, i) => oldValue[i] / v);
	                break;
	              case '**':
	                attributeValue = attributeValue.map((v, i) => oldValue[i] ** v);
	                break;
	              case '%':
	                attributeValue = attributeValue.map((v, i) => oldValue[i] % v);
	                break;
	              default:
	                throw Object.assign(response, {
	                  error: 'unsupported' + ' operation: ' + operation + ' when setting: ' + attributeName + ' in: ' + this.name
	                });
	            }
	          } else
	            {
	              switch (operation) {
	                case '':
	                  break;
	                case '+':
	                  attributeValue = attributeValue.map(v => oldValue + v);
	                  break;
	                case '*':
	                  attributeValue = attributeValue.map(v => oldValue * v);
	                  break;
	                case '-':
	                  attributeValue = attributeValue.map(v => oldValue - v);
	                  break;
	                case '/':
	                  attributeValue = attributeValue.map(v => oldValue / v);
	                  break;
	                case '**':
	                  attributeValue = attributeValue.map(v => oldValue ** v);
	                  break;
	                case '%':
	                  attributeValue = attributeValue.map(v => oldValue % v);
	                  break;
	                default:
	                  throw Object.assign(response, {
	                    error: 'unsupported' + ' value: ' + JSON.stringify(attributeValue) + ' for' + ' operation: ' + operation + ' when setting: ' + attributeName + ' in: ' + this.name
	                  });
	              }
	            }
	        } else
	          {
	            if (Array.isArray(oldValue)) {
	              switch (operation) {
	                case '':
	                  attributeValue = oldValue.map(v => attributeValue);
	                  break;
	                case '+':
	                  attributeValue = oldValue.map(v => v + attributeValue);
	                  break;
	                case '*':
	                  attributeValue = oldValue.map(v => v * attributeValue);
	                  break;
	                case '-':
	                  attributeValue = oldValue.map(v => v - attributeValue);
	                  break;
	                case '/':
	                  attributeValue = oldValue.map(v => v / attributeValue);
	                  break;
	                case '**':
	                  attributeValue = oldValue.map(v => v ** attributeValue);
	                  break;
	                case '%':
	                  attributeValue = oldValue.map(v => v % attributeValue);
	                  break;
	                default:
	                  throw Object.assign(response, {
	                    error: 'unsupported' + ' operation: ' + operation + ' when setting: ' + attributeName + ' in: ' + this.name
	                  });
	              }
	            } else
	              {
	                switch (operation) {
	                  case '':
	                    break;
	                  case '+':
	                    attributeValue = oldValue + attributeValue;
	                    break;
	                  case '*':
	                    attributeValue = oldValue * attributeValue;
	                    break;
	                  case '-':
	                    attributeValue = oldValue - attributeValue;
	                    break;
	                  case '/':
	                    attributeValue = oldValue / attributeValue;
	                    break;
	                  case '**':
	                    attributeValue = oldValue ** attributeValue;
	                    break;
	                  case '%':
	                    attributeValue = oldValue % attributeValue;
	                    break;
	                  default:
	                    throw Object.assign(response, {
	                      error: 'unsupported' + ' value: ' + JSON.stringify(attributeValue) + ' for operation: ' + operation + ' when setting: ' + attributeName + ' in: ' + this.name
	                    });
	                }
	              }
	          }
	      } else {
	        throw Object.assign(response, {
	          error: 'operation: ' + operation + ' is invalid for old value: ' + JSON.stringify(oldValue) + ' and new value: ' + JSON.stringify(attributeValue)
	        });
	      }
	    }
	    if (!stealth && (log || this._autoLog) && typeof this.win !== 'undefined') {
	      const msg = this.name + ": " + attributeName + " = " + JSON.stringify(attributeValue);
	      this.win.logOnFlip({
	        msg
	      });
	    }
	    const previousAttributeValue = this['_' + attributeName];
	    this['_' + attributeName] = attributeValue;
	    return attributeValue !== previousAttributeValue;
	  }
	  _addAttributes(cls, ...args) {
	    const callLine = cls.toString().match(/this.*\._addAttributes\(.*\;/)[0];
	    const startIndex = callLine.indexOf('._addAttributes(') + 16;
	    const endIndex = callLine.indexOf(');');
	    const callArgs = callLine.substr(startIndex, endIndex - startIndex).split(',').map(s => s.trim());
	    let attributeMap = new Map();
	    for (let i = 1; i < callArgs.length; ++i) {
	      attributeMap.set(callArgs[i], args[i - 1]);
	    }
	    for (let [name, value] of attributeMap.entries()) {
	      this._addAttribute(name, value);
	    }
	  }
	  _addAttribute(name, value) {
	    const getPropertyName = 'get' + name[0].toUpperCase() + name.substr(1);
	    if (typeof this[getPropertyName] === 'undefined') {
	      this[getPropertyName] = () => this['_' + name];
	    }
	    const setPropertyName = 'set' + name[0].toUpperCase() + name.substr(1);
	    if (typeof this[setPropertyName] === 'undefined') {
	      this[setPropertyName] = (value, log = false) => {
	        this._setAttribute(name, value, log);
	      };
	    }
	    Object.defineProperty(this, name, {
	      configurable: true,
	      get() {
	        return this[getPropertyName]();
	      },
	      set(value) {
	        this[setPropertyName](value);
	      }
	    });
	    this[name] = value;
	    this._userAttributes.add(name);
	  }
	}

	/**
	 * Scheduler.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class Scheduler {
	  constructor(psychoJS) {
	    this._psychoJS = psychoJS;
	    this._taskList = [];
	    this._currentTask = undefined;
	    this._argsList = [];
	    this._currentArgs = undefined;
	    this._stopAtNextUpdate = false;
	    this._stopAtNextTask = false;
	    this._status = Scheduler.Status.STOPPED;
	  }
	  get status() {
	    return this._status;
	  }
	  add(task, ...args) {
	    this._taskList.push(task);
	    this._argsList.push(args);
	  }
	  addConditional(condition, thenScheduler, elseScheduler) {
	    const self = this;
	    let task = function () {
	      if (condition()) {
	        self.add(thenScheduler);
	      } else {
	        self.add(elseScheduler);
	      }
	      return Scheduler.Event.NEXT;
	    };
	    this.add(task);
	  }
	  start() {
	    const self = this;
	    let update = () => {
	      if (self._stopAtNextUpdate) {
	        self._status = Scheduler.Status.STOPPED;
	        return;
	      }
	      const state = self._runNextTasks();
	      if (state === Scheduler.Event.QUIT) {
	        self._status = Scheduler.Status.STOPPED;
	        return;
	      }
	      self._psychoJS.window.render();
	      requestAnimationFrame(update);
	    };
	    requestAnimationFrame(update);
	  }
	  stop() {
	    this._status = Scheduler.Status.STOPPED;
	    this._stopAtNextTask = true;
	    this._stopAtNextUpdate = true;
	  }
	  _runNextTasks() {
	    this._status = Scheduler.Status.RUNNING;
	    let state = Scheduler.Event.NEXT;
	    while (state === Scheduler.Event.NEXT) {
	      if (this._stopAtNextTask) {
	        return Scheduler.Event.QUIT;
	      }
	      if (typeof this._currentTask == 'undefined') {
	        if (this._taskList.length > 0) {
	          this._currentTask = this._taskList.shift();
	          this._currentArgs = this._argsList.shift();
	        }
	        else {
	            this._currentTask = undefined;
	            this._currentArgs = undefined;
	            return Scheduler.Event.QUIT;
	          }
	      }
	      if (this._currentTask instanceof Function) {
	        state = this._currentTask(...this._currentArgs);
	      }
	      else {
	          state = this._currentTask._runNextTasks();
	          if (state === Scheduler.Event.QUIT) {
	            if (!this._psychoJS.experiment.experimentEnded) {
	              state = Scheduler.Event.NEXT;
	            }
	          }
	        }
	      if (state !== Scheduler.Event.FLIP_REPEAT) {
	        this._currentTask = undefined;
	        this._currentArgs = undefined;
	      }
	    }
	    return state;
	  }
	}
	Scheduler.Event = {
	  NEXT: Symbol.for('NEXT'),
	  FLIP_REPEAT: Symbol.for('FLIP_REPEAT'),
	  FLIP_NEXT: Symbol.for('FLIP_NEXT'),
	  QUIT: Symbol.for('QUIT')
	};
	Scheduler.Status = {
	  RUNNING: Symbol.for('RUNNING'),
	  STOPPED: Symbol.for('STOPPED')
	};

	exports.Clock = Clock;
	exports.Color = Color;
	exports.ColorMixin = ColorMixin;
	exports.CountdownTimer = CountdownTimer;
	exports.EventEmitter = EventEmitter;
	exports.IsPointInsidePolygon = IsPointInsidePolygon;
	exports.MonotonicClock = MonotonicClock;
	exports.PsychObject = PsychObject;
	exports.Scheduler = Scheduler;
	exports.addInfoFromUrl = addInfoFromUrl;
	exports.detectBrowser = detectBrowser;
	exports.flattenArray = flattenArray;
	exports.getErrorStack = getErrorStack;
	exports.getPositionFromObject = getPositionFromObject;
	exports.getRequestError = getRequestError;
	exports.getUrlParameters = getUrlParameters;
	exports.isEmpty = isEmpty;
	exports.isInt = isInt;
	exports.makeUuid = makeUuid;
	exports.mix = mix;
	exports.offerDataForDownload = offerDataForDownload;
	exports.promiseToTupple = promiseToTupple;
	exports.selectFromArray = selectFromArray;
	exports.shuffle = shuffle;
	exports.sliceArray = sliceArray;
	exports.toNumerical = toNumerical;
	exports.toString = toString;
	exports.to_height = to_height;
	exports.to_norm = to_norm;
	exports.to_pixiPoint = to_pixiPoint;
	exports.to_px = to_px;
	exports.to_unit = to_unit;
	exports.to_win = to_win;

	return exports;

}({}));
var data = (function (exports, PsychObject_js, Clock_js, util) {
	'use strict';

	/**
	 * Experiment Handler
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class ExperimentHandler extends PsychObject_js.PsychObject {
	  get experimentEnded() {
	    return this._experimentEnded;
	  }
	  set experimentEnded(ended) {
	    this._experimentEnded = ended;
	  }
	  get _thisEntry() {
	    return this._currentTrialData;
	  }
	  get _entries() {
	    return this._trialsData;
	  }
	  constructor({
	    psychoJS,
	    name,
	    extraInfo
	  } = {}) {
	    super(psychoJS, name);
	    this._addAttributes(ExperimentHandler, extraInfo);
	    this._loops = [];
	    this._unfinishedLoops = [];
	    this._trialsKeys = [];
	    this._trialsData = [];
	    this._currentTrialData = {};
	    this._experimentEnded = false;
	  }
	  isEntryEmpty() {
	    return Object.keys(this._currentTrialData).length > 0;
	  }
	  isEntryEmtpy() {
	    return Object.keys(this._currentTrialData).length > 0;
	  }
	  addLoop(loop) {
	    this._loops.push(loop);
	    this._unfinishedLoops.push(loop);
	    loop.experimentHandler = this;
	  }
	  removeLoop(loop) {
	    const index = this._unfinishedLoops.indexOf(loop);
	    if (index !== -1) {
	      this._unfinishedLoops.splice(index, 1);
	    }
	  }
	  addData(key, value) {
	    if (this._trialsKeys.indexOf(key) === -1) {
	      this._trialsKeys.push(key);
	    }
	    if (Array.isArray(value)) {
	      value = JSON.stringify(value);
	    }
	    this._currentTrialData[key] = value;
	  }
	  nextEntry(snapshots) {
	    if (typeof snapshots !== 'undefined') {
	      if (!Array.isArray(snapshots)) {
	        snapshots = [snapshots];
	      }
	      for (const snapshot of snapshots) {
	        const attributes = ExperimentHandler._getLoopAttributes(snapshot);
	        for (let a in attributes) {
	          if (attributes.hasOwnProperty(a)) {
	            this._currentTrialData[a] = attributes[a];
	          }
	        }
	      }
	    }
	    else {
	        for (const loop of this._unfinishedLoops) {
	          const attributes = ExperimentHandler._getLoopAttributes(loop);
	          for (const a in attributes) {
	            if (attributes.hasOwnProperty(a)) {
	              this._currentTrialData[a] = attributes[a];
	            }
	          }
	        }
	      }
	    for (let a in this.extraInfo) {
	      if (this.extraInfo.hasOwnProperty(a)) {
	        this._currentTrialData[a] = this.extraInfo[a];
	      }
	    }
	    this._trialsData.push(this._currentTrialData);
	    this._currentTrialData = {};
	  }
	  async save({
	    attributes = [],
	    sync = false
	  } = {}) {
	    this._psychoJS.logger.info('[PsychoJS] Save experiment results.');
	    if (attributes.length === 0) {
	      attributes = this._trialsKeys.slice();
	      for (let l = 0; l < this._loops.length; l++) {
	        const loop = this._loops[l];
	        const loopAttributes = ExperimentHandler._getLoopAttributes(loop);
	        for (let a in loopAttributes) {
	          if (loopAttributes.hasOwnProperty(a)) {
	            attributes.push(a);
	          }
	        }
	      }
	      for (let a in this.extraInfo) {
	        if (this.extraInfo.hasOwnProperty(a)) {
	          attributes.push(a);
	        }
	      }
	    }
	    const info = this.extraInfo;
	    const __experimentName = typeof info.expName !== 'undefined' ? info.expName : this.psychoJS.config.experiment.name;
	    const __participant = typeof info.participant === 'string' && info.participant.length > 0 ? info.participant : 'PARTICIPANT';
	    const __session = typeof info.session === 'string' && info.session.length > 0 ? info.session : 'SESSION';
	    const __datetime = typeof info.date !== 'undefined' ? info.date : Clock_js.MonotonicClock.getDateStr();
	    const gitlabConfig = this._psychoJS.config.gitlab;
	    const __projectId = typeof gitlabConfig !== 'undefined' && typeof gitlabConfig.projectId !== 'undefined' ? gitlabConfig.projectId : undefined;
	    if (this._psychoJS.config.experiment.saveFormat === ExperimentHandler.SaveFormat.CSV) {
	      const worksheet = XLSX.utils.json_to_sheet(this._trialsData);
	      const csv = XLSX.utils.sheet_to_csv(worksheet);
	      const key = __participant + '_' + __experimentName + '_' + __datetime + '.csv';
	      if (this._psychoJS.getEnvironment() === ExperimentHandler.Environment.SERVER && this._psychoJS.config.experiment.status === 'RUNNING' && !this._psychoJS._serverMsg.has('__pilotToken')) {
	        return (
	          this._psychoJS.serverManager.uploadData(key, csv, sync)
	        );
	      } else {
	        util.offerDataForDownload(key, csv, 'text/csv');
	      }
	    }
	    else if (this._psychoJS.config.experiment.saveFormat === ExperimentHandler.SaveFormat.DATABASE) {
	        let documents = [];
	        for (let r = 0; r < this._trialsData.length; r++) {
	          let doc = {
	            __projectId,
	            __experimentName,
	            __participant,
	            __session,
	            __datetime
	          };
	          for (let h = 0; h < attributes.length; h++) {
	            doc[attributes[h]] = this._trialsData[r][attributes[h]];
	          }
	          documents.push(doc);
	        }
	        if (this._psychoJS.getEnvironment() === ExperimentHandler.Environment.SERVER && this._psychoJS.config.experiment.status === 'RUNNING' && !this._psychoJS._serverMsg.has('__pilotToken')) {
	          const key = 'results';
	          return (
	            this._psychoJS.serverManager.uploadData(key, JSON.stringify(documents), sync)
	          );
	        } else {
	          util.offerDataForDownload('results.json', JSON.stringify(documents), 'application/json');
	        }
	      }
	  }
	  static _getLoopAttributes(loop) {
	    const properties = ['thisRepN', 'thisTrialN', 'thisN', 'thisIndex', 'stepSizeCurrent', 'ran', 'order'];
	    let attributes = {};
	    const loopName = loop.name;
	    for (const loopProperty in loop) {
	      if (properties.includes(loopProperty)) {
	        const key = loopProperty === 'stepSizeCurrent' ? loopName + '.stepSize' : loopName + '.' + loopProperty;
	        attributes[key] = loop[loopProperty];
	      }
	    }
	    if (typeof loop.getCurrentTrial === 'function') {
	      const currentTrial = loop.getCurrentTrial();
	      for (const trialProperty in currentTrial) {
	        attributes[trialProperty] = currentTrial[trialProperty];
	      }
	    }
	    return attributes;
	  }
	}
	ExperimentHandler.SaveFormat = {
	  CSV: Symbol.for('CSV'),
	  DATABASE: Symbol.for('DATABASE')
	};
	ExperimentHandler.Environment = {
	  SERVER: Symbol.for('SERVER'),
	  LOCAL: Symbol.for('LOCAL')
	};

	/**
	 * Trial Handler
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class TrialHandler extends PsychObject_js.PsychObject {
	  get experimentHandler() {
	    return this._experimentHandler;
	  }
	  set experimentHandler(exp) {
	    this._experimentHandler = exp;
	  }
	  constructor({
	    psychoJS,
	    trialList = [undefined],
	    nReps,
	    method = TrialHandler.Method.RANDOM,
	    extraInfo = [],
	    seed,
	    name,
	    autoLog = true
	  } = {}) {
	    super(psychoJS);
	    this._addAttributes(TrialHandler, trialList, nReps, method, extraInfo, seed, name, autoLog);
	    this._prepareTrialList(trialList);
	    this.nStim = this.trialList.length;
	    this.nTotal = this.nReps * this.nStim;
	    this.nRemaining = this.nTotal;
	    this.thisRepN = 0;
	    this.thisTrialN = -1;
	    this.thisN = -1;
	    this.thisIndex = 0;
	    this.ran = 0;
	    this.order = -1;
	    this._prepareSequence();
	    this._experimentHandler = null;
	    this.thisTrial = null;
	    this.finished = false;
	  }
	  [Symbol.iterator]() {
	    return {
	      next: () => {
	        this.thisTrialN++;
	        this.thisN++;
	        this.nRemaining--;
	        if (this.nRemaining === 0) {
	          this.finished = true;
	        }
	        if (this.thisTrialN === this.nStim) {
	          this.thisTrialN = 0;
	          this.thisRepN++;
	        }
	        if (this.thisRepN >= this.nReps) {
	          this.thisTrial = null;
	          return {
	            done: true
	          };
	        }
	        this.thisIndex = this._trialSequence[this.thisRepN][this.thisTrialN];
	        this.thisTrial = this.trialList[this.thisIndex];
	        this.ran = 1;
	        this.order = this.thisN;
	        return {
	          value: this.thisTrial,
	          done: false
	        };
	      }
	    };
	  }
	  forEach(callback) {
	    const trialIterator = this[Symbol.iterator]();
	    while (true) {
	      const result = trialIterator.next();
	      if (result.done) {
	        break;
	      }
	      callback(result.value);
	    }
	  }
	  getSnapshot() {
	    const currentIndex = this.thisIndex;
	    const snapshot = {
	      name: this.name,
	      nStim: this.nStim,
	      nTotal: this.nTotal,
	      nRemaining: this.nRemaining,
	      thisRepN: this.thisRepN,
	      thisTrialN: this.thisTrialN,
	      thisN: this.thisN,
	      thisIndex: this.thisIndex,
	      ran: this.ran,
	      finished: this.finished,
	      getCurrentTrial: () => this.getTrial(currentIndex),
	      getTrial: (index = 0) => this.getTrial(index)
	    };
	    return snapshot;
	  }
	  getTrialIndex() {
	    return this.thisIndex;
	  }
	  setTrialIndex(index) {
	    this.thisIndex = index;
	  }
	  getAttributes() {
	    if (!Array.isArray(this.trialList) || this.nStim === 0) {
	      return [];
	    }
	    const firstTrial = this.trialList[0];
	    if (!firstTrial) {
	      return [];
	    }
	    return Object.keys(this.trialList[0]);
	  }
	  getCurrentTrial() {
	    return this.trialList[this.thisIndex];
	  }
	  getTrial(index = 0) {
	    if (index < 0 || index > this.nTotal) {
	      return undefined;
	    }
	    return this.trialList[index];
	  }
	  getFutureTrial(n = 1) {
	    if (this.thisIndex + n < 0 || n > this.nRemaining) {
	      return undefined;
	    }
	    return this.trialList[this.thisIndex + n];
	  }
	  getEarlierTrial(n = -1) {
	    return getFutureTrial(-abs(n));
	  }
	  addData(key, value) {
	    if (this._experimentHandler) {
	      this._experimentHandler.addData(key, value);
	    }
	  }
	  static importConditions(serverManager, resourceName, selection = null) {
	    try {
	      let resourceExtension = resourceName.split('.').pop();
	      if (['csv', 'odp', 'xls', 'xlsx'].indexOf(resourceExtension) > -1) {
	        const resourceValue = serverManager.getResource(resourceName);
	        const workbook = XLSX.read(new Uint8Array(resourceValue), {
	          type: "array"
	        });
	        if (workbook.SheetNames.length === 0) {
	          throw 'workbook should contain at least one worksheet';
	        }
	        const sheetName = workbook.SheetNames[0];
	        const worksheet = workbook.Sheets[sheetName];
	        const sheet = XLSX.utils.sheet_to_json(worksheet, {
	          header: 1,
	          blankrows: false
	        });
	        const fields = sheet.shift();
	        const selectedRows = selection === null ? sheet : util.selectFromArray(sheet, selection);
	        let trialList = new Array(selectedRows.length - 1);
	        for (let r = 0; r < selectedRows.length; ++r) {
	          let row = selectedRows[r];
	          let trial = {};
	          for (let l = 0; l < fields.length; ++l) {
	            let value = row[l];
	            if (typeof value === 'string' && !isNaN(value)) {
	              value = Number.parseFloat(value);
	            }
	            trial[fields[l]] = value;
	          }
	          trialList[r] = trial;
	        }
	        return trialList;
	      } else {
	        throw 'extension: ' + resourceExtension + ' currently not supported.';
	      }
	    } catch (error) {
	      throw {
	        origin: 'TrialHandler.importConditions',
	        context: `when importing condition: ${resourceName}`,
	        error
	      };
	    }
	  }
	  _prepareTrialList(trialList) {
	    const response = {
	      origin: 'TrialHandler._prepareTrialList',
	      context: 'when preparing the trial list'
	    };
	    if (typeof trialList === 'undefined') {
	      this.trialList = [undefined];
	    }
	    else if (Array.isArray(trialList)) {
	        if (trialList.length === 0) {
	          this.trialList = [undefined];
	        }
	      }
	      else if (typeof trialList === 'string') {
	          this.trialList = TrialHandler.importConditions(this.psychoJS.serverManager, trialList);
	        }
	        else {
	            throw Object.assign(response, {
	              error: 'unable to prepare trial list:' + ' unknown type: ' + typeof trialList
	            });
	          }
	  }
	  _prepareSequence() {
	    const response = {
	      origin: 'TrialHandler._prepareSequence',
	      context: 'when preparing a sequence of trials'
	    };
	    const indices = Array.from(this.trialList.keys());
	    if (typeof this.seed !== 'undefined') {
	      Math.seedrandom(this.seed);
	    } else {
	      Math.seedrandom();
	    }
	    if (this.method === TrialHandler.Method.SEQUENTIAL) {
	      this._trialSequence = Array(this.nReps).fill(indices);
	    } else if (this.method === TrialHandler.Method.RANDOM) {
	      this._trialSequence = [];
	      for (let i = 0; i < this.nReps; ++i) {
	        this._trialSequence.push(util.shuffle(indices.slice()));
	      }
	    } else if (this.method === TrialHandler.Method.FULL_RANDOM) {
	      let flatSequence = [];
	      for (let i = 0; i < this.nReps; ++i) {
	        flatSequence.push.apply(flatSequence, indices);
	      }
	      util.shuffle(flatSequence);
	      this._trialSequence = [];
	      for (let i = 0; i < this.nReps; i++) {
	        this._trialSequence.push(flatSequence.slice(i * this.nStim, (i + 1) * this.nStim));
	      }
	    } else {
	      throw Object.assign(response, {
	        error: 'unknown method'
	      });
	    }
	    return this._trialSequence;
	  }
	}
	TrialHandler.Method = {
	  SEQUENTIAL: Symbol.for('SEQUENTIAL'),
	  RANDOM: Symbol.for('RANDOM'),
	  FULL_RANDOM: Symbol.for('FULL_RANDOM')
	};

	exports.ExperimentHandler = ExperimentHandler;
	exports.TrialHandler = TrialHandler;

	return exports;

}({}, util, util, util));
var core = (function (exports, Clock_js, Scheduler_js, PsychObject_js, util$1, ExperimentHandler_js, Color_js) {
	'use strict';

	/**
	 * Manager responsible for the communication between the experiment running in the participant's browser and the remote PsychoJS manager running on the remote https://pavlovia.org server.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class ServerManager extends PsychObject_js.PsychObject {
	  constructor({
	    psychoJS,
	    autoLog = false
	  } = {}) {
	    super(psychoJS);
	    this._session = {};
	    this._resources = new Map();
	    this._nbResources = -1;
	    this._addAttributes(ServerManager, autoLog);
	    this._addAttribute('status', ServerManager.Status.READY);
	  }
	  getConfiguration(configURL) {
	    const response = {
	      origin: 'ServerManager.getConfiguration',
	      context: 'when reading the configuration file: ' + configURL
	    };
	    this._psychoJS.logger.debug('reading the configuration file: ' + configURL);
	    const self = this;
	    return new Promise((resolve, reject) => {
	      $.get(configURL, 'json').done((config, textStatus) => {
	        resolve(Object.assign(response, {
	          config
	        }));
	      }).fail((jqXHR, textStatus, errorThrown) => {
	        self.setStatus(ServerManager.Status.ERROR);
	        const errorMsg = util$1.getRequestError(jqXHR, textStatus, errorThrown);
	        console.error('error:', errorMsg);
	        reject(Object.assign(response, {
	          error: errorMsg
	        }));
	      });
	    });
	  }
	  openSession() {
	    const response = {
	      origin: 'ServerManager.openSession',
	      context: 'when opening a session for experiment: ' + this._psychoJS.config.experiment.fullpath
	    };
	    this._psychoJS.logger.debug('opening a session for experiment: ' + this._psychoJS.config.experiment.fullpath);
	    this.setStatus(ServerManager.Status.BUSY);
	    let data = {};
	    if (this._psychoJS._serverMsg.has('__pilotToken')) {
	      data.pilotToken = this._psychoJS._serverMsg.get('__pilotToken');
	    }
	    const self = this;
	    return new Promise((resolve, reject) => {
	      const url = this._psychoJS.config.pavlovia.URL + '/api/v2/experiments/' + encodeURIComponent(self._psychoJS.config.experiment.fullpath) + '/sessions';
	      $.post(url, data, null, 'json').done((data, textStatus) => {
	        if (!('token' in data)) {
	          self.setStatus(ServerManager.Status.ERROR);
	          reject(Object.assign(response, {
	            error: 'unexpected answer from server: no token'
	          }));
	        }
	        if (!('experiment' in data)) {
	          self.setStatus(ServerManager.Status.ERROR);
	          reject(Object.assign(response, {
	            error: 'unexpected answer from server: no experiment'
	          }));
	        }
	        self._psychoJS.config.session = {
	          token: data.token,
	          status: 'OPEN'
	        };
	        self._psychoJS.config.experiment.status = data.experiment.status2;
	        self._psychoJS.config.experiment.saveFormat = Symbol.for(data.experiment.saveFormat);
	        self._psychoJS.config.experiment.saveIncompleteResults = data.experiment.saveIncompleteResults;
	        self._psychoJS.config.experiment.license = data.experiment.license;
	        self._psychoJS.config.experiment.runMode = data.experiment.runMode;
	        self.setStatus(ServerManager.Status.READY);
	        resolve(Object.assign(response, {
	          token: data.token,
	          status: data.status
	        }));
	      }).fail((jqXHR, textStatus, errorThrown) => {
	        self.setStatus(ServerManager.Status.ERROR);
	        const errorMsg = util$1.getRequestError(jqXHR, textStatus, errorThrown);
	        console.error('error:', errorMsg);
	        reject(Object.assign(response, {
	          error: errorMsg
	        }));
	      });
	    });
	  }
	  async closeSession(isCompleted = false, sync = false) {
	    const response = {
	      origin: 'ServerManager.closeSession',
	      context: 'when closing the session for experiment: ' + this._psychoJS.config.experiment.fullpath
	    };
	    this._psychoJS.logger.debug('closing the session for experiment: ' + this._psychoJS.config.experiment.name);
	    this.setStatus(ServerManager.Status.BUSY);
	    const url = this._psychoJS.config.pavlovia.URL + '/api/v2/experiments/' + encodeURIComponent(this._psychoJS.config.experiment.fullpath) + '/sessions/' + this._psychoJS.config.session.token;
	    if (sync) {
	      const formData = new FormData();
	      formData.append('isCompleted', isCompleted);
	      navigator.sendBeacon(url + '/delete', formData);
	      this._psychoJS.config.session.status = 'CLOSED';
	    }
	    else {
	        const self = this;
	        return new Promise((resolve, reject) => {
	          $.ajax({
	            url,
	            type: 'delete',
	            data: {
	              isCompleted
	            },
	            dataType: 'json'
	          }).done((data, textStatus) => {
	            self.setStatus(ServerManager.Status.READY);
	            self._psychoJS.config.session.status = 'CLOSED';
	            resolve(Object.assign(response, {
	              data
	            }));
	          }).fail((jqXHR, textStatus, errorThrown) => {
	            self.setStatus(ServerManager.Status.ERROR);
	            const errorMsg = util$1.getRequestError(jqXHR, textStatus, errorThrown);
	            console.error('error:', errorMsg);
	            reject(Object.assign(response, {
	              error: errorMsg
	            }));
	          });
	        });
	      }
	  }
	  getResource(name) {
	    const response = {
	      origin: 'ServerManager.getResource',
	      context: 'when getting the value of resource: ' + name
	    };
	    const path_data = this._resources.get(name);
	    if (typeof path_data === 'undefined')
	      {
	        throw Object.assign(response, {
	          error: 'unknown resource'
	        });
	      }
	    return path_data.data;
	  }
	  setStatus(status) {
	    const response = {
	      origin: 'ServerManager.setStatus',
	      context: 'when changing the status of the server manager to: ' + util$1.toString(status)
	    };
	    const statusKey = typeof status === 'symbol' ? Symbol.keyFor(status) : null;
	    if (!statusKey)
	      {
	        throw Object.assign(response, {
	          error: 'status must be a symbol'
	        });
	      }
	    if (!ServerManager.Status.hasOwnProperty(statusKey))
	      {
	        throw Object.assign(response, {
	          error: 'unknown status'
	        });
	      }
	    this._status = status;
	    this.emit(ServerManager.Event.STATUS, this._status);
	    return this._status;
	  }
	  resetStatus() {
	    return this.setStatus(ServerManager.Status.READY);
	  }
	  downloadResources(resources = []) {
	    const response = {
	      origin: 'ServerManager.downloadResources',
	      context: 'when downloading the resources for experiment: ' + this._psychoJS.config.experiment.name
	    };
	    this._psychoJS.logger.debug('downloading resources for experiment: ' + this._psychoJS.config.experiment.name);
	    const self = this;
	    const newResources = new Map();
	    let download = async () => {
	      try {
	        if (self._psychoJS.config.environment === ExperimentHandler_js.ExperimentHandler.Environment.SERVER) {
	          if (resources.length === 0) {
	            const serverResponse = await self._listResources();
	            for (const name of serverResponse.resources) {
	              self._resources.set(name, {
	                path: serverResponse.resourceDirectory + '/' + name
	              });
	            }
	          } else {
	            for (const {
	              name,
	              path
	            } of resources) {
	              self._resources.set(name, {
	                path
	              });
	              newResources.set(name, {
	                path
	              });
	            }
	          }
	        } else {
	          for (const {
	            name,
	            path
	          } of resources) {
	            self._resources.set(name, {
	              path
	            });
	            newResources.set(name, {
	              path
	            });
	          }
	        }
	        self._nbResources = self._resources.size;
	        for (const name of self._resources.keys()) {
	          this._psychoJS.logger.debug('resource:', name, self._resources.get(name).path);
	        }
	        self.emit(ServerManager.Event.RESOURCE, {
	          message: ServerManager.Event.RESOURCES_REGISTERED,
	          count: self._nbResources
	        });
	        await self._downloadRegisteredResources(newResources);
	      } catch (error) {
	        console.log('error', error);
	        throw Object.assign(response, {
	          error
	        });
	      }
	    };
	    download();
	  }
	  uploadData(key, value, sync = false) {
	    const response = {
	      origin: 'ServerManager.uploadData',
	      context: 'when uploading participant\'s results for experiment: ' + this._psychoJS.config.experiment.fullpath
	    };
	    this._psychoJS.logger.debug('uploading data for experiment: ' + this._psychoJS.config.experiment.fullpath);
	    this.setStatus(ServerManager.Status.BUSY);
	    const url = this._psychoJS.config.pavlovia.URL + '/api/v2/experiments/' + encodeURIComponent(this._psychoJS.config.experiment.fullpath) + '/sessions/' + this._psychoJS.config.session.token + '/results';
	    if (sync) {
	      const formData = new FormData();
	      formData.append('key', key);
	      formData.append('value', value);
	      navigator.sendBeacon(url, formData);
	    }
	    else {
	        const self = this;
	        return new Promise((resolve, reject) => {
	          const data = {
	            key,
	            value
	          };
	          $.post(url, data, null, 'json').done((serverData, textStatus) => {
	            self.setStatus(ServerManager.Status.READY);
	            resolve(Object.assign(response, {
	              serverData
	            }));
	          }).fail((jqXHR, textStatus, errorThrown) => {
	            self.setStatus(ServerManager.Status.ERROR);
	            const errorMsg = util$1.getRequestError(jqXHR, textStatus, errorThrown);
	            console.error('error:', errorMsg);
	            reject(Object.assign(response, {
	              error: errorMsg
	            }));
	          });
	        });
	      }
	  }
	  uploadLog(logs, compressed = false) {
	    const response = {
	      origin: 'ServerManager.uploadLog',
	      context: 'when uploading participant\'s log for experiment: ' + this._psychoJS.config.experiment.fullpath
	    };
	    this._psychoJS.logger.debug('uploading server log for experiment: ' + this._psychoJS.config.experiment.fullpath);
	    this.setStatus(ServerManager.Status.BUSY);
	    const info = this.psychoJS.experiment.extraInfo;
	    const participant = typeof info.participant === 'string' && info.participant.length > 0 ? info.participant : 'PARTICIPANT';
	    const experimentName = typeof info.expName !== 'undefined' ? info.expName : this.psychoJS.config.experiment.name;
	    const datetime = typeof info.date !== 'undefined' ? info.date : Clock_js.MonotonicClock.getDateStr();
	    const filename = participant + '_' + experimentName + '_' + datetime + '.log';
	    const data = {
	      filename,
	      logs,
	      compressed
	    };
	    const self = this;
	    return new Promise((resolve, reject) => {
	      const url = self._psychoJS.config.pavlovia.URL + '/api/v2/experiments/' + encodeURIComponent(self._psychoJS.config.experiment.fullpath) + '/sessions/' + self._psychoJS.config.session.token + '/logs';
	      $.post(url, data, null, 'json').done((serverData, textStatus) => {
	        self.setStatus(ServerManager.Status.READY);
	        resolve(Object.assign(response, {
	          serverData
	        }));
	      }).fail((jqXHR, textStatus, errorThrown) => {
	        self.setStatus(ServerManager.Status.ERROR);
	        const errorMsg = util$1.getRequestError(jqXHR, textStatus, errorThrown);
	        console.error('error:', errorMsg);
	        reject(Object.assign(response, {
	          error: errorMsg
	        }));
	      });
	    });
	  }
	  _listResources() {
	    const response = {
	      origin: 'ServerManager._listResourcesSession',
	      context: 'when listing the resources for experiment: ' + this._psychoJS.config.experiment.fullpath
	    };
	    this._psychoJS.logger.debug('listing the resources for experiment: ' + this._psychoJS.config.experiment.fullpath);
	    this.setStatus(ServerManager.Status.BUSY);
	    const data = {
	      'token': this._psychoJS.config.session.token
	    };
	    const self = this;
	    return new Promise((resolve, reject) => {
	      const url = this._psychoJS.config.pavlovia.URL + '/api/v2/experiments/' + encodeURIComponent(this._psychoJS.config.experiment.fullpath) + '/resources';
	      $.get(url, data, null, 'json').done((data, textStatus) => {
	        if (!('resources' in data)) {
	          self.setStatus(ServerManager.Status.ERROR);
	          reject(Object.assign(response, {
	            error: 'unexpected answer from server: no resources'
	          }));
	        }
	        if (!('resourceDirectory' in data)) {
	          self.setStatus(ServerManager.Status.ERROR);
	          reject(Object.assign(response, {
	            error: 'unexpected answer from server: no resourceDirectory'
	          }));
	        }
	        self.setStatus(ServerManager.Status.READY);
	        resolve(Object.assign(response, {
	          resources: data.resources,
	          resourceDirectory: data.resourceDirectory
	        }));
	      }).fail((jqXHR, textStatus, errorThrown) => {
	        self.setStatus(ServerManager.Status.ERROR);
	        const errorMsg = util$1.getRequestError(jqXHR, textStatus, errorThrown);
	        console.error('error:', errorMsg);
	        reject(Object.assign(response, {
	          error: errorMsg
	        }));
	      });
	    });
	  }
	  _downloadRegisteredResources(resources = new Map()) {
	    const response = {
	      origin: 'ServerManager._downloadResources',
	      context: 'when downloading the resources for experiment: ' + this._psychoJS.config.experiment.name
	    };
	    this._psychoJS.logger.debug('downloading the registered resources for experiment: ' + this._psychoJS.config.experiment.name);
	    this.setStatus(ServerManager.Status.BUSY);
	    this._nbLoadedResources = 0;
	    this._resourceQueue = new createjs.LoadQueue(true);
	    const self = this;
	    const filesToDownload = resources.size ? resources : this._resources;
	    this._resourceQueue.addEventListener("filestart", event => {
	      self.emit(ServerManager.Event.RESOURCE, {
	        message: ServerManager.Event.DOWNLOADING_RESOURCE,
	        resource: event.item.id
	      });
	    });
	    this._resourceQueue.addEventListener("fileload", event => {
	      ++self._nbLoadedResources;
	      let path_data = self._resources.get(event.item.id);
	      path_data.data = event.result;
	      self.emit(ServerManager.Event.RESOURCE, {
	        message: ServerManager.Event.RESOURCE_DOWNLOADED,
	        resource: event.item.id
	      });
	    });
	    this._resourceQueue.addEventListener("complete", event => {
	      self._resourceQueue.close();
	      if (self._nbLoadedResources === filesToDownload.size) {
	        self.setStatus(ServerManager.Status.READY);
	        self.emit(ServerManager.Event.RESOURCE, {
	          message: ServerManager.Event.DOWNLOAD_COMPLETED
	        });
	      }
	    });
	    this._resourceQueue.addEventListener("error", event => {
	      self.setStatus(ServerManager.Status.ERROR);
	      const resourceId = typeof event.data !== 'undefined' ? event.data.id : 'UNKNOWN RESOURCE';
	      throw Object.assign(response, {
	        error: 'unable to download resource: ' + resourceId + ' (' + event.title + ')'
	      });
	    });
	    let manifest = [];
	    let soundResources = [];
	    for (const [name, path_data] of filesToDownload) {
	      const nameParts = name.toLowerCase().split('.');
	      const extension = nameParts.length > 1 ? nameParts.pop() : undefined;
	      if (typeof extension === 'undefined') {
	        this.psychoJS.logger.warn(`"${name}" does not appear to have an extension, which may negatively impact its loading. We highly recommend you add an extension.`);
	      }
	      if (['csv', 'odp', 'xls', 'xlsx'].indexOf(extension) > -1) {
	        manifest.push({
	          id: name,
	          src: path_data.path,
	          type: createjs.Types.BINARY
	        });
	      }
	      else if (['mp3', 'mpeg', 'opus', 'ogg', 'oga', 'wav', 'aac', 'caf', 'm4a', 'weba', 'dolby', 'flac'].indexOf(extension) > -1) {
	          soundResources.push(name);
	          if (extension === 'wav') {
	            this.psychoJS.logger.warn(`wav files are not supported by all browsers. We recommend you convert "${name}" to another format, e.g. mp3`);
	          }
	        }
	        else {
	            manifest.push({
	              id: name,
	              src: path_data.path
	            });
	          }
	    }
	    if (manifest.length > 0) {
	      this._resourceQueue.loadManifest(manifest);
	    } else {
	      if (this._nbLoadedResources === filesToDownload.size) {
	        this.setStatus(ServerManager.Status.READY);
	        this.emit(ServerManager.Event.RESOURCE, {
	          message: ServerManager.Event.DOWNLOAD_COMPLETED
	        });
	      }
	    }
	    for (const name of soundResources) {
	      self.emit(ServerManager.Event.RESOURCE, {
	        message: ServerManager.Event.DOWNLOADING_RESOURCE,
	        resource: name
	      });
	      const path_data = self._resources.get(name);
	      const howl = new Howl({
	        src: path_data.path,
	        preload: false,
	        autoplay: false
	      });
	      howl.on('load', event => {
	        ++self._nbLoadedResources;
	        path_data.data = howl;
	        self.emit(ServerManager.Event.RESOURCE, {
	          message: ServerManager.Event.RESOURCE_DOWNLOADED,
	          resource: name
	        });
	        if (self._nbLoadedResources === filesToDownload.size) {
	          self.setStatus(ServerManager.Status.READY);
	          self.emit(ServerManager.Event.RESOURCE, {
	            message: ServerManager.Event.DOWNLOAD_COMPLETED
	          });
	        }
	      });
	      howl.on('loaderror', (id, error) => {
	        throw Object.assign(response, {
	          error: 'unable to download resource: ' + name + ' (' + util$1.toString(error) + ')'
	        });
	      });
	      howl.load();
	    }
	  }
	}
	ServerManager.Event = {
	  RESOURCE: Symbol.for('RESOURCE'),
	  RESOURCES_REGISTERED: Symbol.for('RESOURCES_REGISTERED'),
	  DOWNLOADING_RESOURCE: Symbol.for('DOWNLOADING_RESOURCE'),
	  RESOURCE_DOWNLOADED: Symbol.for('RESOURCE_DOWNLOADED'),
	  DOWNLOAD_COMPLETED: Symbol.for('DOWNLOAD_COMPLETED'),
	  STATUS: Symbol.for('STATUS')
	};
	ServerManager.Status = {
	  READY: Symbol.for('READY'),
	  BUSY: Symbol.for('BUSY'),
	  ERROR: Symbol.for('ERROR')
	};

	/**
	 * Logger
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class Logger {
	  constructor(psychoJS, threshold) {
	    this._psychoJS = psychoJS;
	    this.consoleLogger = log4javascript.getLogger('psychojs');
	    const appender = new log4javascript.BrowserConsoleAppender();
	    appender.setLayout(this._customConsoleLayout());
	    appender.setThreshold(threshold);
	    this.consoleLogger.addAppender(appender);
	    this.consoleLogger.setLevel(threshold);
	    this._serverLogs = [];
	  }
	  exp(msg, time, obj) {
	    this.log(msg, Logger.ServerLevel.EXP, time, obj);
	  }
	  data(msg, time, obj) {
	    this.log(msg, Logger.ServerLevel.DATA, time, obj);
	  }
	  log(msg, level, time, obj) {
	    if (typeof time === 'undefined') {
	      time = Clock_js.MonotonicClock.getReferenceTime();
	    }
	    this._serverLogs.push({
	      msg,
	      level,
	      time,
	      obj: util$1.toString(obj)
	    });
	  }
	  async flush() {
	    const response = {
	      origin: 'Logger.flush',
	      context: 'when flushing participant\'s logs for experiment: ' + this._psychoJS.config.experiment.fullpath
	    };
	    this._psychoJS.logger.info('[PsychoJS] Flush server logs.');
	    let formattedLogs = '';
	    for (const log of this._serverLogs) {
	      let formattedLog = util$1.toString(log.time) + '\t' + Symbol.keyFor(log.level) + '\t' + log.msg;
	      if (log.obj !== 'undefined') {
	        formattedLog += '\t' + log.obj;
	      }
	      formattedLog += '\n';
	      formattedLogs += formattedLog;
	    }
	    if (this._psychoJS.getEnvironment() === ExperimentHandler_js.ExperimentHandler.Environment.SERVER && this._psychoJS.config.experiment.status === 'RUNNING' && !this._psychoJS._serverMsg.has('__pilotToken')) {
	      if (typeof pako !== 'undefined') {
	        try {
	          const utf16DeflatedLogs = pako.deflate(formattedLogs, {
	            to: 'string'
	          });
	          const base64DeflatedLogs = btoa(utf16DeflatedLogs);
	          return await this._psychoJS.serverManager.uploadLog(base64DeflatedLogs, true);
	        } catch (error) {
	          console.error('log compression error:', error);
	          throw Object.assign(response, {
	            error: error
	          });
	        }
	      } else
	        {
	          return await this._psychoJS.serverManager.uploadLog(formattedLogs, false);
	        }
	    } else {
	      this._psychoJS.logger.debug('\n' + formattedLogs);
	    }
	  }
	  _customConsoleLayout() {
	    const detectedBrowser = this._psychoJS.browser;
	    const customLayout = new log4javascript.PatternLayout("%p %f{1} | %m");
	    customLayout.setCustomField('location', function (layout, loggingReference) {
	      try {
	        throw Error('fake exception');
	      } catch (e) {
	        const stackEntries = e.stack.replace(/^.*?\n/, '').replace(/(?:\n@:0)?\s+$/m, '').replace(/^\(/gm, '{anon}(').split("\n");
	        let relevantEntry;
	        if (detectedBrowser === 'Firefox') {
	          for (let entry of stackEntries) {
	            if (entry.indexOf('log4javascript.min.js') <= 0) {
	              relevantEntry = entry;
	              break;
	            }
	          }
	          const buf = relevantEntry.split(':');
	          const line = buf[buf.length - 2];
	          const file = buf[buf.length - 3].split('/').pop();
	          const method = relevantEntry.split('@')[0];
	          return method + ' ' + file + ' ' + line;
	        } else if (detectedBrowser === 'Safari') {
	          return 'unknown';
	        } else if (detectedBrowser === 'Chrome') {
	          relevantEntry = stackEntries.pop();
	          let buf = relevantEntry.split(' ');
	          let fileLine = buf.pop();
	          const method = buf.pop();
	          buf = fileLine.split(':');
	          buf.pop();
	          const line = buf.pop();
	          const file = buf.pop().split('/').pop();
	          return method + ' ' + file + ' ' + line;
	        } else {
	          return 'unknown';
	        }
	      }
	    });
	    return customLayout;
	  }
	}
	Logger.ServerLevel = {
	  CRITICAL: Symbol.for('CRITICAL'),
	  ERROR: Symbol.for('ERROR'),
	  WARNING: Symbol.for('WARNING'),
	  DATA: Symbol.for('DATA'),
	  EXP: Symbol.for('EXP'),
	  INFO: Symbol.for('INFO'),
	  DEBUG: Symbol.for('DEBUG'),
	  NOTSET: Symbol.for('NOTSET')
	};

	/**
	 * Window responsible for displaying the experiment stimuli
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class Window extends PsychObject_js.PsychObject {
	  get monitorFramePeriod() {
	    return this._monitorFramePeriod;
	  }
	  constructor({
	    psychoJS,
	    name,
	    fullscr = false,
	    color = new Color_js.Color('black'),
	    units = 'pix',
	    waitBlanking = false,
	    autoLog = true
	  } = {}) {
	    super(psychoJS, name);
	    this._msgToBeLogged = [];
	    this._drawList = [];
	    this._addAttributes(Window, fullscr, color, units, waitBlanking, autoLog);
	    this._addAttribute('size', []);
	    this._setupPixi();
	    this._monitorFramePeriod = 1.0 / this.getActualFrameRate();
	    this._frameCount = 0;
	    this._flipCallbacks = [];
	    this._windowAlreadyInFullScreen = false;
	    const self = this;
	    document.addEventListener('fullscreenchange', event => {
	      self._windowAlreadyInFullScreen = !!document.fullscreenElement;
	      console.log('windowAlreadyInFullScreen:', self._windowAlreadyInFullScreen);
	      self._needUpdate = true;
	      for (const stimulus of self._drawList) {
	        stimulus._needUpdate = true;
	      }
	    });
	    if (this._autoLog) {
	      this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
	    }
	  }
	  close() {
	    if (!this._renderer) {
	      return;
	    }
	    if (document.body.contains(this._renderer.view)) {
	      document.body.removeChild(this._renderer.view);
	    }
	    if (typeof this._renderer.gl !== 'undefined') {
	      const extension = this._renderer.gl.getExtension('WEBGL_lose_context');
	      this._renderer.destroy();
	      extension.loseContext();
	    } else {
	      this._renderer.destroy();
	    }
	    window.removeEventListener('resize', this._resizeCallback);
	    window.removeEventListener('orientationchange', this._resizeCallback);
	    this._renderer = null;
	  }
	  getActualFrameRate() {
	    return 60.0;
	  }
	  adjustScreenSize() {
	    if (this.fullscr
	    ) {
	        this._psychoJS.logger.debug('Resizing Window: ', this._name, 'to full screen.');
	        if (typeof document.documentElement.requestFullscreen === 'function') {
	          document.documentElement.requestFullscreen().catch(() => {
	            this.psychoJS.logger.warn('Unable to go fullscreen.');
	          });
	        } else if (typeof document.documentElement.mozRequestFullScreen === 'function') {
	          document.documentElement.mozRequestFullScreen();
	        } else if (typeof document.documentElement.webkitRequestFullscreen === 'function') {
	          document.documentElement.webkitRequestFullscreen();
	        } else if (typeof document.documentElement.msRequestFullscreen === 'function') {
	          document.documentElement.msRequestFullscreen();
	        } else {
	          this.psychoJS.logger.warn('Unable to go fullscreen.');
	        }
	      }
	  }
	  closeFullScreen() {
	    if (this.fullscr) {
	      this._psychoJS.logger.debug('Resizing Window: ', this._name, 'back from full screen.');
	      if (typeof document.exitFullscreen === 'function') {
	        document.exitFullscreen().catch(() => {
	          this.psychoJS.logger.warn('Unable to close fullscreen.');
	        });
	      } else if (typeof document.mozCancelFullScreen === 'function') {
	        document.mozCancelFullScreen();
	      } else if (typeof document.webkitExitFullscreen === 'function') {
	        document.webkitExitFullscreen();
	      } else if (typeof document.msExitFullscreen === 'function') {
	        document.msExitFullscreen();
	      } else {
	        this.psychoJS.logger.warn('Unable to close fullscreen.');
	      }
	    }
	  }
	  logOnFlip({
	    msg,
	    level = Logger.ServerLevel.EXP,
	    obj
	  } = {}) {
	    this._msgToBeLogged.push({
	      msg,
	      level,
	      obj
	    });
	  }
	  callOnFlip(flipCallback, ...flipCallbackArgs) {
	    this._flipCallbacks.push({
	      function: flipCallback,
	      arguments: flipCallbackArgs
	    });
	  }
	  render() {
	    if (!this._renderer) {
	      return;
	    }
	    this._frameCount++;
	    this._renderer.render(this._rootContainer);
	    if (typeof this._renderer.gl !== 'undefined') {
	      this._renderer.gl.readPixels(0, 0, 1, 1, this._renderer.gl.RGBA, this._renderer.gl.UNSIGNED_BYTE, new Uint8Array(4));
	      if (this._waitBlanking) {
	        this._renderer.gl.finish();
	      }
	    }
	    for (let callback of this._flipCallbacks) {
	      callback['function'](...callback['arguments']);
	    }
	    this._flipCallbacks = [];
	    this._writeLogOnFlip();
	    this._refresh();
	  }
	  _updateIfNeeded() {
	    if (this._needUpdate) {
	      if (this._renderer) {
	        this._renderer.backgroundColor = this._color.int;
	      }
	      document.body.style.backgroundColor = this._color.hex;
	      this._needUpdate = false;
	    }
	  }
	  _refresh() {
	    this._updateIfNeeded();
	    for (const stimulus of this._drawList) {
	      if (stimulus._needUpdate && typeof stimulus._pixi !== 'undefined') {
	        this._rootContainer.removeChild(stimulus._pixi);
	        stimulus._updateIfNeeded();
	        this._rootContainer.addChild(stimulus._pixi);
	      }
	    }
	  }
	  _fullRefresh() {
	    this._needUpdate = true;
	    for (const stimulus of this._drawList) {
	      stimulus.refresh();
	    }
	    this._refresh();
	  }
	  _setupPixi() {
	    this._size[0] = window.innerWidth;
	    this._size[1] = window.innerHeight;
	    this._renderer = PIXI.autoDetectRenderer(this._size[0], this._size[1], {
	      backgroundColor: this.color.int,
	      resolution: window.devicePixelRatio
	    });
	    this._renderer.view.style.transform = 'translatez(0)';
	    this._renderer.view.style.position = 'absolute';
	    document.body.appendChild(this._renderer.view);
	    document.body.style.backgroundColor = this._color.hex;
	    this._rootContainer = new PIXI.Container();
	    this._rootContainer.interactive = true;
	    Window._resizePixiRenderer(this);
	    this.psychoJS.eventManager.addMouseListeners(this._renderer);
	    this._resizeCallback = e => {
	      Window._resizePixiRenderer(this, e);
	      this._fullRefresh();
	    };
	    window.addEventListener('resize', this._resizeCallback);
	    window.addEventListener('orientationchange', this._resizeCallback);
	  }
	  static _resizePixiRenderer(pjsWindow, event) {
	    pjsWindow._psychoJS.logger.debug('resizing Window: ', pjsWindow._name, 'event:', JSON.stringify(event));
	    pjsWindow._size[0] = window.innerWidth;
	    pjsWindow._size[1] = window.innerHeight;
	    pjsWindow._renderer.view.style.width = pjsWindow._size[0] + 'px';
	    pjsWindow._renderer.view.style.height = pjsWindow._size[1] + 'px';
	    pjsWindow._renderer.view.style.left = '0px';
	    pjsWindow._renderer.view.style.top = '0px';
	    pjsWindow._renderer.resize(pjsWindow._size[0], pjsWindow._size[1]);
	    pjsWindow._rootContainer.position.x = pjsWindow._size[0] / 2.0;
	    pjsWindow._rootContainer.position.y = pjsWindow._size[1] / 2.0;
	    pjsWindow._rootContainer.scale.y = -1;
	  }
	  _writeLogOnFlip() {
	    const logTime = Clock_js.MonotonicClock.getReferenceTime();
	    for (const entry of this._msgToBeLogged) {
	      this._psychoJS.experimentLogger.log(entry.msg, entry.level, logTime, entry.obj);
	    }
	    this._msgToBeLogged = [];
	  }
	}

	/**
	 * Graphic User Interface
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class GUI {
	  get dialogComponent() {
	    return this._dialogComponent;
	  }
	  constructor(psychoJS) {
	    this._psychoJS = psychoJS;
	    psychoJS.serverManager.on(ServerManager.Event.RESOURCE, signal => {
	      this._onResourceEvents(signal);
	    });
	    this._dialogScalingFactor = 0;
	  }
	  DlgFromDict({
	    logoUrl,
	    text,
	    dictionary,
	    title
	  }) {
	    const infoFromUrl = util$1.getUrlParameters();
	    this._progressMsg = '&nbsp;';
	    this._progressBarMax = 0;
	    this._allResourcesDownloaded = false;
	    this._requiredKeys = [];
	    this._setRequiredKeys = new Map();
	    this._dialogComponent = {};
	    this._dialogComponent.status = PsychoJS.Status.NOT_STARTED;
	    const dialogClock = new Clock_js.Clock();
	    const self = this;
	    return () => {
	      const t = dialogClock.getTime();
	      if (t >= 0.0 && self._dialogComponent.status === PsychoJS.Status.NOT_STARTED) {
	        self._dialogComponent.tStart = t;
	        self._dialogComponent.status = PsychoJS.Status.STARTED;
	        if (self._psychoJS.getEnvironment() === ExperimentHandler_js.ExperimentHandler.Environment.SERVER && typeof self._psychoJS.config.experiment.license !== 'undefined' && self._psychoJS.config.experiment.runMode === 'LICENSE' && typeof self._psychoJS.config.experiment.license.institutionLogo !== 'undefined') {
	          logoUrl = self._psychoJS.config.experiment.license.institutionLogo;
	        }
	        let htmlCode = '<div id="expDialog" title="' + title + '">';
	        if (typeof logoUrl === 'string') {
	          htmlCode += '<img id="dialog-logo" class="logo" alt="logo" src="' + logoUrl + '">';
	        }
	        if (typeof text === 'string' && text.length > 0) {
	          htmlCode += '<p>' + text + '</p>';
	        }
	        htmlCode += '<form>';
	        for (const key in dictionary) {
	          const value = dictionary[key];
	          const keyId = CSS.escape(key) + '_id';
	          let inUrl = false;
	          const cleanedDictKey = key.trim().toLowerCase();
	          infoFromUrl.forEach((urlValue, urlKey) => {
	            const cleanedUrlKey = urlKey.trim().toLowerCase();
	            if (cleanedUrlKey === cleanedDictKey) {
	              inUrl = true;
	            }
	          });
	          if (!inUrl) {
	            htmlCode += '<label for="' + keyId + '">' + key + '</label>';
	            if (key.slice(-1) === '*') {
	              self._requiredKeys.push(key);
	            }
	            if (Array.isArray(value)) {
	              htmlCode += '<select name="' + key + '" id="' + keyId + '" class="text ui-widget-content' + ' ui-corner-all">';
	              if (key.slice(-1) === '*') {
	                htmlCode += '<option disabled selected>...</option>';
	              }
	              for (const option of value) {
	                htmlCode += '<option>' + option + '</option>';
	              }
	              htmlCode += '</select>';
	              $('#' + keyId).selectmenu({
	                classes: {}
	              });
	            }
	            else
	              {
	                htmlCode += '<input type="text" name="' + key + '" id="' + keyId;
	                htmlCode += '" value="' + value + '" class="text ui-widget-content ui-corner-all">';
	              }
	          }
	        }
	        htmlCode += '</form>';
	        htmlCode += '<hr><div id="progressMsg" class="progress">' + self._progressMsg + '</div>';
	        htmlCode += '<div id="progressbar"></div></div>';
	        const dialogElement = document.getElementById('root');
	        dialogElement.innerHTML = htmlCode;
	        if (typeof logoUrl === 'string') {
	          $("#dialog-logo").on('load', () => {
	            self._onDialogOpen('#expDialog')();
	          });
	        }
	        for (const key of this._requiredKeys) {
	          const keyId = CSS.escape(key) + '_id';
	          const input = document.getElementById(keyId);
	          if (input) {
	            input.oninput = event => GUI._onKeyChange(self, event);
	          }
	        }
	        self._dialogComponent.button = 'Cancel';
	        self._estimateDialogScalingFactor();
	        const dialogSize = self._getDialogSize();
	        $("#expDialog").dialog({
	          width: dialogSize[0],
	          maxHeight: dialogSize[1],
	          autoOpen: true,
	          modal: true,
	          closeOnEscape: false,
	          resizable: false,
	          buttons: [{
	            id: "buttonOk",
	            text: "Ok",
	            click: function () {
	              for (const key in dictionary) {
	                const input = document.getElementById(CSS.escape(key) + "_id");
	                if (input) {
	                  dictionary[key] = input.value;
	                }
	              }
	              self._dialogComponent.button = 'OK';
	              $("#expDialog").dialog('close');
	              self._psychoJS.window.adjustScreenSize();
	            }
	          }, {
	            id: "buttonCancel",
	            text: "Cancel",
	            click: function () {
	              self._dialogComponent.button = 'Cancel';
	              $("#expDialog").dialog('close');
	            }
	          }],
	          open: self._onDialogOpen('#expDialog'),
	          close: function () {
	            $(this).dialog('destroy').remove();
	            self._dialogComponent.status = PsychoJS.Status.FINISHED;
	          }
	        })
	        .prev(".ui-dialog-titlebar").css("background", "green");
	        self._updateOkButtonStatus();
	        self._dialogResize('#expDialog');
	        $("#progressbar").progressbar({
	          value: self._progressBarCurrentIncrement
	        });
	        $("#progressbar").progressbar("option", "max", self._progressBarMax);
	      }
	      if (self._dialogComponent.status === PsychoJS.Status.FINISHED) {
	        return Scheduler_js.Scheduler.Event.NEXT;
	      } else {
	        return Scheduler_js.Scheduler.Event.FLIP_REPEAT;
	      }
	    };
	  }
	  dialog({
	    message,
	    warning,
	    error,
	    showOK = true,
	    onOK
	  } = {}) {
	    const expDialog = $("#expDialog");
	    if (expDialog.length) {
	      expDialog.dialog("destroy").remove();
	    }
	    const msgDialog = $("#msgDialog");
	    if (msgDialog.length) {
	      msgDialog.dialog("destroy").remove();
	    }
	    let htmlCode;
	    let titleColour;
	    if (typeof error !== 'undefined') {
	      this._psychoJS.logger.fatal(util$1.toString(error));
	      if (!error) {
	        error = 'Unspecified JavaScript error';
	      }
	      let errorCode = null;
	      let stackCode = '<ul>';
	      while (true) {
	        if (typeof error === 'object' && 'errorCode' in error) {
	          errorCode = error.errorCode;
	        }
	        if (typeof error === 'object' && 'context' in error) {
	          stackCode += '<li>' + error.context + '</li>';
	          error = error.error;
	        } else {
	          stackCode += '<li><b>' + error + '</b></li>';
	          break;
	        }
	      }
	      stackCode += '</ul>';
	      if (errorCode) {
	        const error = this._userFriendlyError(errorCode);
	        htmlCode = error.htmlCode;
	        titleColour = error.titleColour;
	      } else {
	        htmlCode = '<div id="msgDialog" title="Error">';
	        htmlCode += '<p class="validateTips">Unfortunately we encountered the following error:</p>';
	        htmlCode += stackCode;
	        htmlCode += '<p>Try to run the experiment again. If the error persists, contact the experiment designer.</p>';
	        htmlCode += '</div>';
	        titleColour = 'red';
	      }
	    }
	    else if (typeof message !== 'undefined') {
	        htmlCode = '<div id="msgDialog" title="Message">' + '<p class="validateTips">' + message + '</p>' + '</div>';
	        titleColour = 'green';
	      }
	      else if (typeof warning !== 'undefined') {
	          htmlCode = '<div id="msgDialog" title="Warning">' + '<p class="validateTips">' + warning + '</p>' + '</div>';
	          titleColour = 'orange';
	        }
	    const dialogElement = document.getElementById('root');
	    dialogElement.innerHTML = htmlCode;
	    this._estimateDialogScalingFactor();
	    const dialogSize = this._getDialogSize();
	    const self = this;
	    $("#msgDialog").dialog({
	      dialogClass: 'no-close',
	      width: dialogSize[0],
	      maxHeight: dialogSize[1],
	      autoOpen: true,
	      modal: true,
	      closeOnEscape: false,
	      buttons: !showOK ? [] : [{
	        id: "buttonOk",
	        text: "Ok",
	        click: function () {
	          $(this).dialog("destroy").remove();
	          if (typeof onOK !== 'undefined') {
	            onOK();
	          }
	        }
	      }],
	      open: self._onDialogOpen('#msgDialog')
	    })
	    .prev(".ui-dialog-titlebar").css("background", titleColour);
	    self._dialogResize('#msgDialog');
	  }
	  _onDialogOpen(dialogId) {
	    const self = this;
	    return () => {
	      const windowSize = [$(window).width(), $(window).height()];
	      const parent = $(dialogId).parent();
	      parent.css({
	        position: 'absolute',
	        left: Math.max(0, (windowSize[0] - parent.outerWidth()) / 2.0),
	        top: Math.max(0, (windowSize[1] - parent.outerHeight()) / 2.0)
	      });
	      self._contentDelta = [parent.css('width').slice(0, -2) - $(dialogId).css('width').slice(0, -2), parent.css('height').slice(0, -2) - $(dialogId).css('height').slice(0, -2)];
	    };
	  }
	  _dialogResize(dialogId) {
	    const self = this;
	    $(window).resize(function () {
	      const parent = $(dialogId).parent();
	      const windowSize = [$(window).width(), $(window).height()];
	      const dialogSize = self._getDialogSize();
	      parent.css({
	        width: dialogSize[0],
	        maxHeight: dialogSize[1]
	      });
	      const isDifferent = self._estimateDialogScalingFactor();
	      if (!isDifferent) {
	        $(dialogId).css({
	          width: dialogSize[0] - self._contentDelta[0],
	          maxHeight: dialogSize[1] - self._contentDelta[1]
	        });
	      }
	      parent.css({
	        position: 'absolute',
	        left: Math.max(0, (windowSize[0] - parent.outerWidth()) / 2.0),
	        top: Math.max(0, (windowSize[1] - parent.outerHeight()) / 2.0)
	      });
	    });
	  }
	  _onResourceEvents(signal) {
	    this._psychoJS.logger.debug('signal: ' + util$1.toString(signal));
	    if (signal.message === ServerManager.Event.RESOURCES_REGISTERED) {
	      this._progressBarMax = signal.count * 2;
	      $("#progressbar").progressbar("option", "max", this._progressBarMax);
	      this._progressBarCurrentIncrement = 0;
	      $("#progressMsg").text('all resources registered.');
	    }
	    else if (signal.message === ServerManager.Event.DOWNLOAD_COMPLETED) {
	        this._allResourcesDownloaded = true;
	        $("#progressMsg").text('all resources downloaded.');
	        this._updateOkButtonStatus();
	      }
	      else if (signal.message === ServerManager.Event.DOWNLOADING_RESOURCE || signal.message === ServerManager.Event.RESOURCE_DOWNLOADED) {
	          if (typeof this._progressBarCurrentIncrement === 'undefined') {
	            this._progressBarCurrentIncrement = 0;
	          }
	          ++this._progressBarCurrentIncrement;
	          if (signal.message === ServerManager.Event.RESOURCE_DOWNLOADED) {
	            $("#progressMsg").text('downloaded ' + this._progressBarCurrentIncrement / 2 + ' / ' + this._progressBarMax / 2);
	          }
	          $("#progressbar").progressbar("option", "value", this._progressBarCurrentIncrement);
	        }
	        else {
	            $("#progressMsg").text(signal.message);
	          }
	  }
	  _updateOkButtonStatus() {
	    if (this._psychoJS.getEnvironment() === ExperimentHandler_js.ExperimentHandler.Environment.LOCAL || this._allResourcesDownloaded && this._setRequiredKeys.size >= this._requiredKeys.length) {
	      $("#buttonOk").button("option", "disabled", false);
	    } else {
	      $("#buttonOk").button("option", "disabled", true);
	    }
	    $("#buttonOk").hide(0, () => {
	      $("#buttonOk").show();
	    });
	  }
	  _estimateDialogScalingFactor() {
	    const windowSize = [$(window).width(), $(window).height()];
	    let dialogScalingFactor = 1.0;
	    if (windowSize[0] < 1080) {
	      if (windowSize[0] > windowSize[1]) {
	        dialogScalingFactor = 1.5;
	      }
	      else {
	          dialogScalingFactor = 2.0;
	        }
	    }
	    const isDifferent = dialogScalingFactor !== this._dialogScalingFactor;
	    this._dialogScalingFactor = dialogScalingFactor;
	    return isDifferent;
	  }
	  _getDialogSize() {
	    const windowSize = [$(window).width(), $(window).height()];
	    this._estimateDialogScalingFactor();
	    return [Math.min(GUI.dialogMaxSize[0], (windowSize[0] - GUI.dialogMargin[0]) / this._dialogScalingFactor), Math.min(GUI.dialogMaxSize[1], (windowSize[1] - GUI.dialogMargin[1]) / this._dialogScalingFactor)];
	  }
	  static _onKeyChange(gui, event) {
	    const element = event.target;
	    const value = element.value;
	    if (typeof value !== 'undefined' && value.length > 0) {
	      gui._setRequiredKeys.set(event.target, true);
	    } else {
	      gui._setRequiredKeys.delete(event.target);
	    }
	    gui._updateOkButtonStatus();
	  }
	  _userFriendlyError(errorCode) {
	    switch (errorCode) {
	      case 1:
	        return {
	          htmlCode: '<div id="msgDialog" title="Error"><p>Oops we encountered an internal server error.</p><p>Try to run the experiment again. If the error persists, contact the experiment designer.</p></div>',
	          titleColour: 'red'
	        };
	      case 2:
	        return {
	          htmlCode: '<div id="msgDialog" title="Error"><p>Oops we encountered a database error.</p><p>Try to run the experiment again. If the error persists, contact the experiment designer.</p></div>',
	          titleColour: 'red'
	        };
	      case 20:
	        return {
	          htmlCode: `<div id="msgDialog" title="Warning"><p><strong>${this._psychoJS.config.experiment.fullpath}</strong> does not have any status and cannot be run.</p><p>If you are the experiment designer, go to your <a href="https://pavlovia.org/${this._psychoJS.config.experiment.fullpath}">experiment page</a> and change the experiment status to either PILOTING or RUNNING.</p><p>Otherwise please contact the experiment designer to let him or her know that the status must be changed to RUNNING for participants to be able to run it.</p></div>`,
	          titleColour: 'orange'
	        };
	      case 21:
	        return {
	          htmlCode: `<div id="msgDialog" title="Warning"><p><strong>${this._psychoJS.config.experiment.fullpath}</strong> is currently inactive and cannot be run.</p><p>If you are the experiment designer, go to your <a href="https://pavlovia.org/${this._psychoJS.config.experiment.fullpath}">experiment page</a> and change the experiment status to either PILOTING or RUNNING.</p><p>Otherwise please contact the experiment designer to let him or her know that the status must be changed to RUNNING for participants to be able to run it.</p></div>`,
	          titleColour: 'orange'
	        };
	      case 22:
	        return {
	          htmlCode: `<div id="msgDialog" title="Warning"><p><strong>${this._psychoJS.config.experiment.fullpath}</strong> has been deleted and cannot be run.</p><p>If you are the experiment designer, either go to your <a href="https://pavlovia.org/${this._psychoJS.config.experiment.fullpath}">experiment page</a> and change the experiment status to either PILOTING or RUNNING, or generate a new experiment.</p><p>Otherwise please contact the experiment designer to let him or her know that the experiment has been deleted and cannot be run any longer.</p></div>`,
	          titleColour: 'orange'
	        };
	      case 23:
	        return {
	          htmlCode: `<div id="msgDialog" title="Warning"><p><strong>${this._psychoJS.config.experiment.fullpath}</strong> has been archived and cannot be run.</p><p>If you are the experiment designer, go to your <a href="https://pavlovia.org/${this._psychoJS.config.experiment.fullpath}">experiment page</a> and change the experiment status to either PILOTING or RUNNING.</p><p>Otherwise please contact the experiment designer to let him or her know that the experiment has been archived and cannot be run at the moment.</p></div>`,
	          titleColour: 'orange'
	        };
	      case 30:
	        return {
	          htmlCode: `<div id="msgDialog" title="Warning"><p><strong>${this._psychoJS.config.experiment.fullpath}</strong> is currently in PILOTING mode but the pilot token is missing from the URL.</p><p>If you are the experiment designer, you can pilot it by pressing the pilot button on your <a href="https://pavlovia.org/${this._psychoJS.config.experiment.fullpath}">experiment page</a>.</p><p>Otherwise please contact the experiment designer to let him or her know that the experiment status must be changed to RUNNING for participants to be able to run it.</p></div>`,
	          titleColour: 'orange'
	        };
	      case 31:
	        return {
	          htmlCode: `<div id="msgDialog" title="Warning"><p><strong>${this._psychoJS.config.experiment.fullpath}</strong> cannot be run because the pilot token in the URL is invalid, possibly because it has expired.</p><p>If you are the experiment designer, you can generate a new token by pressing the pilot button on your <a href="https://pavlovia.org/${this._psychoJS.config.experiment.fullpath}">experiment page</a>.</p><p>Otherwise please contact the experiment designer to let him or her know that the experiment status must be changed to RUNNING for participants to be able to run it.</p></div>`,
	          titleColour: 'orange'
	        };
	      case 50:
	        return {
	          htmlCode: `<div id="msgDialog" title="Warning"><p><strong>${this._psychoJS.config.experiment.fullpath}</strong> is covered by a license that has expired. </p><p>If you are the experiment designer, you can either contact the license manager to inquire about the expiration, or you can run your experiments using credits. You will find all relevant details about the license on your <a href="https://pavlovia.org/${this._psychoJS.config.experiment.fullpath}">experiment page</a>, where you will also be able to change its running mode to CREDIT.</p><p>Otherwise please contact the experiment designer to let him or her know that there is an issue with the experiment's license having expired.</p></div>`,
	          titleColour: 'orange'
	        };
	      case 51:
	        return {
	          htmlCode: `<div id="msgDialog" title="Warning"><p><strong>${this._psychoJS.config.experiment.fullpath}</strong> is covered by a license that requires one or more documents to be approved before the experiment can be run. </p><p>If you are the experiment designer, please contact the license manager and ask him or her which documents must be approved. You will find all relevant details about the license on your <a href="https://pavlovia.org/${this._psychoJS.config.experiment.fullpath}">experiment page</a>.</p><p>Otherwise please contact the experiment designer to let him or her know that there is an issue with the experiment's license requiring documents to be approved.</p></div>`,
	          titleColour: 'orange'
	        };
	      case 60:
	        return {
	          htmlCode: `<div id="msgDialog" title="Warning"><p><strong>${this._psychoJS.config.experiment.fullpath}</strong> does not have any assigned credit left and cannot be run.</p><p>If you are the experiment designer, you can assign more credits to it on your <a href="https://pavlovia.org/${this._psychoJS.config.experiment.fullpath}">experiment page</a>.</p><p>Otherwise please contact the experiment designer to let him or her know that the experiment requires more assigned credits to run.</p></div>`,
	          titleColour: 'orange'
	        };
	      default:
	        return {
	          htmlCode: `<div id="msgDialog" title="Error"><p>Unfortunately we encountered an unspecified error (error code: ${errorCode}.</p><p>Try to run the experiment again. If the error persists, contact the experiment designer.</p></div>`,
	          titleColour: 'red'
	        };
	    }
	  }
	}
	GUI.dialogMaxSize = [500, 600];
	GUI.dialogMargin = [50, 50];

	/**
	 * Main component of the PsychoJS library.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class PsychoJS {
	  get status() {
	    return this._status;
	  }
	  set status(status) {
	    this._status = status;
	  }
	  get config() {
	    return this._config;
	  }
	  get window() {
	    return this._window;
	  }
	  get serverManager() {
	    return this._serverManager;
	  }
	  get experiment() {
	    return this._experiment;
	  }
	  get scheduler() {
	    return this._scheduler;
	  }
	  get monotonicClock() {
	    return this._monotonicClock;
	  }
	  get logger() {
	    return this._logger.consoleLogger;
	  }
	  get experimentLogger() {
	    return this._logger;
	  }
	  get eventManager() {
	    return this._eventManager;
	  }
	  get gui() {
	    return this._gui;
	  }
	  get IP() {
	    return this._IP;
	  }
	  get serverMsg() {
	    return this._serverMsg;
	  }
	  get browser() {
	    return this._browser;
	  }
	  constructor({
	    debug = true,
	    collectIP = false,
	    topLevelStatus = true
	  } = {}) {
	    this._logger = new Logger(this, debug ? log4javascript.Level.DEBUG : log4javascript.Level.INFO);
	    this._captureErrors();
	    this._browser = util$1.detectBrowser();
	    this.logger.info('[PsychoJS] Detected browser:', this._browser);
	    this._monotonicClock = new Clock_js.MonotonicClock();
	    this._eventManager = new EventManager(this);
	    this._serverManager = new ServerManager({
	      psychoJS: this
	    });
	    this._gui = new GUI(this);
	    this._collectIP = collectIP;
	    this._scheduler = new Scheduler_js.Scheduler(this);
	    this._window = undefined;
	    this._cancellationUrl = undefined;
	    this._completionUrl = undefined;
	    this._status = PsychoJS.Status.NOT_CONFIGURED;
	    if (topLevelStatus) {
	      this._makeStatusTopLevel();
	    }
	    this.logger.info('[PsychoJS] Initialised.');
	    this.logger.info('[PsychoJS] @version 2020.5');
	  }
	  getEnvironment() {
	    if (typeof this._config === 'undefined') {
	      return undefined;
	    }
	    return this._config.environment;
	  }
	  openWindow({
	    name,
	    fullscr,
	    color,
	    units,
	    waitBlanking,
	    autoLog
	  } = {}) {
	    this.logger.info('[PsychoJS] Open Window.');
	    if (typeof this._window !== 'undefined') {
	      throw {
	        origin: 'PsychoJS.openWindow',
	        context: 'when opening a Window',
	        error: 'A Window has already been opened.'
	      };
	    }
	    this._window = new Window({
	      psychoJS: this,
	      name,
	      fullscr,
	      color,
	      units,
	      waitBlanking,
	      autoLog
	    });
	  }
	  setRedirectUrls(completionUrl, cancellationUrl) {
	    this._completionUrl = completionUrl;
	    this._cancellationUrl = cancellationUrl;
	  }
	  schedule(task, args) {
	    this.logger.debug('schedule task: ', task.toString().substring(0, 50), '...');
	    this._scheduler.add(task, args);
	  }
	  scheduleCondition(condition, thenScheduler, elseScheduler) {
	    this.logger.debug('schedule condition: ', condition.toString().substring(0, 50), '...');
	    this._scheduler.addConditional(condition, thenScheduler, elseScheduler);
	  }
	  async start({
	    configURL = 'config.json',
	    expName = 'UNKNOWN',
	    expInfo,
	    resources = []
	  } = {}) {
	    this.logger.debug();
	    const response = {
	      origin: 'PsychoJS.start',
	      context: 'when starting the experiment'
	    };
	    try {
	      await this._configure(configURL, expName);
	      if (this._collectIP) {
	        this._getParticipantIPInfo();
	      } else {
	        this._IP = {
	          IP: 'X',
	          hostname: 'X',
	          city: 'X',
	          region: 'X',
	          country: 'X',
	          location: 'X'
	        };
	      }
	      this._experiment = new ExperimentHandler_js.ExperimentHandler({
	        psychoJS: this,
	        extraInfo: expInfo
	      });
	      if (this.getEnvironment() === ExperimentHandler_js.ExperimentHandler.Environment.SERVER) {
	        await this._serverManager.openSession();
	        this.beforeunloadCallback = event => {
	          event.preventDefault();
	          event.returnValue = '';
	        };
	        window.addEventListener('beforeunload', this.beforeunloadCallback);
	        const self = this;
	        window.addEventListener('unload', event => {
	          if (self._config.session.status === 'OPEN') {
	            if (self._config.experiment.saveIncompleteResults) {
	              self._experiment.save({
	                sync: true
	              });
	            }
	            self._serverManager.closeSession(false, true);
	          }
	          if (typeof self._window !== 'undefined') {
	            self._window.close();
	          }
	        });
	      }
	      this._serverManager.downloadResources(resources);
	      this.logger.info('[PsychoJS] Start Experiment.');
	      this._scheduler.start();
	    } catch (error) {
	      this._gui.dialog({
	        error: Object.assign(response, {
	          error
	        })
	      });
	    }
	  }
	  async downloadResources(resources = []) {
	    try {
	      await this.serverManager.downloadResources(resources);
	    } catch (error) {
	      this._gui.dialog({
	        error: Object.assign(response, {
	          error
	        })
	      });
	    }
	  }
	  importAttributes(obj) {
	    this.logger.debug('import attributes from: ', util$1.toString(obj));
	    if (typeof obj === 'undefined') {
	      return;
	    }
	    for (const attribute in obj) {
	      window[attribute] = obj[attribute];
	    }
	  }
	  async quit({
	    message,
	    isCompleted = false
	  } = {}) {
	    this.logger.info('[PsychoJS] Quit.');
	    this._experiment.experimentEnded = true;
	    this._status = PsychoJS.Status.FINISHED;
	    try {
	      this._scheduler.stop();
	      if (this.getEnvironment() === ExperimentHandler_js.ExperimentHandler.Environment.SERVER) {
	        window.removeEventListener('beforeunload', this.beforeunloadCallback);
	      }
	      this.gui.dialog({
	        warning: 'Closing the session. Please wait a few moments.',
	        showOK: false
	      });
	      if (isCompleted || this._config.experiment.saveIncompleteResults) {
	        await this._experiment.save();
	        await this._logger.flush();
	      }
	      if (this.getEnvironment() === ExperimentHandler_js.ExperimentHandler.Environment.SERVER) {
	        await this._serverManager.closeSession(isCompleted);
	      }
	      let text = 'Thank you for your patience.<br/><br/>';
	      text += typeof message !== 'undefined' ? message : 'Goodbye!';
	      const self = this;
	      this._gui.dialog({
	        message: text,
	        onOK: () => {
	          self._window.close();
	          while (document.body.hasChildNodes()) {
	            document.body.removeChild(document.body.lastChild);
	          }
	          this._window.closeFullScreen();
	          if (isCompleted && typeof self._completionUrl !== 'undefined') {
	            window.location = self._completionUrl;
	          } else if (!isCompleted && typeof self._cancellationUrl !== 'undefined') {
	            window.location = self._cancellationUrl;
	          }
	        }
	      });
	    } catch (error) {
	      console.error(error);
	      this._gui.dialog({
	        error
	      });
	    }
	  }
	  async _configure(configURL, name) {
	    const response = {
	      origin: 'PsychoJS.configure',
	      context: 'when configuring PsychoJS for the experiment'
	    };
	    try {
	      this.status = PsychoJS.Status.CONFIGURING;
	      const experimentUrl = window.location.href;
	      if (experimentUrl.indexOf('https://run.pavlovia.org/') === 0 || experimentUrl.indexOf('https://pavlovia.org/run/') === 0) {
	        const serverResponse = await this._serverManager.getConfiguration(configURL);
	        this._config = serverResponse.config;
	        if ('psychoJsManager' in this._config) {
	          delete this._config.psychoJsManager;
	          this._config.pavlovia = {
	            URL: 'https://pavlovia.org'
	          };
	        }
	        if (!('experiment' in this._config)) {
	          throw 'missing experiment block in configuration';
	        }
	        if (!('name' in this._config.experiment)) {
	          throw 'missing name in experiment block in configuration';
	        }
	        if (!('fullpath' in this._config.experiment)) {
	          throw 'missing fullpath in experiment block in configuration';
	        }
	        if (!('pavlovia' in this._config)) {
	          throw 'missing pavlovia block in configuration';
	        }
	        if (!('URL' in this._config.pavlovia)) {
	          throw 'missing URL in pavlovia block in configuration';
	        }
	        this._config.environment = ExperimentHandler_js.ExperimentHandler.Environment.SERVER;
	      } else
	        {
	          this._config = {
	            environment: ExperimentHandler_js.ExperimentHandler.Environment.LOCAL,
	            experiment: {
	              name,
	              saveFormat: ExperimentHandler_js.ExperimentHandler.SaveFormat.CSV
	            }
	          };
	        }
	      this._serverMsg = new Map();
	      util$1.getUrlParameters().forEach((value, key) => {
	        if (key.indexOf('__') === 0) {
	          this._serverMsg.set(key, value);
	        }
	      });
	      this.status = PsychoJS.Status.CONFIGURED;
	      this.logger.debug('configuration:', util$1.toString(this._config));
	    } catch (error) {
	      throw Object.assign(response, {
	        error
	      });
	    }
	  }
	  async _getParticipantIPInfo() {
	    const response = {
	      origin: 'PsychoJS._getParticipantIPInfo',
	      context: 'when getting the IP information of the participant'
	    };
	    this.logger.debug('getting the IP information of the participant');
	    this._IP = {};
	    try {
	      const geoResponse = await $.get('http://www.geoplugin.net/json.gp');
	      const geoData = JSON.parse(geoResponse);
	      this._IP = {
	        IP: geoData.geoplugin_request,
	        country: geoData.geoplugin_countryName,
	        latitude: geoData.geoplugin_latitude,
	        longitude: geoData.geoplugin_longitude
	      };
	      this.logger.debug('IP information of the participant: ' + util$1.toString(this._IP));
	    } catch (error) {
	      throw Object.assign(response, {
	        error
	      });
	    }
	  }
	  _captureErrors() {
	    this.logger.debug('capturing all errors using window.onerror');
	    const self = this;
	    window.onerror = function (message, source, lineno, colno, error) {
	      console.error(error);
	      self._gui.dialog({
	        "error": error
	      });
	      return true;
	    };
	  }
	  _makeStatusTopLevel() {
	    for (const status in PsychoJS.Status) {
	      window[status] = PsychoJS.Status[status];
	    }
	  }
	}
	PsychoJS.Status = {
	  NOT_CONFIGURED: Symbol.for('NOT_CONFIGURED'),
	  CONFIGURING: Symbol.for('CONFIGURING'),
	  CONFIGURED: Symbol.for('CONFIGURED'),
	  NOT_STARTED: Symbol.for('NOT_STARTED'),
	  STARTED: Symbol.for('STARTED'),
	  FINISHED: Symbol.for('FINISHED'),
	  STOPPED: Symbol.for('FINISHED')
	};

	/**
	 * Manager handling the keyboard and mouse/touch events.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class EventManager {
	  constructor(psychoJS) {
	    this._psychoJS = psychoJS;
	    for (const keyName in EventManager._pygletMap) {
	      EventManager._reversePygletMap[EventManager._pygletMap[keyName]] = keyName;
	    }
	    this._keyBuffer = [];
	    this._addKeyListeners();
	    this._mouseInfo = {
	      pos: [0, 0],
	      wheelRel: [0.0, 0.0],
	      buttons: {
	        pressed: [0, 0, 0],
	        clocks: [new Clock_js.Clock(), new Clock_js.Clock(), new Clock_js.Clock()],
	        times: [0.0, 0.0, 0.0]
	      },
	      moveClock: new Clock_js.Clock()
	    };
	  }
	  getKeys({
	    keyList = null,
	    timeStamped = false
	  } = {}) {
	    if (keyList != null) {
	      keyList = EventManager.pyglet2w3c(keyList);
	    }
	    let newBuffer = [];
	    let keys = [];
	    for (let i = 0; i < this._keyBuffer.length; ++i) {
	      const key = this._keyBuffer[i];
	      let keyId = null;
	      if (keyList != null) {
	        let index = keyList.indexOf(key.code);
	        if (index < 0) {
	          index = keyList.indexOf(EventManager._keycodeMap[key.keyCode]);
	        }
	        if (index >= 0) {
	          keyId = EventManager._reversePygletMap[keyList[index]];
	        }
	      } else {
	        keyId = EventManager._reversePygletMap[key.code];
	      }
	      if (keyId != null) {
	        if (timeStamped) {
	          keys.push([keyId, key.timestamp]);
	        } else {
	          keys.push(keyId);
	        }
	      } else {
	        newBuffer.push(key);
	      }
	    }
	    this._keyBuffer = newBuffer;
	    return keys;
	  }
	  getMouseInfo() {
	    return this._mouseInfo;
	  }
	  clearEvents(attribs) {
	    this.clearKeys();
	  }
	  clearKeys() {
	    this._keyBuffer = [];
	  }
	  startMoveClock() {}
	  stopMoveClock() {}
	  resetMoveClock() {}
	  addMouseListeners(renderer) {
	    const self = this;
	    renderer.view.addEventListener("pointerdown", event => {
	      event.preventDefault();
	      self._mouseInfo.buttons.pressed[event.button] = 1;
	      self._mouseInfo.buttons.times[event.button] = self._psychoJS._monotonicClock.getTime() - self._mouseInfo.buttons.clocks[event.button].getLastResetTime();
	      self._mouseInfo.pos = [event.offsetX, event.offsetY];
	      this._psychoJS.experimentLogger.data("Mouse: " + event.button + " button down, pos=(" + self._mouseInfo.pos[0] + "," + self._mouseInfo.pos[1] + ")");
	    }, false);
	    renderer.view.addEventListener("touchstart", event => {
	      event.preventDefault();
	      self._mouseInfo.buttons.pressed[0] = 1;
	      self._mouseInfo.buttons.times[0] = self._psychoJS._monotonicClock.getTime() - self._mouseInfo.buttons.clocks[0].getLastResetTime();
	      const touches = event.changedTouches;
	      self._mouseInfo.pos = [touches[0].pageX, touches[0].pageY];
	      this._psychoJS.experimentLogger.data("Mouse: " + event.button + " button down, pos=(" + self._mouseInfo.pos[0] + "," + self._mouseInfo.pos[1] + ")");
	    }, false);
	    renderer.view.addEventListener("pointerup", event => {
	      event.preventDefault();
	      self._mouseInfo.buttons.pressed[event.button] = 0;
	      self._mouseInfo.buttons.times[event.button] = self._psychoJS._monotonicClock.getTime() - self._mouseInfo.buttons.clocks[event.button].getLastResetTime();
	      self._mouseInfo.pos = [event.offsetX, event.offsetY];
	      this._psychoJS.experimentLogger.data("Mouse: " + event.button + " button down, pos=(" + self._mouseInfo.pos[0] + "," + self._mouseInfo.pos[1] + ")");
	    }, false);
	    renderer.view.addEventListener("touchend", event => {
	      event.preventDefault();
	      self._mouseInfo.buttons.pressed[0] = 0;
	      self._mouseInfo.buttons.times[0] = self._psychoJS._monotonicClock.getTime() - self._mouseInfo.buttons.clocks[0].getLastResetTime();
	      const touches = event.changedTouches;
	      self._mouseInfo.pos = [touches[0].pageX, touches[0].pageY];
	      this._psychoJS.experimentLogger.data("Mouse: " + event.button + " button down, pos=(" + self._mouseInfo.pos[0] + "," + self._mouseInfo.pos[1] + ")");
	    }, false);
	    renderer.view.addEventListener("pointermove", event => {
	      event.preventDefault();
	      self._mouseInfo.moveClock.reset();
	      self._mouseInfo.pos = [event.offsetX, event.offsetY];
	    }, false);
	    renderer.view.addEventListener("touchmove", event => {
	      event.preventDefault();
	      self._mouseInfo.moveClock.reset();
	      const touches = event.changedTouches;
	      self._mouseInfo.pos = [touches[0].pageX, touches[0].pageY];
	    }, false);
	    renderer.view.addEventListener("wheel", event => {
	      self._mouseInfo.wheelRel[0] += event.deltaX;
	      self._mouseInfo.wheelRel[1] += event.deltaY;
	      this._psychoJS.experimentLogger.data("Mouse: wheel shift=(" + event.deltaX + "," + event.deltaY + "), pos=(" + self._mouseInfo.pos[0] + "," + self._mouseInfo.pos[1] + ")");
	    }, false);
	  }
	  _addKeyListeners() {
	    const self = this;
	    window.addEventListener("keydown", event =>
	    {
	      const timestamp = Clock_js.MonotonicClock.getReferenceTime();
	      let code = event.code;
	      if (typeof code === 'undefined') {
	        code = EventManager.keycode2w3c(event.keyCode);
	      }
	      self._keyBuffer.push({
	        code,
	        key: event.key,
	        keyCode: event.keyCode,
	        timestamp
	      });
	      self._psychoJS.logger.trace('keydown: ', event.key);
	      self._psychoJS.experimentLogger.data('Keydown: ' + event.key);
	      event.stopPropagation();
	    });
	  }
	  static pyglet2w3c(pygletKeyList) {
	    let w3cKeyList = [];
	    for (let i = 0; i < pygletKeyList.length; i++) {
	      if (typeof EventManager._pygletMap[pygletKeyList[i]] === 'undefined') {
	        w3cKeyList.push(pygletKeyList[i]);
	      } else {
	        w3cKeyList.push(EventManager._pygletMap[pygletKeyList[i]]);
	      }
	    }
	    return w3cKeyList;
	  }
	  static w3c2pyglet(code) {
	    if (code in EventManager._reversePygletMap) {
	      return EventManager._reversePygletMap[code];
	    } else {
	      return 'N/A';
	    }
	  }
	  static keycode2w3c(keycode) {
	    return EventManager._keycodeMap[keycode];
	  }
	}
	EventManager._keycodeMap = {
	  49: "Digit1",
	  50: "Digit2",
	  51: "Digit3",
	  52: "Digit4",
	  53: "Digit5",
	  54: "Digit6",
	  55: "Digit7",
	  56: "Digit8",
	  57: "Digit9",
	  48: "Digit0",
	  65: "KeyA",
	  66: "KeyB",
	  67: "KeyC",
	  68: "KeyD",
	  69: "KeyE",
	  70: "KeyF",
	  71: "KeyG",
	  72: "KeyH",
	  73: "KeyI",
	  74: "KeyJ",
	  75: "KeyK",
	  76: "KeyL",
	  77: "KeyM",
	  78: "KeyN",
	  79: "KeyO",
	  80: "KeyP",
	  81: "KeyQ",
	  82: "KeyR",
	  83: "KeyS",
	  84: "KeyT",
	  85: "KeyU",
	  86: "KeyV",
	  87: "KeyW",
	  88: "KeyX",
	  89: "KeyY",
	  90: "KeyZ",
	  188: "Comma",
	  190: "Period",
	  186: "Semicolon",
	  222: "Quote",
	  219: "BracketLeft",
	  221: "BracketRight",
	  192: "Backquote",
	  220: "Backslash",
	  189: "Minus",
	  187: "Equal",
	  144: "NumLock",
	  96: "Numpad0",
	  97: "Numpad1",
	  98: "Numpad2",
	  99: "Numpad3",
	  100: "Numpad4",
	  101: "Numpad5",
	  102: "Numpad6",
	  103: "Numpad7",
	  104: "Numpad8",
	  105: "Numpad9",
	  107: "NumpadAdd",
	  194: "NumpadComma",
	  110: "NumpadDecimal",
	  111: "NumpadDivide",
	  12: "NumpadEqual",
	  106: "NumpadMultiply",
	  109: "NumpadSubtract",
	  13: "Enter",
	  16: "ShiftLeft",
	  17: "ControlLeft",
	  18: "AltLeft",
	  37: "ArrowLeft",
	  38: "ArrowUp",
	  39: "ArrowRight",
	  40: "ArrowDown",
	  27: "Escape",
	  32: "Space"
	};
	EventManager._pygletMap = {
	  "grave": "Backquote",
	  "backslash": "Backslash",
	  "backspace": "Backspace",
	  "bracketleft": "BracketLeft",
	  "bracketright": "BracketRight",
	  "comma": "Comma",
	  "0": "Digit0",
	  "1": "Digit1",
	  "2": "Digit2",
	  "3": "Digit3",
	  "4": "Digit4",
	  "5": "Digit5",
	  "6": "Digit6",
	  "7": "Digit7",
	  "8": "Digit8",
	  "9": "Digit9",
	  "equal": "Equal",
	  "a": "KeyA",
	  "b": "KeyB",
	  "c": "KeyC",
	  "d": "KeyD",
	  "e": "KeyE",
	  "f": "KeyF",
	  "g": "KeyG",
	  "h": "KeyH",
	  "i": "KeyI",
	  "j": "KeyJ",
	  "k": "KeyK",
	  "l": "KeyL",
	  "m": "KeyM",
	  "n": "KeyN",
	  "o": "KeyO",
	  "p": "KeyP",
	  "q": "KeyQ",
	  "r": "KeyR",
	  "s": "KeyS",
	  "t": "KeyT",
	  "u": "KeyU",
	  "v": "KeyV",
	  "w": "KeyW",
	  "x": "KeyX",
	  "y": "KeyY",
	  "z": "KeyZ",
	  "minus": "Minus",
	  "period": "Period",
	  "apostrophe": "Quote",
	  "semicolon": "Semicolon",
	  "slash": "Slash",
	  "escape": "Escape",
	  "loption": "AltLeft",
	  "roption": "AltRight",
	  "capslock": "CapsLock",
	  "lcontrol": "ControlLeft",
	  "rcontrol": "ControlRight",
	  "return": "Enter",
	  "lcommand": "MetaLeft",
	  "rcommand": "MetaRight",
	  "lshift": "ShiftLeft",
	  "rshift": "ShiftRight",
	  "space": "Space",
	  "tab": "Tab",
	  "down": "ArrowDown",
	  "left": "ArrowLeft",
	  "right": "ArrowRight",
	  "up": "ArrowUp",
	  "num_0": "Numpad0",
	  "num_1": "Numpad1",
	  "num_2": "Numpad2",
	  "num_3": "Numpad3",
	  "num_4": "Numpad4",
	  "num_5": "Numpad5",
	  "num_6": "Numpad6",
	  "num_7": "Numpad7",
	  "num_8": "Numpad8",
	  "num_9": "Numpad9",
	  "num_decimal": "NumpadDecimal",
	  "num_enter": "NumpadEnter",
	  "num_add": "NumpadAdd",
	  "num_subtract": "NumpadSubtract",
	  "num_multiply": "NumpadMultiply",
	  "num_divide": "NumpadDivide",
	  "num_equal": "NumpadEqual",
	  "num_numlock": "NumpadNumlock"
	};
	EventManager._reversePygletMap = {};
	class BuilderKeyResponse {
	  constructor(psychoJS) {
	    this._psychoJS = psychoJS;
	    this.status = PsychoJS.Status.NOT_STARTED;
	    this.keys = [];
	    this.corr = 0;
	    this.rt = [];
	    this.clock = new Clock_js.Clock();
	  }
	}

	/**
	 * Manager handling the keyboard events.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class KeyPress {
	  constructor(code, tDown, name) {
	    this.code = code;
	    this.tDown = tDown;
	    this.name = typeof name !== 'undefined' ? name : EventManager.w3c2pyglet(code);
	    this.duration = undefined;
	    this.rt = undefined;
	  }
	}
	class Keyboard extends PsychObject_js.PsychObject {
	  constructor({
	    psychoJS,
	    bufferSize = 10000,
	    waitForStart = false,
	    clock,
	    autoLog = false
	  } = {}) {
	    super(psychoJS);
	    if (typeof clock === 'undefined') {
	      clock = new Clock_js.Clock();
	    }
	    this._addAttributes(Keyboard, bufferSize, waitForStart, clock, autoLog);
	    this._addAttribute('status', waitForStart ? PsychoJS.Status.NOT_STARTED : PsychoJS.Status.STARTED);
	    this.clearEvents();
	    this._addKeyListeners();
	  }
	  start() {
	    this._status = PsychoJS.Status.STARTED;
	  }
	  stop() {
	    this._status = PsychoJS.Status.STOPPED;
	  }
	  getEvents() {
	    if (this._bufferLength === 0) {
	      return [];
	    }
	    let filteredEvents = [];
	    const bufferWrap = this._bufferLength === this._bufferSize;
	    let i = bufferWrap ? this._bufferIndex : -1;
	    do {
	      i = (i + 1) % this._bufferSize;
	      const keyEvent = this._circularBuffer[i];
	      if (keyEvent) {
	        filteredEvents.push(keyEvent);
	      }
	    } while (i !== this._bufferIndex);
	    return filteredEvents;
	  }
	  getKeys({
	    keyList = [],
	    waitRelease = true,
	    clear = true
	  } = {}) {
	    if (this._bufferLength === 0) {
	      return [];
	    }
	    let keyPresses = [];
	    const bufferWrap = this._bufferLength === this._bufferSize;
	    let i = bufferWrap ? this._bufferIndex : -1;
	    do {
	      i = (i + 1) % this._bufferSize;
	      const keyEvent = this._circularBuffer[i];
	      if (keyEvent && keyEvent.status === Keyboard.KeyStatus.KEY_UP) {
	        if (keyList.length === 0 || keyList.includes(keyEvent.pigletKey)) {
	          const precedingKeydownIndex = keyEvent.keydownIndex;
	          if (typeof precedingKeydownIndex !== 'undefined') {
	            const precedingKeydownEvent = this._circularBuffer[precedingKeydownIndex];
	            if (precedingKeydownEvent) {
	              const tDown = precedingKeydownEvent.timestamp;
	              const keyPress = new KeyPress(keyEvent.code, tDown, keyEvent.pigletKey);
	              keyPress.rt = tDown - this._clock.getLastResetTime();
	              keyPress.duration = keyEvent.timestamp - precedingKeydownEvent.timestamp;
	              keyPresses.push(keyPress);
	              if (clear) {
	                this._circularBuffer[precedingKeydownIndex] = null;
	              }
	            }
	          }
	          if (clear) {
	            this._circularBuffer[i] = null;
	          }
	        }
	      }
	    } while (i !== this._bufferIndex);
	    if (!waitRelease) {
	      for (const unmatchedKeyDownIndex of this._unmatchedKeydownMap.values()) {
	        const keyEvent = this._circularBuffer[unmatchedKeyDownIndex];
	        if (keyEvent) {
	          if (keyList.length === 0 || keyList.includes(keyEvent.pigletKey)) {
	            const tDown = keyEvent.timestamp;
	            const keyPress = new KeyPress(keyEvent.code, tDown, keyEvent.pigletKey);
	            keyPress.rt = tDown - this._clock.getLastResetTime();
	            keyPresses.push(keyPress);
	            if (clear) {
	              this._unmatchedKeydownMap.delete(keyEvent.code);
	              this._circularBuffer[unmatchedKeyDownIndex] = null;
	            }
	          }
	        }
	      }
	    }
	    if (clear && keyList.length === 0) {
	      this.clearEvents();
	    }
	    return keyPresses;
	  }
	  clearEvents() {
	    this._circularBuffer = new Array(this._bufferSize);
	    this._bufferLength = 0;
	    this._bufferIndex = -1;
	    this._previousKeydownKey = undefined;
	    this._unmatchedKeydownMap = new Map();
	  }
	  static includes(keypressList, keyName) {
	    if (!Array.isArray(keypressList)) {
	      return false;
	    }
	    const value = keypressList.find(keypress => keypress.name === keyName);
	    return typeof value !== 'undefined';
	  }
	  _addKeyListeners() {
	    this._previousKeydownKey = undefined;
	    const self = this;
	    window.addEventListener("keydown", event =>
	    {
	      if (event.repeat) {
	        return;
	      }
	      const timestamp = Clock_js.MonotonicClock.getReferenceTime();
	      if (this._status !== PsychoJS.Status.STARTED) {
	        return;
	      }
	      self._previousKeydownKey = event.key;
	      let code = event.code;
	      if (typeof code === 'undefined') {
	        code = EventManager.keycode2w3c(event.keyCode);
	      }
	      let pigletKey = EventManager.w3c2pyglet(code);
	      self._bufferIndex = (self._bufferIndex + 1) % self._bufferSize;
	      self._bufferLength = Math.min(self._bufferLength + 1, self._bufferSize);
	      self._circularBuffer[self._bufferIndex] = {
	        code,
	        key: event.key,
	        pigletKey,
	        status: Keyboard.KeyStatus.KEY_DOWN,
	        timestamp
	      };
	      self._unmatchedKeydownMap.set(event.code, self._bufferIndex);
	      self._psychoJS.logger.trace('keydown: ', event.key);
	      event.stopPropagation();
	    });
	    window.addEventListener("keyup", event =>
	    {
	      const timestamp = Clock_js.MonotonicClock.getReferenceTime();
	      if (this._status !== PsychoJS.Status.STARTED) {
	        return;
	      }
	      self._previousKeydownKey = undefined;
	      let code = event.code;
	      if (typeof code === 'undefined') {
	        code = EventManager.keycode2w3c(event.keyCode);
	      }
	      let pigletKey = EventManager.w3c2pyglet(code);
	      self._bufferIndex = (self._bufferIndex + 1) % self._bufferSize;
	      self._bufferLength = Math.min(self._bufferLength + 1, self._bufferSize);
	      self._circularBuffer[self._bufferIndex] = {
	        code,
	        key: event.key,
	        pigletKey,
	        status: Keyboard.KeyStatus.KEY_UP,
	        timestamp
	      };
	      const correspondingKeydownIndex = self._unmatchedKeydownMap.get(event.code);
	      if (typeof correspondingKeydownIndex !== 'undefined') {
	        self._circularBuffer[self._bufferIndex].keydownIndex = correspondingKeydownIndex;
	        self._unmatchedKeydownMap.delete(event.code);
	      }
	      self._psychoJS.logger.trace('keyup: ', event.key);
	      event.stopPropagation();
	    });
	  }
	}
	Keyboard.KeyStatus = {
	  KEY_DOWN: Symbol.for('KEY_DOWN'),
	  KEY_UP: Symbol.for('KEY_UP')
	};

	/**
	 * Base class for all stimuli.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class MinimalStim extends PsychObject_js.PsychObject {
	  constructor({
	    name,
	    win,
	    autoDraw = false,
	    autoLog = win.autoLog
	  } = {}) {
	    super(win._psychoJS, name);
	    this._pixi = undefined;
	    this._addAttributes(MinimalStim, win, autoDraw, autoLog);
	    this._needUpdate = false;
	    this.status = PsychoJS.Status.NOT_STARTED;
	  }
	  setAutoDraw(autoDraw, log = false) {
	    let response = {
	      origin: 'MinimalStim.setAutoDraw',
	      context: 'when setting the autoDraw attribute of stimulus: ' + this._name
	    };
	    this._setAttribute('autoDraw', autoDraw, log);
	    const index = this.win._drawList.indexOf(this);
	    if (this._autoDraw) {
	      if (this.win) {
	        if (index < 0) {
	          this._updateIfNeeded();
	          if (typeof this._pixi === 'undefined') {
	            this.psychoJS.logger.warn('the Pixi.js representation of this stimulus is undefined.');
	          }
	          else {
	              this.win._rootContainer.addChild(this._pixi);
	              this.win._drawList.push(this);
	            }
	        } else {
	          if (this._needUpdate && typeof this._pixi !== 'undefined') {
	            this.win._rootContainer.removeChild(this._pixi);
	            this._updateIfNeeded();
	            this.win._rootContainer.addChild(this._pixi);
	          }
	        }
	      }
	      this.status = PsychoJS.Status.STARTED;
	    }
	    else {
	        if (this.win) {
	          if (index >= 0) {
	            this.win._drawList.splice(index, 1);
	            if (typeof this._pixi !== 'undefined') {
	              this.win._rootContainer.removeChild(this._pixi);
	            }
	          }
	        }
	        this.status = PsychoJS.Status.STOPPED;
	      }
	  }
	  draw() {
	    this._updateIfNeeded();
	    if (this.win && this.win._drawList.indexOf(this) < 0 && typeof this._pixi !== 'undefined') {
	      this.win._container.addChild(this._pixi);
	      this.win._drawList.push(this);
	    }
	  }
	  contains(object, units) {
	    throw {
	      origin: 'MinimalStim.contains',
	      context: `when determining whether stimulus: ${this._name} contains object: ${util.toString(object)}`,
	      error: 'this method is abstract and should not be called.'
	    };
	  }
	  _updateIfNeeded() {
	    throw {
	      origin: 'MinimalStim._updateIfNeeded',
	      context: 'when updating stimulus: ' + this._name,
	      error: 'this method is abstract and should not be called.'
	    };
	  }
	}

	/**
	 * Manager responsible for the interactions between the experiment's stimuli and the mouse.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class Mouse extends PsychObject_js.PsychObject {
	  constructor({
	    name,
	    win,
	    autoLog = true
	  } = {}) {
	    super(win._psychoJS, name);
	    this._lastPos = undefined;
	    this._prevPos = undefined;
	    this._movedistance = 0.0;
	    const units = win.units;
	    const visible = 1;
	    this._addAttributes(Mouse, win, units, visible, autoLog);
	    this.status = PsychoJS.Status.NOT_STARTED;
	  }
	  getPos() {
	    const mouseInfo = this.psychoJS.eventManager.getMouseInfo();
	    let pos_px = mouseInfo.pos.slice();
	    pos_px[0] = pos_px[0] - this.win.size[0] / 2;
	    pos_px[1] = this.win.size[1] / 2 - pos_px[1];
	    this._lastPos = util$1.to_win(pos_px, 'pix', this._win);
	    return this._lastPos;
	  }
	  getRel() {
	    if (typeof this._lastPos === 'undefined') {
	      return this.getPos();
	    } else {
	      const lastPos = this._lastPos;
	      const pos = this.getPos();
	      return [-lastPos[0] + pos[0], -lastPos[1] + pos[1]];
	    }
	  }
	  getWheelRel() {
	    const mouseInfo = this.psychoJS.eventManager.getMouseInfo();
	    const wheelRel_px = mouseInfo.wheelRel.slice();
	    const wheelRel = util$1.to_win(wheelRel_px, 'pix', this._win);
	    mouseInfo.wheelRel = [0, 0];
	    return wheelRel;
	  }
	  getPressed(getTime = false) {
	    const buttonPressed = this.psychoJS.eventManager.getMouseInfo().buttons.pressed.slice();
	    if (!getTime) {
	      return buttonPressed;
	    } else {
	      const buttonTimes = this.psychoJS.eventManager.getMouseInfo().buttons.times.slice();
	      return [buttonPressed, buttonTimes];
	    }
	  }
	  mouseMoved(distance, reset = false) {
	    if (typeof this._lastPos === 'undefined') {
	      this.getPos();
	    }
	    this._prevPos = this._lastPos.slice();
	    this.getPos();
	    if (typeof reset === 'boolean' && reset == false) {
	      if (typeof distance === 'undefined') {
	        return this._prevPos[0] != this._lastPos[0] || this._prevPos[1] != this._lastPos[1];
	      } else {
	        if (typeof distance === 'number') {
	          this._movedistance = Math.sqrt((this._prevPos[0] - this._lastPos[0]) * (this._prevPos[0] - this._lastPos[0]) + (this._prevPos[1] - this._lastPos[1]) * (this._prevPos[1] - this._lastPos[1]));
	          return this._movedistance > distance;
	        }
	        if (this._prevPos[0] + distance[0] - this._lastPos[0] > 0.0) {
	          return true;
	        }
	        if (this._prevPos[1] + distance[1] - this._lastPos[0] > 0.0) {
	          return true;
	        }
	        return false;
	      }
	    } else if (typeof reset === 'boolean' && reset == true) {
	      this.psychoJS.eventManager.getMouseInfo().moveClock.reset();
	      return false;
	    } else if (reset === 'here') {
	      this._prevPos = this._lastPos.clone();
	      return false;
	    } else if (reset instanceof Array) {
	      this._prevPos = reset.slice();
	      if (!distance) {
	        return false;
	      }
	      else {
	          if (typeof distance === 'number') {
	            this._movedistance = Math.sqrt((this._prevPos[0] - this._lastPos[0]) * (this._prevPos[0] - this._lastPos[0]) + (this._prevPos[1] - this._lastPos[1]) * (this._prevPos[1] - this._lastPos[1]));
	            return this._movedistance > distance;
	          }
	          if (Math.abs(this._lastPos[0] - this._prevPos[0]) > distance[0]) {
	            return true;
	          }
	          if (Math.abs(this._lastPos[1] - this._prevPos[1]) > distance[1]) {
	            return true;
	          }
	          return false;
	        }
	    } else {
	      return false;
	    }
	  }
	  mouseMoveTime() {
	    return this.psychoJS.eventManager.getMouseInfo().moveClock.getTime();
	  }
	  clickReset(buttons = [0, 1, 2]) {
	    const mouseInfo = this.psychoJS.eventManager.getMouseInfo();
	    for (const b of buttons) {
	      mouseInfo.buttons.clocks[b].reset();
	      mouseInfo.buttons.times[b] = 0.0;
	    }
	  }
	}

	/**
	 * Mixin implementing various unit-handling measurement methods.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	let WindowMixin = superclass => class extends superclass {
	  constructor(args) {
	    super(args);
	  }
	  setUnits(units = this.win.units, log = false) {
	    this._setAttribute('units', units, log);
	  }
	  _getLengthPix(length) {
	    let response = {
	      origin: 'WindowMixin._getLengthPix',
	      context: 'when converting a length from stimulus unit to pixel units'
	    };
	    if (this._units === 'pix') {
	      return length;
	    } else if (typeof this._units === 'undefined' || this._units === 'norm') {
	      var winSize = this.win.size;
	      return length * winSize[1] / 2;
	    } else if (this._units === 'height') {
	      const minSize = Math.min(this.win.size[0], this.win.size[1]);
	      return length * minSize;
	    } else {
	      throw Object.assign(response, {
	        error: 'unable to deal with unit: ' + this._units
	      });
	    }
	  }
	  _getLengthUnits(length_px) {
	    let response = {
	      origin: 'WindowMixin._getLengthUnits',
	      context: 'when converting a length from pixel unit to stimulus units'
	    };
	    if (this._units === 'pix') {
	      return length_px;
	    } else if (typeof this._units === 'undefined' || this._units === 'norm') {
	      const winSize = this.win.size;
	      return length_px / (winSize[1] / 2);
	    } else if (this._units === 'height') {
	      const minSize = Math.min(this.win.size[0], this.win.size[1]);
	      return length_px / minSize;
	    } else {
	      throw Object.assign(response, {
	        error: 'unable to deal with unit: ' + this._units
	      });
	    }
	  }
	  _getHorLengthPix(length) {
	    let response = {
	      origin: 'WindowMixin._getHorLengthPix',
	      context: 'when converting a length from pixel unit to stimulus units'
	    };
	    if (this._units === 'pix') {
	      return length;
	    } else if (typeof this._units === 'undefined' || this._units === 'norm') {
	      var winSize = this.win.size;
	      return length * winSize[0] / 2;
	    } else if (this._units === 'height') {
	      const minSize = Math.min(this.win.size[0], this.win.size[1]);
	      return length * minSize;
	    } else {
	      throw Object.assign(response, {
	        error: 'unable to deal with unit: ' + this._units
	      });
	    }
	  }
	  _getVerLengthPix(length) {
	    let response = {
	      origin: 'WindowMixin._getVerLengthPix',
	      context: 'when converting a length from pixel unit to stimulus units'
	    };
	    if (this._units === 'pix') {
	      return length;
	    } else if (typeof this._units === 'undefined' || this._units === 'norm') {
	      var winSize = this.win.size;
	      return length * winSize[1] / 2;
	    } else if (this._units === 'height') {
	      const minSize = Math.min(this.win.size[0], this.win.size[1]);
	      return length * minSize;
	    } else {
	      throw Object.assign(response, {
	        error: 'unable to deal with unit: ' + this._units
	      });
	    }
	  }
	};

	exports.BuilderKeyResponse = BuilderKeyResponse;
	exports.EventManager = EventManager;
	exports.GUI = GUI;
	exports.KeyPress = KeyPress;
	exports.Keyboard = Keyboard;
	exports.Logger = Logger;
	exports.MinimalStim = MinimalStim;
	exports.Mouse = Mouse;
	exports.PsychoJS = PsychoJS;
	exports.ServerManager = ServerManager;
	exports.Window = Window;
	exports.WindowMixin = WindowMixin;

	return exports;

}({}, util, util, util, util, data, util));
var visual = (function (exports, MinimalStim_js, WindowMixin_js, util, Color_js, ColorMixin_js, PsychoJS_js, Clock_js) {
	'use strict';

	/**
	 * Base class for all visual stimuli.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class VisualStim extends util.mix(MinimalStim_js.MinimalStim).with(WindowMixin_js.WindowMixin) {
	  constructor({
	    name,
	    win,
	    units,
	    ori = 0.0,
	    opacity = 1.0,
	    pos = [0, 0],
	    size,
	    autoDraw,
	    autoLog
	  } = {}) {
	    super({
	      win,
	      name,
	      autoDraw,
	      autoLog
	    });
	    this._addAttributes(VisualStim, units, ori, opacity, pos, size);
	    this._needUpdate = true;
	  }
	  refresh() {
	    this._needUpdate = true;
	  }
	  setSize(size, log = false) {
	    if (typeof size !== 'undefined') {
	      size = util.toNumerical(size);
	      if (!Array.isArray(size)) {
	        size = [size, size];
	      }
	    }
	    this._setAttribute('size', size, log);
	    this._needUpdate = true;
	  }
	  setOri(ori, log = false) {
	    this._setAttribute('ori', ori, log);
	    let radians = ori * 0.017453292519943295;
	    this._rotationMatrix = [[Math.cos(radians), -Math.sin(radians)], [Math.sin(radians), Math.cos(radians)]];
	    this._needUpdate = true;
	  }
	  setPos(pos, log = false) {
	    this._setAttribute('pos', util.toNumerical(pos), log);
	    this._needUpdate = true;
	  }
	  setOpacity(opacity, log = false) {
	    this._setAttribute('opacity', opacity, log);
	    this._needUpdate = true;
	  }
	}

	/**
	 * Image Stimulus.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class ImageStim extends util.mix(VisualStim).with(ColorMixin_js.ColorMixin) {
	  constructor({
	    name,
	    win,
	    image,
	    mask,
	    pos,
	    units,
	    ori,
	    size,
	    color = new Color_js.Color('white'),
	    opacity = 1.0,
	    contrast = 1.0,
	    texRes = 128,
	    depth = 0,
	    interpolate = false,
	    flipHoriz = false,
	    flipVert = false,
	    autoDraw,
	    autoLog
	  } = {}) {
	    super({
	      name,
	      win,
	      units,
	      ori,
	      opacity,
	      pos,
	      size,
	      autoDraw,
	      autoLog
	    });
	    this.psychoJS.logger.debug('create a new ImageStim with name: ', name);
	    this._addAttributes(ImageStim, image, mask, color, contrast, texRes, interpolate, depth, flipHoriz, flipVert);
	    if (this._autoLog) {
	      this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
	    }
	  }
	  setImage(image, log = false) {
	    const response = {
	      origin: 'ImageStim.setImage',
	      context: 'when setting the image of ImageStim: ' + this._name
	    };
	    try {
	      if (typeof image === 'undefined') {
	        this.psychoJS.logger.warn('setting the image of ImageStim: ' + this._name + ' with argument: undefined.');
	        this.psychoJS.logger.debug('set the image of ImageStim: ' + this._name + ' as: undefined');
	      } else {
	        if (typeof image === 'string') {
	          image = this.psychoJS.serverManager.getResource(image);
	        }
	        if (!(image instanceof HTMLImageElement)) {
	          throw 'the argument: ' + image.toString() + ' is not an image" }';
	        }
	        this.psychoJS.logger.debug('set the image of ImageStim: ' + this._name + ' as: src= ' + image.src + ', size= ' + image.width + 'x' + image.height);
	      }
	      this._setAttribute('image', image, log);
	      this._needUpdate = true;
	    } catch (error) {
	      throw Object.assign(response, {
	        error
	      });
	    }
	  }
	  setMask(mask, log = false) {
	    const response = {
	      origin: 'ImageStim.setMask',
	      context: 'when setting the mask of ImageStim: ' + this._name
	    };
	    try {
	      if (typeof mask === 'undefined') {
	        this.psychoJS.logger.warn('setting the mask of ImageStim: ' + this._name + ' with argument: undefined.');
	        this.psychoJS.logger.debug('set the mask of ImageStim: ' + this._name + ' as: undefined');
	      } else {
	        if (typeof mask === 'string') {
	          mask = this.psychoJS.serverManager.getResource(mask);
	        }
	        if (!(mask instanceof HTMLImageElement)) {
	          throw 'the argument: ' + mask.toString() + ' is not an image" }';
	        }
	        this.psychoJS.logger.debug('set the mask of ImageStim: ' + this._name + ' as: src= ' + mask.src + ', size= ' + mask.width + 'x' + mask.height);
	      }
	      this._setAttribute('mask', mask, log);
	      this._needUpdate = true;
	    } catch (error) {
	      throw Object.assign(response, {
	        error
	      });
	    }
	  }
	  setFlipVert(flipVert, log = false) {
	    this._setAttribute('flipVert', flipVert, log);
	    this._needUpdate = true;
	  }
	  setFlipHoriz(flipHoriz, log = false) {
	    this._setAttribute('flipHoriz', flipHoriz, log);
	    this._needUpdate = true;
	  }
	  contains(object, units) {
	    if (typeof this._image === 'undefined') {
	      return false;
	    }
	    let objectPos_px = util.getPositionFromObject(object, units);
	    if (typeof objectPos_px === 'undefined') {
	      throw {
	        origin: 'ImageStim.contains',
	        context: 'when determining whether ImageStim: ' + this._name + ' contains object: ' + util.toString(object),
	        error: 'unable to determine the position of the object'
	      };
	    }
	    let pos_px = util.to_px(this.pos, this.units, this._win);
	    const displaySize = this._getDisplaySize();
	    const size_px = util.to_px(displaySize, this.units, this._win);
	    const polygon_px = [[pos_px[0] - size_px[0] / 2, pos_px[1] - size_px[1] / 2], [pos_px[0] + size_px[0] / 2, pos_px[1] - size_px[1] / 2], [pos_px[0] + size_px[0] / 2, pos_px[1] + size_px[1] / 2], [pos_px[0] - size_px[0] / 2, pos_px[1] + size_px[1] / 2]];
	    return util.IsPointInsidePolygon(objectPos_px, polygon_px);
	  }
	  _updateIfNeeded() {
	    if (!this._needUpdate) {
	      return;
	    }
	    this._needUpdate = false;
	    this._pixi = undefined;
	    if (typeof this._image === 'undefined') {
	      return;
	    }
	    this._texture = new PIXI.Texture(new PIXI.BaseTexture(this._image));
	    this._pixi = new PIXI.Sprite(this._texture);
	    this._pixi.zOrder = this.depth;
	    if (typeof this._mask !== 'undefined') {
	      this._maskTexture = new PIXI.Texture(new PIXI.BaseTexture(this._mask));
	      this._pixi.mask = new PIXI.Sprite(this._maskTexture);
	      this._pixi.mask.anchor.x = 0.5;
	      this._pixi.mask.anchor.y = 0.5;
	      this._pixi.addChild(this._pixi.mask);
	    }
	    if (this._texture.width === 0) {
	      this._needUpdate = true;
	      return;
	    }
	    this._pixi.alpha = this.opacity;
	    const displaySize = this._getDisplaySize();
	    const size_px = util.to_px(displaySize, this.units, this.win);
	    var scaleX = size_px[0] / this._texture.width;
	    var scaleY = size_px[1] / this._texture.height;
	    this._pixi.scale.x = this.flipHoriz ? -scaleX : scaleX;
	    this._pixi.scale.y = this.flipVert ? scaleY : -scaleY;
	    this._pixi.position = util.to_pixiPoint(this.pos, this.units, this.win);
	    this._pixi.rotation = this.ori * Math.PI / 180;
	    this._pixi.anchor.x = 0.5;
	    this._pixi.anchor.y = 0.5;
	  }
	  _getDisplaySize() {
	    let displaySize = this.size;
	    if (typeof displaySize === 'undefined') {
	      const textureSize = [this._texture.width, this._texture.height];
	      displaySize = util.to_unit(textureSize, 'pix', this.win, this.units);
	    }
	    return displaySize;
	  }
	}

	/**
	 * Movie Stimulus.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class MovieStim extends VisualStim {
	  constructor({
	    name,
	    win,
	    movie,
	    pos,
	    units,
	    ori,
	    size,
	    color = new Color_js.Color('white'),
	    opacity = 1.0,
	    contrast = 1.0,
	    interpolate = false,
	    flipHoriz = false,
	    flipVert = false,
	    loop = false,
	    volume = 1.0,
	    noAudio = false,
	    autoPlay = true,
	    autoDraw,
	    autoLog
	  } = {}) {
	    super({
	      name,
	      win,
	      units,
	      ori,
	      opacity,
	      pos,
	      size,
	      autoDraw,
	      autoLog
	    });
	    this.psychoJS.logger.debug('create a new MovieStim with name: ', name);
	    this._addAttributes(MovieStim, movie, color, contrast, interpolate, flipHoriz, flipVert, loop, volume, noAudio, autoPlay);
	    const videoElement = document.createElement('video');
	    this._hasFastSeek = typeof videoElement.fastSeek === 'function';
	    if (this._autoLog) {
	      this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
	    }
	  }
	  setMovie(movie, log = false) {
	    const response = {
	      origin: 'MovieStim.setMovie',
	      context: 'when setting the movie of MovieStim: ' + this._name
	    };
	    try {
	      if (typeof movie === 'undefined') {
	        this.psychoJS.logger.warn('setting the movie of MovieStim: ' + this._name + ' with argument: undefined.');
	        this.psychoJS.logger.debug('set the movie of MovieStim: ' + this._name + ' as: undefined');
	      } else {
	        if (typeof movie === 'string') {
	          movie = this.psychoJS.serverManager.getResource(movie);
	        }
	        if (!(movie instanceof HTMLVideoElement)) {
	          throw 'the argument: ' + movie.toString() + ' is not a video" }';
	        }
	        this.psychoJS.logger.debug(`set the movie of MovieStim: ${this._name} as: src= ${movie.src}, size= ${movie.videoWidth}x${movie.videoHeight}, duration= ${movie.duration}s`);
	      }
	      this._setAttribute('movie', movie, log);
	      this._movie.onended = () => {
	        this.status = PsychoJS_js.PsychoJS.Status.FINISHED;
	      };
	      this._needUpdate = true;
	    } catch (error) {
	      throw Object.assign(response, {
	        error
	      });
	    }
	  }
	  setVolume(volume, log = false) {
	    this._setAttribute('volume', volume, log);
	    this._needUpdate = true;
	  }
	  setNoAudio(noAudio, log = false) {
	    this._setAttribute('noAudio', noAudio, log);
	    this._needUpdate = true;
	  }
	  setFlipVert(flipVert, log = false) {
	    this._setAttribute('flipVert', flipVert, log);
	    this._needUpdate = true;
	  }
	  setFlipHoriz(flipHoriz, log = false) {
	    this._setAttribute('flipHoriz', flipHoriz, log);
	    this._needUpdate = true;
	  }
	  reset(log = false) {
	    this.status = PsychoJS_js.PsychoJS.Status.NOT_STARTED;
	    this._movie.pause();
	    if (this._hasFastSeek) {
	      this._movie.fastSeek(0);
	    }
	  }
	  play(log = false) {
	    this.status = PsychoJS_js.PsychoJS.Status.STARTED;
	    this._movie.play();
	  }
	  pause(log = false) {
	    this.status = PsychoJS_js.PsychoJS.Status.STOPPED;
	    this._movie.pause();
	  }
	  stop(log = false) {
	    this.status = PsychoJS_js.PsychoJS.Status.STOPPED;
	    this._movie.pause();
	    if (this._hasFastSeek) {
	      this._movie.fastSeek(0);
	    }
	  }
	  seek(timePoint, log = false) {
	    if (timePoint < 0 || timePoint > this._movie.duration) {
	      throw {
	        origin: 'MovieStim.seek',
	        context: `when seeking to timepoint: ${timePoint} of MovieStim: ${this._name}`,
	        error: `the timepoint does not belong to [0, ${this._movie.duration}`
	      };
	    }
	    if (this._hasFastSeek) {
	      this._movie.fastSeek(timePoint);
	    }
	  }
	  contains(object, units) {
	    let objectPos_px = util.getPositionFromObject(object, units);
	    if (typeof objectPos_px === 'undefined') {
	      throw {
	        origin: 'MovieStim.contains',
	        context: `when determining whether MovieStim: ${this._name} contains object: ${util.toString(object)}`,
	        error: 'unable to determine the position of the object'
	      };
	    }
	    let pos_px = util.to_px(this.pos, this.units, this._win);
	    let size_px = util.to_px(this.size, this.units, this._win);
	    const polygon_px = [[pos_px[0] - size_px[0] / 2, pos_px[1] - size_px[1] / 2], [pos_px[0] + size_px[0] / 2, pos_px[1] - size_px[1] / 2], [pos_px[0] + size_px[0] / 2, pos_px[1] + size_px[1] / 2], [pos_px[0] - size_px[0] / 2, pos_px[1] + size_px[1] / 2]];
	    return util.IsPointInsidePolygon(objectPos_px, polygon_px);
	  }
	  _updateIfNeeded() {
	    if (!this._needUpdate) {
	      return;
	    }
	    this._needUpdate = false;
	    this._pixi = undefined;
	    if (typeof this._movie === 'undefined') {
	      return;
	    }
	    this._texture = PIXI.Texture.fromVideo(this._movie);
	    this._pixi = new PIXI.Sprite(this._texture);
	    if (this._texture.width === 0) {
	      this._needUpdate = true;
	      return;
	    }
	    this._movie.muted = this._noAudio;
	    this._movie.volume = this._volume;
	    this._texture.baseTexture.autoPlay = this.autoPlay;
	    this._movie.loop = this._loop;
	    this._pixi.alpha = this.opacity;
	    let stimSize = this.size;
	    if (typeof stimSize === 'undefined') {
	      const textureSize = [this._texture.width, this._texture.height];
	      stimSize = util.to_unit(textureSize, 'pix', this.win, this.units);
	    }
	    const size_px = util.to_px(stimSize, this.units, this.win);
	    const scaleX = size_px[0] / this._texture.width;
	    const scaleY = size_px[1] / this._texture.height;
	    this._pixi.scale.x = this.flipHoriz ? -scaleX : scaleX;
	    this._pixi.scale.y = this.flipVert ? scaleY : -scaleY;
	    this._pixi.position = util.to_pixiPoint(this.pos, this.units, this.win);
	    this._pixi.rotation = this.ori * Math.PI / 180;
	    this._pixi.anchor.x = 0.5;
	    this._pixi.anchor.y = 0.5;
	  }
	}

	/**
	 * Basic Shape Stimulus.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class ShapeStim extends util.mix(VisualStim).with(ColorMixin_js.ColorMixin) {
	  constructor({
	    name,
	    win,
	    lineWidth = 1.5,
	    lineColor = new Color_js.Color('white'),
	    fillColor,
	    opacity = 1.0,
	    vertices = [[-0.5, 0], [0, 0.5], [0.5, 0]],
	    closeShape = true,
	    pos = [0, 0],
	    size = 1.0,
	    ori = 0.0,
	    units,
	    contrast = 1.0,
	    depth = 0,
	    interpolate = true,
	    autoDraw,
	    autoLog
	  } = {}) {
	    super({
	      name,
	      win,
	      units,
	      ori,
	      opacity,
	      pos,
	      size,
	      autoDraw,
	      autoLog
	    });
	    this._pixiPolygon_px = undefined;
	    this._needVertexUpdate = true;
	    this._vertices_px = undefined;
	    this._addAttributes(ShapeStim, lineWidth, lineColor, fillColor, vertices, closeShape, contrast, depth, interpolate);
	  }
	  refresh() {
	    super.refresh();
	    this._needVertexUpdate = true;
	  }
	  setSize(size, log = false) {
	    super.setSize(size, log);
	    this._needVertexUpdate = true;
	  }
	  setLineWidth(lineWidth, log = false) {
	    this._setAttribute('lineWidth', lineWidth, log);
	    this._needUpdate = true;
	  }
	  setLineColor(lineColor, log = false) {
	    this._setAttribute('lineColor', lineColor, log);
	    this._needUpdate = true;
	  }
	  setFillColor(fillColor, log = false) {
	    this._setAttribute('fillColor', fillColor, log);
	    this._needUpdate = true;
	  }
	  setVertices(vertices, log = false) {
	    const response = {
	      origin: 'ShapeStim.setVertices',
	      context: 'when setting the vertices of ShapeStim: ' + this._name
	    };
	    this._psychoJS.logger.debug('set the vertices of ShapeStim:', this.name);
	    try {
	      if (typeof vertices === 'string') {
	        if (vertices in ShapeStim.KnownShapes) {
	          vertices = ShapeStim.KnownShapes[vertices];
	        } else {
	          throw 'unknown shape';
	        }
	      }
	      this._setAttribute('vertices', vertices, log);
	      this._needVertexUpdate = true;
	      this._needUpdate = true;
	    } catch (error) {
	      throw Object.assign(response, {
	        error: error
	      });
	    }
	  }
	  contains(object, units) {
	    this._psychoJS.logger.debug('test whether BaseShameStim:', this.name, 'contains object: ', 'name' in object ? object.name : object);
	    const objectPos_px = util.getPositionFromObject(object, units);
	    if (typeof objectPos_px === 'undefined') {
	      throw {
	        origin: 'ShapeStim.contains',
	        context: 'when determining whether BaseShameStim: ' + this._name + ' contains object: ' + util.toString(object),
	        error: 'unable to determine the position of the object'
	      };
	    }
	    const pos_px = util.to_px(this.pos, this.units, this.win);
	    const polygon_px = this._vertices_px.map(v => [v[0] + pos_px[0], v[1] + pos_px[1]]);
	    return util.IsPointInsidePolygon(objectPos_px, polygon_px);
	  }
	  _updateIfNeeded() {
	    if (!this._needUpdate) {
	      return;
	    }
	    this._needUpdate = false;
	    this._getPolygon();
	    this._pixi = undefined;
	    if (typeof this._pixiPolygon_px === 'undefined') {
	      return;
	    }
	    this._pixi = new PIXI.Graphics();
	    this._pixi.lineStyle(this._lineWidth, this._lineColor.int, this._opacity, 0.5);
	    if (typeof this._fillColor !== 'undefined') {
	      this._pixi.beginFill(this._fillColor.int, this._opacity);
	    }
	    this._pixi.drawPolygon(this._pixiPolygon_px);
	    if (typeof this._fillColor !== 'undefined') {
	      this._pixi.endFill();
	    }
	    this._pixi.position = util.to_pixiPoint(this.pos, this.units, this.win);
	    this._pixi.rotation = this.ori * Math.PI / 180.0;
	  }
	  _getPolygon()
	  {
	    if (!this._needVertexUpdate) {
	      return;
	    }
	    this._needVertexUpdate = false;
	    console.log('>>>>>>>>> CREATING PIXI POLYGON!!!!');
	    this._getVertices_px();
	    let coords_px = [];
	    for (const vertex_px of this._vertices_px) {
	      coords_px.push.apply(coords_px, vertex_px);
	    }
	    if (coords_px.length >= 6 && this._closeShape) {
	      const n = coords_px.length;
	      if (coords_px[0] !== coords_px[n - 2] || coords_px[1] !== coords_px[n - 1]) {
	        coords_px.push(coords_px[0]);
	        coords_px.push(coords_px[1]);
	      }
	    }
	    this._pixiPolygon_px = new PIXI.Polygon(coords_px);
	    return this._pixiPolygon_px;
	  }
	  _getVertices_px()
	  {
	    let flip = [1.0, 1.0];
	    if ('_flipHoriz' in this && this._flipHoriz) {
	      flip[0] = -1.0;
	    }
	    if ('_flipVert' in this && this._flipVert) {
	      flip[1] = -1.0;
	    }
	    this._vertices_px = this._vertices.map(v => util.to_px([v[0] * this._size[0] * flip[0], v[1] * this._size[1] * flip[1]], this._units, this._win));
	    return this._vertices_px;
	  }
	}
	ShapeStim.KnownShapes = {
	  cross: [[-0.1, +0.5],
	  [+0.1, +0.5], [+0.1, +0.1], [+0.5, +0.1],
	  [+0.5, -0.1], [+0.1, -0.1], [+0.1, -0.5],
	  [-0.1, -0.5], [-0.1, -0.1], [-0.5, -0.1],
	  [-0.5, +0.1], [-0.1, +0.1]],
	  star7: [[0.0, 0.5], [0.09, 0.18], [0.39, 0.31], [0.19, 0.04], [0.49, -0.11], [0.16, -0.12], [0.22, -0.45], [0.0, -0.2], [-0.22, -0.45], [-0.16, -0.12], [-0.49, -0.11], [-0.19, 0.04], [-0.39, 0.31], [-0.09, 0.18]]
	};

	/**
	 * Polygonal Stimulus.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class Polygon extends ShapeStim {
	  constructor({
	    name,
	    win,
	    lineWidth = 1.5,
	    lineColor = new Color_js.Color('white'),
	    fillColor,
	    opacity = 1.0,
	    edges = 3,
	    radius = 0.5,
	    pos = [0, 0],
	    size = 1.0,
	    ori = 0.0,
	    units,
	    contrast = 1.0,
	    depth = 0,
	    interpolate = true,
	    autoDraw,
	    autoLog
	  } = {}) {
	    super({
	      name,
	      win,
	      lineWidth,
	      lineColor,
	      fillColor,
	      opacity,
	      pos,
	      ori,
	      size,
	      units,
	      contrast,
	      depth,
	      interpolate,
	      autoDraw,
	      autoLog
	    });
	    this._psychoJS.logger.debug('create a new Polygon with name: ', name);
	    this._addAttributes(Polygon, edges, radius);
	    this._updateVertices();
	    if (this._autoLog) {
	      this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
	    }
	  }
	  setRadius(radius, log = false) {
	    this._psychoJS.logger.debug('set the radius of Polygon: ', this.name, 'to: ', radius);
	    this._setAttribute('radius', radius, log);
	    this._updateVertices();
	  }
	  setEdges(edges, log = false) {
	    this._psychoJS.logger.debug('set the edges of Polygon: ', this.name, 'to: ', edges);
	    this._setAttribute('edges', Math.round(edges), log);
	    this._updateVertices();
	  }
	  _updateVertices() {
	    this._psychoJS.logger.debug('update the vertices of Polygon: ', this.name);
	    const angle = 2.0 * Math.PI / this._edges;
	    const vertices = [];
	    for (let v = 0; v < this._edges; ++v) {
	      vertices.push([Math.sin(v * angle) * this._radius, Math.cos(v * angle) * this._radius]);
	    }
	    this.setVertices(vertices);
	  }
	}

	/**
	 * Rectangular Stimulus.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class Rect extends ShapeStim {
	  constructor({
	    name,
	    win,
	    lineWidth = 1.5,
	    lineColor = new Color_js.Color('white'),
	    fillColor,
	    opacity = 1.0,
	    width = 0.5,
	    height = 0.5,
	    pos = [0, 0],
	    size = 1.0,
	    ori = 0.0,
	    units,
	    contrast = 1.0,
	    depth = 0,
	    interpolate = true,
	    autoDraw,
	    autoLog
	  } = {}) {
	    super({
	      name,
	      win,
	      lineWidth,
	      lineColor,
	      fillColor,
	      opacity,
	      pos,
	      ori,
	      size,
	      units,
	      contrast,
	      depth,
	      interpolate,
	      autoDraw,
	      autoLog
	    });
	    this._psychoJS.logger.debug('create a new Rect with name: ', name);
	    this._addAttributes(Rect, width, height);
	    this._updateVertices();
	    if (this._autoLog) {
	      this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
	    }
	  }
	  setWidth(width, log = false) {
	    this._psychoJS.logger.debug('set the width of Rect: ', this.name, 'to: ', width);
	    this._setAttribute('width', width, log);
	    this._updateVertices();
	  }
	  setHeight(height, log = false) {
	    this._psychoJS.logger.debug('set the height of Rect: ', this.name, 'to: ', height);
	    this._setAttribute('height', height, log);
	    this._updateVertices();
	  }
	  _updateVertices() {
	    this._psychoJS.logger.debug('update the vertices of Rect: ', this.name);
	    const halfWidth = this._width / 2.0;
	    const halfHeight = this._height / 2.0;
	    this.setVertices([[-halfWidth, -halfHeight], [halfWidth, -halfHeight], [halfWidth, halfHeight], [-halfWidth, halfHeight]]);
	  }
	}

	/**
	 * Slider Stimulus.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class Slider extends util.mix(VisualStim).with(ColorMixin_js.ColorMixin) {
	  constructor({
	    name,
	    win,
	    pos,
	    size,
	    ori,
	    units = 'height',
	    color = new Color_js.Color('LightGray'),
	    contrast = 1.0,
	    opacity,
	    style = [Slider.Style.RATING],
	    ticks = [1, 2, 3, 4, 5],
	    labels = [],
	    labelHeight,
	    granularity = 0,
	    flip = false,
	    readOnly = false,
	    fontFamily = 'Helvetica',
	    bold = true,
	    italic = false,
	    fontSize,
	    autoDraw,
	    autoLog
	  } = {}) {
	    super({
	      name,
	      win,
	      units,
	      ori,
	      opacity,
	      pos,
	      size,
	      autoDraw,
	      autoLog
	    });
	    this._needMarkerUpdate = false;
	    this._addAttributes(Slider, ticks, labels, labelHeight, granularity, flip, color, contrast, fontFamily, bold, italic, fontSize, style, readOnly);
	    this._addAttribute('rating', undefined);
	    this._addAttribute('markerPos', undefined);
	    this._addAttribute('history', []);
	    this._addAttribute('lineAspectRatio', 0.01);
	    this._responseClock = new Clock_js.Clock();
	    this._isCategorical = this._ticks.length === 0;
	    if (this._autoLog) {
	      this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
	    }
	  }
	  refresh() {
	    super.refresh();
	    this._needVertexUpdate = true;
	  }
	  contains(object, units) {
	    let objectPos_px = util.getPositionFromObject(object, units);
	    if (typeof objectPos_px === 'undefined') {
	      throw {
	        origin: 'Slider.contains',
	        context: `when determining whether Slider: ${this._name} contains
			object: ${util.toString(object)}`,
	        error: 'unable to determine the position of the object'
	      };
	    }
	    return false;
	  }
	  reset() {
	    this.psychoJS.logger.debug('reset Slider: ', this._name);
	    this._markerPos = undefined;
	    this._history = [];
	    this._rating = undefined;
	    this._responseClock.reset();
	    this.status = PsychoJS_js.PsychoJS.Status.NOT_STARTED;
	    this._needMarkerUpdate = true;
	    this._needUpdate = true;
	    if (typeof this._marker !== 'undefined') {
	      this._marker.alpha = 0;
	    }
	  }
	  getRating() {
	    const historyLength = this._history.length;
	    if (historyLength > 0) {
	      return this._history[historyLength - 1]['rating'];
	    } else {
	      return undefined;
	    }
	  }
	  getRT() {
	    const historyLength = this._history.length;
	    if (historyLength > 0) {
	      return this._history[historyLength - 1]['responseTime'];
	    } else {
	      return undefined;
	    }
	  }
	  setFontSize(fontSize, log = false) {
	    if (typeof fontSize === 'undefined') {
	      fontSize = this._units === 'pix' ? 14 : 0.03;
	    }
	    const hasChanged = this._setAttribute('fontSize', fontSize, log);
	    if (hasChanged) {
	      this._needUpdate = true;
	      this._needVertexUpdate = true;
	    }
	  }
	  setBold(bold = true, log = false) {
	    const hasChanged = this._setAttribute('bold', bold, log);
	    if (hasChanged) {
	      this._fontWeight = bold ? 'bold' : 'normal';
	      this._needUpdate = true;
	      this._needVertexUpdate = true;
	    }
	  }
	  setItalic(italic = false, log = false) {
	    const hasChanged = this._setAttribute('italic', italic, log);
	    if (hasChanged) {
	      this._fontStyle = italic ? 'italic' : 'normal';
	      this._needUpdate = true;
	      this._needVertexUpdate = true;
	    }
	  }
	  setReadOnly(readOnly = true, log = false) {
	    const hasChanged = this._setAttribute('readOnly', readOnly, log);
	    if (hasChanged) {
	      if (readOnly) {
	        this._opacity /= 2.0;
	      } else {
	        this._opacity *= 2.0;
	      }
	      this._needUpdate = true;
	    }
	  }
	  setMarkerPos(displayedRating, log = false) {
	    const previousMarkerPos = this._markerPos;
	    this._markerPos = this._granularise(displayedRating);
	    if (previousMarkerPos !== this._markerPos) {
	      this._needMarkerUpdate = true;
	      this._needUpdate = true;
	    }
	  }
	  setRating(rating, log = false) {
	    rating = this._granularise(rating);
	    this._markerPos = rating;
	    if (this._isCategorical) {
	      rating = this._labels[Math.round(rating)];
	    }
	    this._setAttribute('rating', rating, log);
	  }
	  _recordRating(rating, responseTime = undefined, log = false) {
	    if (typeof responseTime === 'undefined') {
	      responseTime = this._responseClock.getTime();
	    }
	    this.setRating(rating, log);
	    this._history.push({
	      rating: this._rating,
	      responseTime
	    });
	    this.psychoJS.logger.debug('record a new rating: ', this._rating, 'with response time: ', responseTime, 'for Slider: ', this._name);
	    this._needMarkerUpdate = true;
	    this._needUpdate = true;
	  }
	  _updateIfNeeded() {
	    if (!this._needUpdate) {
	      return;
	    }
	    this._needUpdate = false;
	    this._buildSlider();
	    this._updateMarker();
	    this._pixi.scale.x = this._flipHoriz ? -1 : 1;
	    this._pixi.scale.y = this._flipVert ? 1 : -1;
	    this._pixi.rotation = this._ori * Math.PI / 180;
	    this._pixi.position = util.to_pixiPoint(this.pos, this.units, this.win);
	    this._pixi.alpha = this._opacity;
	  }
	  _updateMarker() {
	    if (!this._needMarkerUpdate) {
	      return;
	    }
	    this._needMarkerUpdate = false;
	    if (typeof this._marker !== 'undefined') {
	      if (typeof this._markerPos !== 'undefined') {
	        const visibleMarkerPos = this._ratingToPos([this._markerPos]);
	        this._marker.position = util.to_pixiPoint(visibleMarkerPos[0], this.units, this.win);
	        this._marker.alpha = 1;
	      } else {
	        this._marker.alpha = 0;
	      }
	    }
	  }
	  _buildSlider() {
	    if (!this._needVertexUpdate) {
	      return;
	    }
	    this._needVertexUpdate = false;
	    this._applyStyle();
	    this._pixi = new PIXI.Container();
	    this._pixi.interactive = true;
	    this._body = new PIXI.Graphics();
	    this._body.interactive = true;
	    this._pixi.addChild(this._body);
	    const barSize_px = util.to_px(this._barSize, this._units, this._win).map(v => Math.max(1, v));
	    if (this._barLineWidth_px > 0) {
	      this._body.lineStyle(this._barLineWidth_px, this._barLineColor.int, this._opacity, 0.5);
	      if (typeof this._barFillColor !== 'undefined') {
	        this._body.beginFill(this._barFillColor.int, this._opacity);
	      }
	      this._body.drawRect(-barSize_px[0] / 2, -barSize_px[1] / 2, barSize_px[0], barSize_px[1]);
	      if (typeof this._barFillColor !== 'undefined') {
	        this._body.endFill();
	      }
	    }
	    if (this._isCategorical) {
	      this._ticks = [...Array(this._labels.length)].map((_, i) => i);
	      this._granularity = 1.0;
	    }
	    const tickPositions = this._ratingToPos(this._ticks);
	    const tickPositions_px = tickPositions.map(p => util.to_px(p, this._units, this._win));
	    this._body.lineStyle(this._barLineWidth_px * 2, this._tickColor.int, this._opacity, 0.5);
	    const tickSize_px = util.to_px(this._tickSize, this._units, this._win);
	    for (let tickPosition_px of tickPositions_px) {
	      if (this._tickType === Slider.Shape.LINE) {
	        this._body.moveTo(tickPosition_px[0] - tickSize_px[0] / 2, tickPosition_px[1] - tickSize_px[1] / 2);
	        this._body.lineTo(tickPosition_px[0] + tickSize_px[0] / 2, tickPosition_px[1] + tickSize_px[1] / 2);
	      } else if (this._tickType === Slider.Shape.DISC) {
	        this._body.beginFill(this._tickColor.int, this._opacity);
	        this._body.drawCircle(tickPosition_px[0], tickPosition_px[1], Math.max(tickSize_px[0], tickSize_px[1]));
	        this._body.endFill();
	      }
	    }
	    const eventCaptureRectangle = new PIXI.Graphics();
	    eventCaptureRectangle.beginFill(0, 0);
	    eventCaptureRectangle.drawRect(-barSize_px[0] / 2 - tickSize_px[0] / 2, -barSize_px[1] / 2 - tickSize_px[1] / 2, barSize_px[0] + tickSize_px[0], barSize_px[1] + tickSize_px[1]);
	    eventCaptureRectangle.endFill();
	    this._pixi.addChild(eventCaptureRectangle);
	    const labelPositions_px = [...Array(this._labels.length)].map((_, i) => tickPositions_px[Math.round(i / (this._labels.length - 1) * (this._ticks.length - 1))]);
	    const fontSize_px = util.to_px([this._fontSize, this._fontSize], this._units, this._win);
	    for (let l = 0; l < labelPositions_px.length; ++l) {
	      const labelText = new PIXI.Text(this._labels[l], {
	        fontFamily: this._fontFamily,
	        fontWeight: this._fontWeight,
	        fontStyle: this._fontStyle,
	        fontSize: Math.round(fontSize_px[0]),
	        fill: this._labelColor.hex,
	        align: this._labelAlign
	      });
	      const labelBounds = labelText.getBounds(true);
	      labelText.position.x = labelPositions_px[l][0];
	      labelText.position.y = labelPositions_px[l][1];
	      labelText.anchor.x = this._labelAnchor.x;
	      labelText.anchor.y = this._labelAnchor.y;
	      if (this._isHorizontal()) {
	        if (this._flip) {
	          labelText.position.y -= labelBounds.height + tickSize_px[1];
	        } else {
	          labelText.position.y += tickSize_px[1];
	        }
	      } else {
	        if (this._flip) {
	          labelText.position.x += tickSize_px[0];
	        } else if (this._labelOri === 0) {
	          labelText.position.x -= labelBounds.width + tickSize_px[0];
	        } else {
	          labelText.position.x -= tickSize_px[0];
	        }
	      }
	      labelText.rotation = (this._ori + this._labelOri) * Math.PI / 180;
	      labelText.alpha = this._opacity;
	      this._pixi.addChild(labelText);
	    }
	    const markerSize_px = Math.max(...util.to_px(this._markerSize, this._units, this._win));
	    this._marker = new PIXI.Graphics();
	    this._marker.alpha = 0;
	    this._marker.interactive = true;
	    this._pixi.addChild(this._marker);
	    if (this._markerType === Slider.Shape.DISC) {
	      this._marker.lineStyle(1, this._markerColor.int, this._opacity, 0.5);
	      this._marker.beginFill(this._markerColor.int, this._opacity);
	      this._marker.drawCircle(0, 0, markerSize_px / 2);
	      this._marker.endFill();
	    } else if (this._markerType === Slider.Shape.TRIANGLE) {
	      this._marker.lineStyle(1, this._markerColor.int, this._opacity, 0.5);
	      this._marker.beginFill(this._markerColor.int, this._opacity);
	      this._marker.moveTo(0, 0);
	      if (this._isHorizontal()) {
	        if (this._flip) {
	          this._marker.lineTo(markerSize_px / 2, markerSize_px / 2);
	          this._marker.lineTo(-markerSize_px / 2, markerSize_px / 2);
	        } else {
	          this._marker.lineTo(markerSize_px / 2, -markerSize_px / 2);
	          this._marker.lineTo(-markerSize_px / 2, -markerSize_px / 2);
	        }
	      } else {
	        if (this._flip) {
	          this._marker.lineTo(-markerSize_px / 2, markerSize_px / 2);
	          this._marker.lineTo(-markerSize_px / 2, -markerSize_px / 2);
	        } else {
	          this._marker.lineTo(markerSize_px / 2, markerSize_px / 2);
	          this._marker.lineTo(markerSize_px / 2, -markerSize_px / 2);
	        }
	      }
	      this._marker.endFill();
	    }
	    const self = this;
	    self._markerDragging = false;
	    this._marker.pointerdown = this._marker.mousedown = this._marker.touchstart = event => {
	      if (event.data.button === 0) {
	        self._markerDragging = true;
	      }
	      event.stopPropagation();
	    };
	    this._marker.pointerup = this._marker.mouseup = this._marker.touchend = event => {
	      if (self._markerDragging) {
	        self._markerDragging = false;
	        const mouseLocalPos_px = event.data.getLocalPosition(self._pixi);
	        const rating = self._posToRating([mouseLocalPos_px.x, mouseLocalPos_px.y]);
	        self._recordRating(rating);
	        event.stopPropagation();
	      }
	    };
	    this._marker.pointerupoutside = this._marker.mouseupoutside = this._marker.touchendoutside = event => {
	      if (self._markerDragging) {
	        const mouseLocalPos_px = event.data.getLocalPosition(self._pixi);
	        const rating = self._posToRating([mouseLocalPos_px.x, mouseLocalPos_px.y]);
	        self._recordRating(rating);
	        self._markerDragging = false;
	        event.stopPropagation();
	      }
	    };
	    this._marker.pointermove = event => {
	      if (self._markerDragging) {
	        const mouseLocalPos_px = event.data.getLocalPosition(self._pixi);
	        const rating = self._posToRating([mouseLocalPos_px.x, mouseLocalPos_px.y]);
	        self.setMarkerPos(rating);
	        event.stopPropagation();
	      }
	    };
	    this._pixi.pointerup = this._pixi.mouseup = this._pixi.touchend = event => {
	      const mouseLocalPos_px = event.data.getLocalPosition(self._body);
	      const rating = self._posToRating([mouseLocalPos_px.x, mouseLocalPos_px.y]);
	      self._recordRating(rating);
	      event.stopPropagation();
	    };
	  }
	  _applyStyle() {
	    if (this._isHorizontal()) {
	      this._barSize = [this._size[0], 0];
	      this._tickSize = [0, this._size[1]];
	      this._labelAnchor = new PIXI.Point(0.5, 0);
	    } else {
	      this._barSize = [0, this._size[1]];
	      this._tickSize = [this._size[0], 0];
	      this._labelAnchor = new PIXI.Point(0, 0.5);
	    }
	    this._barLineWidth_px = 1;
	    this._barLineColor = this._color;
	    this._barFillColor = undefined;
	    this._tickType = Slider.Shape.LINE;
	    this._tickColor = this._color;
	    this._markerColor = new Color_js.Color('red');
	    this._markerType = Slider.Shape.DISC;
	    this._markerSize = this._tickSize;
	    this._labelColor = this._color;
	    this._labelAlign = 'center';
	    this._labelOri = 0;
	    if (this._style.indexOf(Slider.Style.RATING) > -1) ;
	    if (this._style.indexOf(Slider.Style.TRIANGLE_MARKER) > -1) {
	      this._markerType = Slider.Shape.TRIANGLE;
	      this._markerSize = this._markerSize.map(s => s * 2);
	    }
	    if (this._style.indexOf(Slider.Style.SLIDER) > -1) {
	      this.psychoJS.logger.warn('"slider" style not implemented!');
	    }
	    if (this._style.indexOf(Slider.Style.WHITE_ON_BLACK) > -1) {
	      this._barLineColor = new Color_js.Color('black');
	      this._tickColor = new Color_js.Color('black');
	      this._markerColor = new Color_js.Color('white');
	      this._labelColor = new Color_js.Color('black');
	    }
	    if (this._style.indexOf(Slider.Style.LABELS45) > -1) {
	      if (this._flip) {
	        this._labelAnchor = new PIXI.Point(0, 0.5);
	        this._labelAlign = 'left';
	      } else {
	        this._labelAnchor = new PIXI.Point(1, 0.5);
	        this._labelAlign = 'right';
	      }
	      this._labelOri = -45;
	    }
	    if (this._style.indexOf(Slider.Style.RADIO) > -1) {
	      this._barLineWidth_px = 0;
	      this._tickType = Slider.Shape.DISC;
	      this._markerColor = this.getContrastedColor(this._tickColor, 0.5);
	      this._markerSize.x *= 0.7;
	      this._markerSize.y *= 0.7;
	    }
	  }
	  _ratingToPos(ratings) {
	    const range = this._ticks[this._ticks.length - 1] - this._ticks[0];
	    if (this._isHorizontal()) {
	      return ratings.map(v => [((v - this._ticks[0]) / range - 0.5) * this._size[0], 0]);
	    } else {
	      return ratings.map(v => [0, (1.0 - (v - this._ticks[0]) / range - 0.5) * this._size[1]]);
	    }
	  }
	  _posToRating(pos_px) {
	    const range = this._ticks[this._ticks.length - 1] - this._ticks[0];
	    const size_px = util.to_px(this._size, this._units, this._win);
	    if (this._isHorizontal()) {
	      return (pos_px[0] / size_px[0] + 0.5) * range + this._ticks[0];
	    }
	    else {
	        return (1.0 - (pos_px[1] / size_px[1] + 0.5)) * range + this._ticks[0];
	      }
	  }
	  _isHorizontal() {
	    return this._size[0] > this._size[1];
	  }
	  _granularise(rating) {
	    if (typeof rating === 'undefined') {
	      return undefined;
	    }
	    if (this._granularity > 0) {
	      rating = Math.round(rating / this._granularity) * this._granularity;
	    }
	    rating = Math.min(Math.max(this._ticks[0], rating), this._ticks[this._ticks.length - 1]);
	    return rating;
	  }
	}
	Slider.Shape = {
	  DISC: Symbol.for('DISC'),
	  TRIANGLE: Symbol.for('TRIANGLE'),
	  LINE: Symbol.for('LINE'),
	  BOX: Symbol.for('BOX')
	};
	Slider.Style = {
	  RATING: Symbol.for('RATING'),
	  TRIANGLE_MARKER: Symbol.for('TRIANGLE_MARKER'),
	  SLIDER: Symbol.for('SLIDER'),
	  WHITE_ON_BLACK: Symbol.for('WHITE_ON_BLACK'),
	  LABELS45: Symbol.for('LABELS45'),
	  RADIO: Symbol.for('RADIO')
	};

	/**
	 * Text Stimulus.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class TextStim extends util.mix(VisualStim).with(ColorMixin_js.ColorMixin) {
	  constructor({
	    name,
	    win,
	    text = 'Hello World',
	    font = 'Arial',
	    pos,
	    color = new Color_js.Color('white'),
	    opacity,
	    contrast = 1.0,
	    units,
	    ori,
	    height = 0.1,
	    bold = false,
	    italic = false,
	    alignHoriz = 'left',
	    alignVert = 'center',
	    wrapWidth,
	    flipHoriz = false,
	    flipVert = false,
	    autoDraw,
	    autoLog
	  } = {}) {
	    super({
	      name,
	      win,
	      units,
	      ori,
	      opacity,
	      pos,
	      autoDraw,
	      autoLog
	    });
	    this._addAttributes(TextStim, text, font, color, contrast, height, bold, italic, alignHoriz, alignVert, wrapWidth, flipHoriz, flipVert);
	    if (this._autoLog) {
	      this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
	    }
	  }
	  setText(text, log) {
	    this._setAttribute('text', text, log);
	    this._needUpdate = true;
	  }
	  setAlignHoriz(alignHoriz, log) {
	    this._setAttribute('alignHoriz', alignHoriz, log);
	    this._needUpdate = true;
	  }
	  setWrapWidth(wrapWidth, log) {
	    if (typeof wrapWidth === 'undefined') {
	      if (!TextStim._defaultWrapWidthMap.has(this._units)) {
	        throw {
	          origin: 'TextStim.setWrapWidth',
	          context: 'when setting the wrap width of TextStim: ' + this._name,
	          error: 'no default wrap width for unit: ' + this._units
	        };
	      }
	      wrapWidth = TextStim._defaultWrapWidthMap.get(this._units);
	    }
	    this._setAttribute('wrapWidth', wrapWidth, log);
	    this._needUpdate = true;
	  }
	  setHeight(height, log) {
	    if (typeof height === 'undefined') {
	      if (!TextStim._defaultLetterHeightMap.has(this._units)) {
	        throw {
	          origin: 'TextStim.setHeight',
	          context: 'when setting the height of TextStim: ' + this._name,
	          error: 'no default letter height for unit: ' + this._units
	        };
	      }
	      height = TextStim._defaultLetterHeightMap.get(this._units);
	    }
	    this._setAttribute('height', height, log);
	    this._needUpdate = true;
	  }
	  setItalic(italic, log) {
	    this._setAttribute('italic', italic, log);
	    this._needUpdate = true;
	  }
	  setBold(bold, log) {
	    this._setAttribute('bold', bold, log);
	    this._needUpdate = true;
	  }
	  setFlipVert(flipVert, log) {
	    this._setAttribute('flipVert', flipVert, log);
	    this._needUpdate = true;
	  }
	  setFlipHoriz(flipHoriz, log) {
	    this._setAttribute('flipHoriz', flipHoriz, log);
	    this._needUpdate = true;
	  }
	  contains(object, units) {
	    let objectPos_px = util.getPositionFromObject(object, units);
	    if (typeof objectPos_px === 'undefined') {
	      throw {
	        origin: 'TextStim.contains',
	        context: 'when determining whether TextStim: ' + this._name + ' contains object: ' + util.toString(object),
	        error: 'unable to determine the position of the object'
	      };
	    }
	    return false;
	  }
	  _updateIfNeeded() {
	    if (!this._needUpdate) {
	      return;
	    }
	    this._needUpdate = false;
	    this._heightPix = this._getLengthPix(this._height);
	    const fontSize = Math.round(this._heightPix);
	    let color = this.getContrastedColor(this._color, this._contrast);
	    const font = (this._bold ? 'bold ' : '') + (this._italic ? 'italic ' : '') + fontSize + 'px ' + this._font;
	    this._pixi = new PIXI.Text(this._text, {
	      font: font,
	      fill: color.hex,
	      align: this._alignHoriz,
	      wordWrap: typeof this._wrapWidth !== 'undefined',
	      wordWrapWidth: this._wrapWidth ? this._getHorLengthPix(this._wrapWidth) : 0
	    });
	    this._pixi.anchor.x = 0.5;
	    this._pixi.anchor.y = 0.5;
	    this._pixi.scale.x = this._flipHoriz ? -1 : 1;
	    this._pixi.scale.y = this._flipVert ? 1 : -1;
	    this._pixi.rotation = this._ori * Math.PI / 180;
	    this._pixi.position = util.to_pixiPoint(this.pos, this.units, this.win);
	    this._pixi.alpha = this._opacity;
	    this._size = [this._getLengthUnits(Math.abs(this._pixi.width)), this._getLengthUnits(Math.abs(this._pixi.height))];
	  }
	}
	TextStim._defaultLetterHeightMap = new Map([['cm', 1.0], ['deg', 1.0], ['degs', 1.0], ['degFlatPos', 1.0], ['degFlat', 1.0], ['norm', 0.1], ['height', 0.2], ['pix', 20], ['pixels', 20]]);
	TextStim._defaultWrapWidthMap = new Map([['cm', 15.0], ['deg', 15.0], ['degs', 15.0], ['degFlatPos', 15.0], ['degFlat', 15.0], ['norm', 1], ['height', 1], ['pix', 500], ['pixels', 500]]);

	exports.ImageStim = ImageStim;
	exports.MovieStim = MovieStim;
	exports.Polygon = Polygon;
	exports.Rect = Rect;
	exports.ShapeStim = ShapeStim;
	exports.Slider = Slider;
	exports.TextStim = TextStim;
	exports.VisualStim = VisualStim;

	return exports;

}({}, core, core, util, util, util, core, util));
var sound = (function (exports, PsychoJS_js, PsychObject_js) {
	'use strict';

	/**
	 * Sound player interface
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class SoundPlayer extends PsychObject_js.PsychObject {
	  constructor(psychoJS) {
	    super(psychoJS);
	  }
	  static accept(sound) {
	    throw {
	      origin: 'SoundPlayer.accept',
	      context: 'when evaluating whether this player can play a given sound',
	      error: 'this method is abstract and should not be called.'
	    };
	  }
	  play(loops) {
	    throw {
	      origin: 'SoundPlayer.play',
	      context: 'when starting the playback of a sound',
	      error: 'this method is abstract and should not be called.'
	    };
	  }
	  stop() {
	    throw {
	      origin: 'SoundPlayer.stop',
	      context: 'when stopping the playback of a sound',
	      error: 'this method is abstract and should not be called.'
	    };
	  }
	  getDuration() {
	    throw {
	      origin: 'SoundPlayer.getDuration',
	      context: 'when getting the duration of the sound',
	      error: 'this method is abstract and should not be called.'
	    };
	  }
	  setDuration(duration_s) {
	    throw {
	      origin: 'SoundPlayer.setDuration',
	      context: 'when setting the duration of the sound',
	      error: 'this method is abstract and should not be called.'
	    };
	  }
	  setLoops(loops) {
	    throw {
	      origin: 'SoundPlayer.setLoops',
	      context: 'when setting the number of loops',
	      error: 'this method is abstract and should not be called.'
	    };
	  }
	  setVolume(volume, mute = false) {
	    throw {
	      origin: 'SoundPlayer.setVolume',
	      context: 'when setting the volume of the sound',
	      error: 'this method is abstract and should not be called.'
	    };
	  }
	}

	/**
	 * Tone Player.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class TonePlayer extends SoundPlayer {
	  constructor({
	    psychoJS,
	    note = 'C4',
	    duration_s = 0.5,
	    volume = 1.0,
	    loops = 0,
	    soundLibrary = TonePlayer.SoundLibrary.TONE_JS,
	    autoLog = true
	  } = {}) {
	    super(psychoJS);
	    this._addAttributes(TonePlayer, note, duration_s, volume, loops, soundLibrary, autoLog);
	    this._initSoundLibrary();
	    this._toneLoop = null;
	    if (this._autoLog) {
	      this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
	    }
	  }
	  static accept(sound) {
	    if ($.isNumeric(sound.value)) {
	      return new TonePlayer({
	        psychoJS: sound.psychoJS,
	        note: sound.value,
	        duration_s: sound.secs,
	        volume: sound.volume,
	        loops: sound.loops
	      });
	    }
	    if (typeof sound.value === 'string') {
	      let psychopyToToneMap = new Map();
	      for (const note of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) {
	        psychopyToToneMap.set(note, note);
	        psychopyToToneMap.set(note + 'fl', note + 'b');
	        psychopyToToneMap.set(note + 'sh', note + '#');
	      }
	      const note = psychopyToToneMap.get(sound.value);
	      if (typeof note !== 'undefined') {
	        return new TonePlayer({
	          psychoJS: sound.psychoJS,
	          note: note + sound.octave,
	          duration_s: sound.secs,
	          volume: sound.volume,
	          loops: sound.loops
	        });
	      }
	    }
	    return undefined;
	  }
	  getDuration() {
	    return this.duration_s;
	  }
	  setDuration(duration_s) {
	    this.duration_s = duration_s;
	  }
	  setLoops(loops) {
	    this._loops = loops;
	  }
	  setVolume(volume, mute = false) {
	    this._volume = volume;
	    if (this._soundLibrary === TonePlayer.SoundLibrary.TONE_JS) {
	      if (typeof this._volumeNode !== 'undefined') {
	        this._volumeNode.mute = mute;
	        this._volumeNode.volume.value = -60 + volume * 66;
	      }
	    }
	  }
	  play(loops) {
	    if (typeof loops !== 'undefined') {
	      this._loops = loops;
	    }
	    const actualDuration_s = this._duration_s === -1 ? 1000000 : this._duration_s;
	    const self = this;
	    let playToneCallback;
	    if (this._soundLibrary === TonePlayer.SoundLibrary.TONE_JS) {
	      playToneCallback = () => {
	        self._synth.triggerAttackRelease(self._note, actualDuration_s, Tone.context.currentTime);
	      };
	    } else {
	      playToneCallback = () => {
	        self._webAudioOscillator = self._audioContext.createOscillator();
	        self._webAudioOscillator.type = 'sine';
	        self._webAudioOscillator.frequency.value = 440;
	        self._webAudioOscillator.connect(self._audioContext.destination);
	        const contextCurrentTime = self._audioContext.currentTime;
	        self._webAudioOscillator.start(contextCurrentTime);
	        self._webAudioOscillator.stop(contextCurrentTime + actualDuration_s);
	      };
	    }
	    if (this.loops === 0) {
	      playToneCallback();
	    }
	    else if (this.loops === -1) {
	        this._toneId = Tone.Transport.scheduleRepeat(playToneCallback, this.duration_s, Tone.now(), Tone.Infinity);
	      } else
	        {
	          this._toneId = Tone.Transport.scheduleRepeat(playToneCallback, this.duration_s, Tone.now(), this.duration_s * (this._loops + 1));
	        }
	  }
	  stop() {
	    if (this._soundLibrary === TonePlayer.SoundLibrary.TONE_JS) {
	      this._synth.triggerRelease();
	      if (this._toneId) {
	        Tone.Transport.clear(this._toneId);
	      }
	    } else {
	      const contextCurrentTime = this._audioContext.currentTime;
	      this._webAudioOscillator.stop(contextCurrentTime);
	    }
	  }
	  _initSoundLibrary() {
	    const response = {
	      origin: 'TonePlayer._initSoundLibrary',
	      context: 'when initialising the sound library'
	    };
	    if (this._soundLibrary === TonePlayer.SoundLibrary.TONE_JS) {
	      if (typeof Tone === 'undefined') {
	        throw Object.assign(response, {
	          error: "Tone.js is not available. A different sound library must be selected. Please contact the experiment designer."
	        });
	      }
	      if (typeof Tone !== 'undefined' && Tone.Transport.state !== 'started') {
	        this.psychoJS.logger.info('[PsychoJS] start Tone Transport');
	        Tone.Transport.start(Tone.now());
	        Tone.context.lookAhead = 0;
	      }
	      this._synthOtions = {
	        oscillator: {
	          type: 'square'
	        },
	        envelope: {
	          attack: 0.001,
	          decay: 0.001,
	          sustain: 1,
	          release: 0.001
	        }
	      };
	      this._synth = new Tone.Synth(this._synthOtions);
	      this._volumeNode = new Tone.Volume(-60 + this._volume * 66);
	      this._synth.connect(this._volumeNode);
	      this._volumeNode.toMaster();
	    } else {
	      if (typeof this._audioContext === 'undefined') {
	        const AudioContext = window.AudioContext || window.webkitAudioContext;
	        if (typeof AudioContext === 'undefined') {
	          throw Object.assign(response, {
	            error: `AudioContext is not available on your browser, ${this._psychoJS.browser}, please contact the experiment designer.`
	          });
	        }
	        this._audioContext = new AudioContext();
	      }
	    }
	  }
	}
	TonePlayer.SoundLibrary = {
	  AUDIO_CONTEXT: Symbol.for('AUDIO_CONTEXT'),
	  TONE_JS: Symbol.for('TONE_JS')
	};

	/**
	 * Track Player.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class TrackPlayer extends SoundPlayer {
	  constructor({
	    psychoJS,
	    howl,
	    startTime = 0,
	    stopTime = -1,
	    stereo = true,
	    volume = 0,
	    loops = 0
	  } = {}) {
	    super(psychoJS);
	    this._addAttributes(TrackPlayer, howl, startTime, stopTime, stereo, loops, volume);
	    this._currentLoopIndex = -1;
	  }
	  static accept(sound) {
	    if (typeof sound.value === 'string') {
	      const howl = sound.psychoJS.serverManager.getResource(sound.value);
	      if (typeof howl !== 'undefined') {
	        const player = new TrackPlayer({
	          psychoJS: sound.psychoJS,
	          howl: howl,
	          startTime: sound.startTime,
	          stopTime: sound.stopTime,
	          stereo: sound.stereo,
	          loops: sound.loops,
	          volume: sound.volume
	        });
	        return player;
	      }
	    }
	    return undefined;
	  }
	  getDuration() {
	    return this._howl.duration();
	  }
	  setVolume(volume, mute = false) {
	    this._volume = volume;
	    this._howl.volume(volume);
	    this._howl.mute(mute);
	  }
	  setLoops(loops) {
	    this._loops = loops;
	    this._currentLoopIndex = -1;
	    if (loops === 0) {
	      this._howl.loop(false);
	    } else {
	      this._howl.loop(true);
	    }
	  }
	  play(loops) {
	    if (typeof loops !== 'undefined') {
	      this.setLoops(loops);
	    }
	    if (loops > 0) {
	      const self = this;
	      this._howl.on('end', event => {
	        ++this._currentLoopIndex;
	        if (self._currentLoopIndex > self._loops) {
	          self.stop();
	        } else {
	          self._howl.seek(self._startTime);
	          self._howl.play();
	        }
	      });
	    }
	    this._howl.seek(this._startTime);
	    this._howl.play();
	  }
	  stop() {
	    this._howl.stop();
	    this._howl.off('end');
	  }
	}

	/**
	 * Sound stimulus.
	 *
	 * @author Alain Pitiot
	 * @version 2020.5
	 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
	 * @license Distributed under the terms of the MIT License
	 */
	class Sound extends PsychObject_js.PsychObject {
	  constructor({
	    name,
	    win,
	    value = 'C',
	    octave = 4,
	    secs = 0.5,
	    startTime = 0,
	    stopTime = -1,
	    stereo = true,
	    volume = 1.0,
	    loops = 0,
	    autoLog = true
	  } = {}) {
	    super(win._psychoJS, name);
	    this._player = undefined;
	    this._addAttributes(Sound, win, value, octave, secs, startTime, stopTime, stereo, volume, loops,
	    autoLog);
	    this._getPlayer();
	    this.status = PsychoJS_js.PsychoJS.Status.NOT_STARTED;
	  }
	  play(loops, log = true) {
	    this.status = PsychoJS_js.PsychoJS.Status.STARTED;
	    this._player.play(loops);
	  }
	  stop({
	    log = true
	  } = {}) {
	    this._player.stop();
	    this.status = PsychoJS_js.PsychoJS.Status.STOPPED;
	  }
	  getDuration() {
	    return this._player.getDuration();
	  }
	  setVolume(volume, mute = false, log = true) {
	    this._setAttribute('volume', volume, log);
	    if (typeof this._player !== 'undefined') {
	      this._player.setVolume(volume, mute);
	    }
	  }
	  setLoops(loops = 0, log = true) {
	    this._setAttribute('loops', loops, log);
	    if (typeof this._player !== 'undefined') {
	      this._player.setLoops(loops);
	    }
	  }
	  setSecs(secs = 0.5, log = true) {
	    this._setAttribute('secs', secs, log);
	    if (typeof this._player !== 'undefined') {
	      this._player.setDuration(secs);
	    }
	  }
	  _getPlayer() {
	    const acceptFns = [sound => TonePlayer.accept(sound), sound => TrackPlayer.accept(sound)];
	    for (const acceptFn of acceptFns) {
	      this._player = acceptFn(this);
	      if (typeof this._player !== 'undefined') {
	        return this._player;
	      }
	    }
	    throw {
	      origin: 'SoundPlayer._getPlayer',
	      context: 'when finding a player for the sound',
	      error: 'could not find an appropriate player.'
	    };
	  }
	}

	exports.Sound = Sound;
	exports.SoundPlayer = SoundPlayer;
	exports.TonePlayer = TonePlayer;
	exports.TrackPlayer = TrackPlayer;

	return exports;

}({}, core, util));

// adding a few top level variables for convenience
// (e.g. this makes it possible to use "return Scheduler.Event.NEXT;" instead of "util.Scheduler.Event.NEXT;")

PsychoJS = core.PsychoJS;
TrialHandler = data.TrialHandler;
Scheduler = util.Scheduler;
