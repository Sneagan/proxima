/*##############################################
# Define MouseDistanceFromElement Prototype
#
# This prototype takes an element and has
# methods to get the distance of a point (x, y)
# from a given DOM element. In this case, I'm
# using it to detect the distance from the 
# mouse to an element.
#
# It also allows you to monitor the cursor's
# distance from any given side of a particular
# element.
##############################################*/

var MouseDistanceFromElement = function(){};
MouseDistanceFromElement.prototype.init = function($elem, alert_distance) {
  if (!$elem) console.log('You must provide MouseDistanceFromElement.init() an element.');
  this.elem = $elem;
  this.getElementCorners();
  this.alert_distance = alert_distance || 200;
  this.mouseDidEnterAlertArea = function() { console.log('The mouse is now within the specified distance.'); };
  this.mouseDidExitAlertArea = function() { console.log('The mouse is now outside the specified distance.'); };
};
MouseDistanceFromElement.prototype.setElement = function($elem) {
  if (!$elem) console.log('You must provide MouseDistanceFromElement.setElement() an element.');
  this.elem = $elem;
};
MouseDistanceFromElement.prototype.setAlertDistance = function(distance) {
  // If no parameter is provided, reset to 200
  this.alert_distance = distance || 200;
};
MouseDistanceFromElement.prototype.monitoredSides = {};
MouseDistanceFromElement.prototype.getElementCorners = function($elem) {
  if ($elem) this.elem = $elem;
  var element_location = this.elem.getBoundingClientRect();
  this.element_corners = {
    top_left: [element_location.left, element_location.top],
    top_right: [element_location.left+this.elem.offsetWidth, element_location.top],
    bottom_left: [element_location.left, element_location.top+this.elem.offsetHeight],
    bottom_right: [element_location.left+this.elem.offsetWidth, element_location.top+this.elem.offsetHeight]
  };
  return this.element_corners;
};
MouseDistanceFromElement.prototype.calculateMouseDistanceFromBorder = function(x, y, x1, y1, x2, y2) {  
  var A = x - x1;
  var B = y - y1;
  var C = x2 - x1;
  var D = y2 - y1;
  var dot = A * C + B * D;
  var len_sq = C * C + D * D;
  var param = dot / len_sq;
  var xx, yy;
  
  if (param < 0 || (x1 == x2 && y1 == y2)) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  var dx = x - xx;
  var dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
};
MouseDistanceFromElement.prototype.calculateMouseDistanceFromElement = function(mouse_x, mouse_y, side, $elem) {
  // side and $elem are optional. If you pass a side, it must be lowercase 'top', 'bottom', 'left', or 'right'.
  if (typeof side === 'object') $elem = side;
  if ($elem) this.elem = $elem;
  var distances = {
    distance_top: this.calculateMouseDistanceFromBorder(
      mouse_x,
      mouse_y,
      this.element_corners.top_left[0],
      this.element_corners.top_left[1],
      this.element_corners.top_right[0],
      this.element_corners.top_right[1]
    ),
    distance_bottom: this.calculateMouseDistanceFromBorder(
      mouse_x,
      mouse_y,
      this.element_corners.bottom_left[0],
      this.element_corners.bottom_left[1],
      this.element_corners.bottom_right[0],
      this.element_corners.bottom_right[1]
    ),
    distance_left: this.calculateMouseDistanceFromBorder(
      mouse_x,
      mouse_y,
      this.element_corners.top_left[0],
      this.element_corners.top_left[1],
      this.element_corners.bottom_left[0],
      this.element_corners.bottom_left[1]
    ),
    distance_right: this.calculateMouseDistanceFromBorder(
      mouse_x,
      mouse_y,
      this.element_corners.top_right[0],
      this.element_corners.top_right[1],
      this.element_corners.bottom_right[0],
      this.element_corners.bottom_right[1]
    )
  };
  if (side && typeof side === 'string') {
    return distances['distance_'+side];
  }
  return Math.min(distances.distance_top, distances.distance_bottom, distances.distance_left, distances.distance_right);
};
MouseDistanceFromElement.prototype.startObservingAllSides = function(enterCallback, exitCallback) {
  if (enterCallback) this.mouseDidEnterAlertArea = enterCallback;
  if (exitCallback) this.mouseDidExitAlertArea = exitCallback;
  
  var handleMouseMove = function(e) {
    e = e || window.event; // IE-ism
    var distance = this.calculateMouseDistanceFromElement(e.clientX, e.clientY);
    if (!this.in_alert_area && distance <= this.alert_distance) {
      this.in_alert_area = true;
      this.mouseDidEnterAlertArea(distance);
    }
    else if (this.in_alert_area && distance > this.alert_distance) {
      this.in_alert_area = false;
      this.mouseDidExitAlertArea(distance);
    }
  };
  
  this.trackAllSides = window.onmousemove = handleMouseMove.bind(this);
};
MouseDistanceFromElement.prototype.stopObservingAllSides = function() {
  this.trackAllSides = window.onmousemove = function(){};
};
MouseDistanceFromElement.prototype.startObservingSide = function(side, enterCallback, exitCallback) {
  // Side must be lowercase 'top', 'bottom', 'left', or 'right'.
  var capSide = side.charAt(0).toUpperCase() + side.slice(1);
  if (enterCallback) this['mouseDidEnterSideAlertArea'+capSide] = enterCallback;
  if (exitCallback) this['mouseDidExitSideAlertArea'+capSide] = exitCallback;
  
  var handleMouseMove = function(e) {
    e = e || window.event; // IE-ism
    var distance = this.calculateMouseDistanceFromElement(e.clientX, e.clientY, side);
    if (!this.in_alert_area && distance <= this.alert_distance) {
      this.in_alert_area = true;
      this['mouseDidEnterSideAlertArea'+capSide](distance);
    }
    else if (this.in_alert_area && distance > this.alert_distance) {
      this.in_alert_area = false;
      this['mouseDidExitSideAlertArea'+capSide](distance);
    }
  };
  
  this.monitoredSides['trackSide'+capSide] = window.onmousemove = handleMouseMove.bind(this);
};
MouseDistanceFromElement.prototype.stopObservingSide = function(side) {
  var capSide = side.charAt(0).toUpperCase() + side.slice(1);
  this.monitoredSides['trackSide'+capSide] = window.onmousemove = function(){};
};
