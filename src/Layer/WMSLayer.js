/*******************************************************************************
 * Copyright 2017 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
 *
 * This file is part of MIZAR.
 *
 * MIZAR is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * MIZAR is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with MIZAR. If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/
/***************************************
 * Copyright 2011, 2012 GlobWeb contributors.
 *
 * This file is part of GlobWeb.
 *
 * GlobWeb is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, version 3 of the License, or
 * (at your option) any later version.
 *
 * GlobWeb is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with GlobWeb. If not, see <http://www.gnu.org/licenses/>.
 ***************************************/

define(["jquery", '../Utils/Utils', './AbstractLayer', './AbstractRasterLayer', '../Utils/Constants', '../Tiling/GeoTiling', '../Utils/UtilsIntersection'],
    function ($, Utils, AbstractLayer, AbstractRasterLayer, Constants, GeoTiling, UtilsIntersection) {


        /**
         * Configuration parameters to query a Web Map Service (WMS)
         * @typedef {AbstractLayer.configuration} AbstractRasterLayer.wms_configuration
         * @property {int} [tilePixelSize = 256] - tile in pixels
         * @property {int} [numberOfLevels = 21] - number of levels
         * @property {string} [version = "1.1.1"] - WMS version
         * @property {string} [transparent]
         * @property {string} [time] - Time dimension
         * @property {string} [format = "image/jpeg"] - output image format
         * @property {string} layers - names of the layer
         * @property {string} [styles] - Styled Layers Descriptor for each layer
         */

        /**
         * @name WMSLayer
         * @class
         *    Creates a layer for imagery data using WMS (Web Map Service) protocol
         *    based on a GeoTiling(4, 2) with a pixelSize = 256 by default.<br/>
         *    WMS provides a standard interface for requesting a geospatial map image.
         *    The standard guarantees that these images can all be overlaid on one another.
         *    <br/><br/>
         *    Example of a WMS request<br/>
         *    <code>
         *        http://example.com/wms?request=GetMap&service=WMS&version=1.3.0&layers=MyLayer
         *        &styles=population&crs=CRS:84&bbox=-145.15104058007,21.731919794922,-57.154894212888,58.961058642578&
         *        &width=780&height=330&format=image/png
         *    </code>
         *
         * @augments AbstractLayer
         * @param {AbstractLayer.wms_configuration} options - WMS Configuration
         * @constructor
         * @memberOf module:Layer
         * @see {@link http://www.opengeospatial.org/standards/wms WMS} standard
         */
        var WMSLayer = function (options) {

            options.tilePixelSize = options.tilePixelSize || 256;
            options.tiling = new GeoTiling(4, 2);
            options.numberOfLevels = options.numberOfLevels || 21;
            options.transparent = options.transparent || false;

            this.restrictTo = options.restrictTo;
            this.autoFillTimeTravel = options.autoFillTimeTravel;

            //this._computeBaseUrlAndCapabilities(options);

            AbstractRasterLayer.prototype.constructor.call(this, options.type, options);

            this.timeTravelValues = null;
            if (this.autoFillTimeTravel === true)  {
                if ( (options.dimension) && (options.dimension.time)) {
                    if (options.dimension.time.value) {
                        this.timeTravelValues = {
                            "add" : {
                                "enumeratedValues" : options.dimension.time.value.split(","),
                                "ID" : this.ID
                            }
                        };
                    }
                }
            }

            this.getMapBaseUrl = _queryImage.call(this, this.getBaseUrl(), this.tilePixelSize, this.tilePixelSize, options);
            this.layers = options.layers;
            this.timeID = null;
            this.mustbeSkipped = false;

        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractRasterLayer, WMSLayer);

        /**************************************************************************************************************/

        function _queryImage(baseUrl, xTilePixelSize, yTilePixelSize, options) {
            // Build the base GetMap URL
            var url = baseUrl;
            url = Utils.addParameterTo(url, "service", "wms");
            url = Utils.addParameterTo(url, "version", options.hasOwnProperty('version') ? options.version : '1.3.0');
            url = Utils.addParameterTo(url, "request", "getMap");
            url = Utils.addParameterTo(url, "layers", options.layers);
            url = Utils.addParameterTo(url, "styles", options.hasOwnProperty('styles') ? options.styles : "");
            url = Utils.addParameterTo(url, "format", options.hasOwnProperty('format') ? options.format : 'image/jpeg');

            if (options.hasOwnProperty('transparent')) {
                url = Utils.addParameterTo(url, "transparent", options.transparent);
            }
            url = Utils.addParameterTo(url, "width", xTilePixelSize);
            url = Utils.addParameterTo(url, "height", yTilePixelSize);

            if (options.hasOwnProperty('time')) {
                this.mustbeSkipped = (this.timeID == null);
                url = Utils.addParameterTo(url, "time", this.timeID);
            } else {
                this.mustbeSkipped = false;
                this.timeID = null;
            }

            return url;
        }

        function _tileIsIntersectedFootprint(tile, footprint) {
            var isIntersect;
            if (footprint != null) {
                // check if tile is inside restrict zone
                isIntersect = UtilsIntersection.boundsIntersects(tile, footprint);
            } else {
                isIntersect = true;
            }
            return isIntersect;
        }

        WMSLayer.prototype.setTime = function(time) {
            AbstractLayer.prototype.setTime(time);
            this.setParameter("time", time);
        };


        WMSLayer.prototype.getLegend = function() {
            var metadata = this.metadataAPI;
            var legend;
            if(metadata.Style) {
                var defaultStyle = metadata.Style[0];
                var title = defaultStyle.Title;
                var format = defaultStyle.LegendURL[0].Format;
                var url = defaultStyle.LegendURL[0].OnlineResource;
                var size = defaultStyle.LegendURL[0].size;
                if(title === undefined || title === "default") {
                    legend = {};
                } else {
                    legend = {
                        title:title,
                        format:format,
                        url:url,
                        size:size
                    };
                }
            } else {
                legend = {};
            }
            return legend;
        };

        WMSLayer.prototype.setVisible = function (arg) {
            AbstractRasterLayer.prototype.setVisible.call(this, arg);
            if (document.getElementById("legendDiv")) {
                var $crsInfo = $("#legendDiv");
                var legend = this.getLegend();
                if(Object.keys(legend).length > 0) {
                    document.getElementById("legendDiv").innerHTML ="";
                    if (arg === true) {
                        document.getElementById("legendDiv").innerHTML ="<div id='legendTxt' class='column'>"+legend.title+"</div><div id='legendUrl' class='column'><img src='"+legend.url+"'/></div>";
                    }
                }
            }
       };

        /**
         * Returns the url for the given tile
         * @function getUrl
         * @memberOf WMSLayer#
         * @param {Tile} tile Tile
         * @return {String} Url
         */
        WMSLayer.prototype.getUrl = function (tile) {
            // Just add the bounding box to the GetMap URL
            var bound = tile.bound;
            var tileID = tile.level+"#"+tile.x+"#"+tile.y;

            var url;
            // we cannot reject the request to the server when the layer is defined as background otherwise there is
            // no image to show and Mizar is waiting for an image
            if(this.mustbeSkipped) {
                url = null;
            } else if(this.isBackground() || _tileIsIntersectedFootprint(bound, this.restrictTo)) {
                var bbox = bound.west + "," + bound.south + "," + bound.east + "," + bound.north;
                url = this.getMapBaseUrl;
                url = Utils.addParameterTo(url, "transparent", this.options.transparent);
                url = Utils.addParameterTo(url, "crs", tile.config.srs);
                url = Utils.addParameterTo(url, "bbox", bbox);
            } else {
                url = null;
            }

            return this.proxify(url, tile.level);
        };

        WMSLayer.prototype.setParameter = function (paramName,value) {
            if ((paramName === "styles" || this.containsDimension(paramName)) && this._hasToBeRefreshed(paramName, value)) {
                this.options[paramName] = value;
                this.getMapBaseUrl = _queryImage.call(this, this.getBaseUrl(), this.tilePixelSize, this.tilePixelSize, this.options);
                this.forceRefresh();
            }
        };

        /**
         * Checks if Mizar must query the WMS server to refresh data.
         * When the camera does not move but that the time change, we have two cases :
         * - the requested time is included in the time frame of the image => no query
         * - the requested time is outside of the time frame of the image => this is a new image, need to query
         * @param paramName
         * @param value
         * @return {*}
         * @private
         */
        WMSLayer.prototype._hasToBeRefreshed = function(paramName, value) {
            var hasToBeRefreshed;
            if(paramName==="time") {
                var timeRequest = AbstractLayer.createTimeRequest(value);
                var allowedTime = this.getDimensions().time;
                var selectedDate = AbstractLayer.selectedTime(allowedTime.value, timeRequest);
                if(this.timeID != null && selectedDate == null) {
                    // we query because the state has changed
                    hasToBeRefreshed = true;
                    this.timeID = null;
                } else if(selectedDate == null) {
                    // No image found on the server related to the requested time, no need to query => we save network
                    hasToBeRefreshed = false;
                } else if (this.timeID === selectedDate) {
                    // Same state, no need to query
                    hasToBeRefreshed = false;
                } else {
                    // At the requested time, there is an image on the server and this is not the current one => query
                    hasToBeRefreshed = true;
                    this.timeID = selectedDate;
                }
            } else {
                hasToBeRefreshed = true;
            }
            return hasToBeRefreshed;
        };

        /**************************************************************************************************************/

        return WMSLayer;
    });
