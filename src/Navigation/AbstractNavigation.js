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

define(['../Utils/Utils', '../Utils/Event', '../Navigation/NavigationHandlerFactory', '../Animation/AnimationFactory', '../Utils/Numeric', '../Utils/Constants', '../Renderer/glMatrix'],
    function (Utils, Event, NavigationHandlerFactory, AnimationFactory, Numeric, Constants) {

        /**
         * Navigation configuration
         * @typedef {Object} AbstractNavigation.configuration
         * @property {boolean} [inertia = false] - Animation simulating inertia for camera's navigation
         * @property {AbstractAnimation.inertia_configuration} inertiaAnimation - Inertia Animation is used when <i>inertia</i> is true
         * @property {Object[]} [handlers = [{@link module:Navigation.MouseNavigationHandler MouseNavigationHandler},{@link module:Navigation.KeyboardNavigationHandler KeyboardNavigationHandler}[,{@link module:Navigation.TouchNavigationHandler TouchNavigationHandler}]]
         * @property {AbstractNavigation.mouse_configuration} [mouse] - Mouse navigation configuration when <i>handlers</i> is not defined
         * @property {AbstractNavigation.keyboard_configuration} [keyboard] - Keyboard navigation configuration when <i>handlers</i> is not defined
         * @property {boolean} [isMobile = false] - {@link module:Navigation.TouchNavigationHandler TouchNavigationHandler} configuration when <i>handlers</i> is not defined, sets to true this parameter to support mobile device
         */

        /**
         * @name AbstractNavigation
         * @class
         * The active navigation object can normally be obtained from the {@link Mizar#getNavigation} method of the Mizar instance.
         * Client implementations should not normally instantiate this class directly.
         * @augments Event
         * @param {NAVIGATION} type - type of navigation
         * @param {AbstractContext} ctx - context
         * @param {AbstractNavigation.configuration} [options = {}] - options for navigation
         * @constructor
         * @see {@link module:Navigation.NavigationHandlerFactory NavigationHandlerFactory} the possible handlers
         * @see {@link module:Navigation.MouseNavigationHandler MouseNavigationHandler} for its options when it is set by default
         * @see {@link module:Navigation.KeyboardNavigationHandler KeyboardNavigationHandler} for its options when it is set by default
         * @see {@link module:Navigation.TouchNavigationHandler TouchNavigationHandler} for its options when isMobile is set to True
         * @implements {Navigation}
         *
         */
        var AbstractNavigation = function (type, ctx, options) {
            Event.prototype.constructor.call(this);
            this.type = type;
            this.ctx = ctx;
            this.renderContext = this.ctx.globe.getRenderContext();
            this.options = options || {};

            // Create default handlers if none are created in options
            if (options && options.handlers) {
                this.handlers = options.handlers;
            }
            else {
                // Use mouse & keyboard as default handlers
                this.handlers = [
                    NavigationHandlerFactory.create(Constants.HANDLER.Mouse, options ? options.mouse : null),
                    NavigationHandlerFactory.create(Constants.HANDLER.Keyboard, options ? options.keyboard : null)
                ];

                if (options && options.isMobile) {
                    this.handlers.push(NavigationHandlerFactory.create(Constants.HANDLER.Touch, options ? options.touch : null));
                }
            }

            // Inertia effect
            if (options && options.inertia) {
                var inertiaOptions = options.inertiaAnimation || {};
                inertiaOptions.nav = this;
                this.inertia = AnimationFactory.create(Constants.ANIMATION.Inertia, inertiaOptions);
            }
            // ZoomTo animation
            this.zoomToAnimation = null;

            // Automatically start
            this.start();
        };

        /**************************************************************************************************************/

        Utils.inherits(Event, AbstractNavigation);

        /**************************************************************************************************************/

        /**
         * Returns the {@link TYPE type} of navigation.
         * The type can take one of the following value : AstroNavigation, FlatNavigation, PlanetNavigation
         * @function getType
         * @return {string} the name of the navigation class, which is used
         * @memberOf AbstractNavigation#
         */
        AbstractNavigation.prototype.getType = function () {
            return this.type;
        };

        /**
         * Returns the navigation's options given at the initialisation.
         * @function getOptions
         * @return {Object} Options
         * @memberOf AbstractNavigation#
         */
        AbstractNavigation.prototype.getOptions = function () {
            return this.options;
        };

        /**
         * Starts the navigation.
         * @function start
         * @memberOf AbstractNavigation#
         */
        AbstractNavigation.prototype.start = function () {
            // Install handlers
            for (var i = 0; i < this.handlers.length; i++) {
                this.handlers[i].install(this);
            }
        };

        /**
         * Stops the navigation.
         * @function stop
         * @memberOf AbstractNavigation#
         */
        AbstractNavigation.prototype.stop = function () {
            // Uninstall handlers
            for (var i = 0; i < this.handlers.length; i++) {
                this.handlers[i].uninstall();
            }
        };

        /**
         * Stops the animations.
         * @function stopAnimations
         * @memberOf AbstractNavigation#
         */
        AbstractNavigation.prototype.stopAnimations = function () {
            if (this.inertia) {
                this.inertia.stop();
            }
            if (this.zoomToAnimation) {
                this.zoomToAnimation.stop();
                this.zoomToAnimation = null;
            }
        };

        /**
         * Returns the field of view in decimal degree.
         * @function getFov
         * @return {float[]} the Field of view [fov along width, fov along height]
         * @memberOf AbstractNavigation#
         */
        AbstractNavigation.prototype.getFov = function () {
            var aspect = this.renderContext.getCanvas().width / this.renderContext.getCanvas().height;
            return [aspect * this.renderContext.getFov(), this.renderContext.getFov()];
        };

        /**
         * Moves up vector.
         * @function moveUpTo
         * @memberOf AstroNavigation#
         * @param {float[]} vec Vector
         * @param {int} [duration = 1000] - Duration of animation in milliseconds
         * @abstract
         */
        AbstractNavigation.prototype.moveUpTo = function (vec, duration) {
            throw "moveUpTo not implemented";
        };

        /**
         * Returns the center of the field of view.
         * @function getCenter
         * @return {float[]} the center in decimal degree of the field of view [longitude, latitude]
         * @memberOf AbstractNavigation#
         */
        AbstractNavigation.prototype.getCenter = function () {
            return this.ctx.globe.getLonLatFromPixel(this.renderContext.getCanvas().width * 0.5, this.renderContext.getCanvas().height * 0.5)
        };

        /**
         * Rotates the camera.
         * @function rotate
         * @param {float} dx Window delta x
         * @param {float} dy Window delta y
         * @abstract
         * @memberOf AbstractNavigation#
         */
        AbstractNavigation.prototype.rotate = function(dx, dy) {
            throw "rotate is not implemented";
        };

        /**
         * Pans the camera to a direction up/down or left/right with the same distance from the object
         * @function pan
         * @param {float} dx Window direction left/right
         * @param {float} dy Window direction up/down
         * @abstract
         * @memberOf AbstractNavigation#
         */
        AbstractNavigation.prototype.pan = function(dx, dy) {
            throw "pan is not implemented";
        };

        /**
         * Applies zooming.
         * @function zoom
         * @param {float} delta Delta zoom
         * @param {float} scale Scale
         * @abstract
         * @memberOf AbstractNavigation#
         */
        AbstractNavigation.prototype.zoom = function(delta, scale) {
            throw "zoom is not implemented";
        };

        /**
         * Zooms to a 2D position (longitude, latitude).
         * @function zoomTo
         * @param {float[]} geoPos - spatial position in decimal degree [longitude, latitude]
         * @param {Object} options - options for zoomTo
         * @abstract
         * @memberOf AbstractNavigation#
         */
        AbstractNavigation.prototype.zoomTo = function(geoPos, options) {
            throw "zoomTo is not implemented";
        };


        /**
         * Computes the view matrix
         * @function computeViewMatrix
         * @memberOf AbstractNavigation#
         * @abstract
         */
        AbstractNavigation.prototype.computeViewMatrix = function() {
            throw "computeViewMatrix not implemented";
        };

        /**
         * Callback at the end of animation (when stop method is called).
         * @callback navigationCallback
         */        

        /**
         * Basic animation from current view matrix to the given one
         * @function toViewMatrix
         * @param {Object[]} mat Destination view matrix (array of 16)
         * @param {int} fov Final zooming fov in degrees
         * @param {int} duration Duration of animation in milliseconds
         * @param {navigationCallback} callback Callback at the end of animation
         * @memberOf AbstractNavigation#
         */
        AbstractNavigation.prototype.toViewMatrix = function (mat, fov, duration, callback) {
            var navigation = this;
            var vm = this.renderContext.getViewMatrix();

            var srcViewMatrix = mat4.toMat3(vm);
            var srcQuat = quat4.fromRotationMatrix(srcViewMatrix);
            var destViewMatrix = mat4.toMat3(mat);
            var destQuat = quat4.fromRotationMatrix(destViewMatrix);
            var destFov = fov || 45;
            duration = duration || 1000;

            // Animate rotation matrix(with quaternion support), translation and fov
            var startValue = [srcQuat, [vm[12], vm[13], vm[14]], navigation.getRenderContext().getFov()];
            var endValue = [destQuat, [mat[12], mat[13], mat[14]], destFov];
            var animation = AnimationFactory.create(
                Constants.ANIMATION.Segmented,
                {
                    "duration": duration,
                    "valueSetter": function (value) {
                        // Update rotation matrix
                        var newRotationMatrix = quat4.toMat4(value[0]);

                        // Need to transpose the new rotation matrix due to bug in glMatrix
                        var viewMatrix = mat4.transpose(newRotationMatrix);

                        // Update translation
                        viewMatrix[12] = value[1][0];
                        viewMatrix[13] = value[1][1];
                        viewMatrix[14] = value[1][2];

                        // sets the new matrix
                        navigation.renderContext.setViewMatrix(viewMatrix);

                        // Update fov
                        navigation.renderContext.setFov(value[2]);

                        navigation.renderContext.requestFrame();
                    }
                });

            // Add segment
            animation.addSegment(
                0.0, startValue,
                1.0, endValue,
                function (t, a, b) {
                    var pt = Numeric.easeOutQuad(t);
                    var resQuat = quat4.create();
                    quat4.slerp(a[0], b[0], pt, resQuat);

                    var resTranslate = vec3.create();
                    vec3.lerp(a[1], b[1], pt, resTranslate);

                    var resFov = Numeric.lerp(pt, a[2], b[2]);
                    return [
                        resQuat,		// quaternions
                        resTranslate,	// translate
                        resFov          // fov
                    ];
                }
            );

            animation.onstop = function () {
                if (callback) {
                    callback();
                }
            };

            this.ctx.globe.addAnimation(animation);
            animation.start();
        };

        /**
         * Returns the rendering context.
         * @function getRenderContext
         * @returns {RenderContext} the rendering context
         * @memberOf AbstractNavigation#
         */
        AbstractNavigation.prototype.getRenderContext = function () {
            return this.renderContext;
        };

        /**
         * Sets the rendering context
         * @function setRenderContext
         * @param {RenderContext} renderContext - the rendering context to set
         * @memberOf AbstractNavigation#
         */
        AbstractNavigation.prototype.setRenderContext = function (renderContext) {
            this.renderContext = renderContext;
        };
        
        
        /**************************************************************************************************************/

        return AbstractNavigation;

    });