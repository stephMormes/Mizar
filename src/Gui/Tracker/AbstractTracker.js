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
 * along with SITools2. If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/
define([],
    function () {

        /**
         * @name AbstractTracker
         * @class
         *    Abstract class for tracker (position, elevation...)
         * @param {object} options
         * @constructor
         * @implements {Tracker}
         */
        var AbstractTracker = function (options) {
            this.options = options;
        };

        /**
         * @function update
         * @memberOf AbstractTracker#
         * @abstract
         */
        AbstractTracker.prototype.update = function (event) {
            throw "update from AbstractTracker not implemented";
        };

        /**
         * @function compute
         * @memberOf AbstractTracker#
         * @abstract
         */
        AbstractTracker.prototype.compute = function (geoPosition) {
            throw "compute from AbstractTracker not implemented";
        };

        /**
         * @function attachTo
         * @memberOf AbstractTracker#
         * @abstract
         */
        AbstractTracker.prototype.attachTo = function (globeContext) {
            throw "attachTo from AbstractTracker not implemented";
        };

        /**
         * @function detach
         * @memberOf AbstractTracker#
         * @abstract
         */
        AbstractTracker.prototype.detach = function () {
            throw "detach from AbstractTracker not implemented";
        };


        return AbstractTracker;
    });