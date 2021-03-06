/*******************************************************************************
 * Copyright 2012-2015 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
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
/*global define: false */

/**
 * Mollweider viewer module : Sky representation in mollweide coordinate system
 */
define(["jquery"],
    function ($) {

    /*************************************************************************/

    var MollweideViewer = function (options) {

        this.mizarBaseUrl = options.mizarBaseUrl;
        var mizarWidgetAPI = options.mizar;

        var MollweideViewerCore = mizarWidgetAPI.getServiceByName(mizarWidgetAPI.SERVICE.MollweideViewer);

        var mollweideOptions = $.extend({}, options);
        mollweideOptions['mizar'] = mizarWidgetAPI.getMizarAPI();
        MollweideViewerCore.init(mollweideOptions);

        // Interaction parameters
        var dragging = false;

        // Init image background
        var canvas = document.getElementById('mollweideCanvas');
        mizarWidgetAPI.subscribeCtx(mizarWidgetAPI.EVENT_MSG.CRS_MODIFIED, MollweideViewerCore.updateGalaxyProjection);
        MollweideViewerCore.updateGalaxyProjection(mizarWidgetAPI.getContext());

        /**********************************************************************************************/

        /**
         * Get mouse position on canvas
         */
        function getMousePos(event) {
            // Difference between chrome and firefox;
            var offX = (event.offsetX) ? event.offsetX : (event.layerX - event.target.offsetLeft);
            var offY = (event.offsetY) ? event.offsetY : (event.layerY - event.target.offsetTop);

            return [offX, offY];
        }

        /**********************************************************************************************/

        // Interact with mollweide projection
        canvas.addEventListener('mousedown', function (event) {
            var mPos = getMousePos(event);
            MollweideViewerCore.updateNavigation(mPos);
            dragging = true;
            return true;
        });

        canvas.addEventListener('mousemove', function (event) {
            if (!dragging)
                return;
            var mPos = getMousePos(event);
            MollweideViewerCore.updateNavigation(mPos);
        });

        canvas.addEventListener('mouseup', function () {
            dragging = false;
        });

        /**********************************************************************************************/

        // Show/hide mollweide projection
        $('#slideArrow').click(function () {

            if (parseFloat($(this).parent().css('left')) < 0) {
                // Show
                $('#mollweideContent').css({boxShadow: "0px 0px 8px 1px rgba(255, 158, 82, 0.92)"});
                $(this).css('background-position', '0px 0px');
                $(this).parent().animate({left: '0px'}, 300);
                // Update fov when navigation modified
                mizarWidgetAPI.subscribeCtx(mizarWidgetAPI.EVENT_MSG.NAVIGATION_MODIFIED, MollweideViewerCore.updateMollweideFov);
                MollweideViewerCore.updateMollweideFov(MollweideViewerCore.getImageObj());
            }
            else {
                // Hide
                $('#mollweideContent').css({boxShadow: "none"});
                $(this).css('background-position', '0px -20px');
                $(this).parent().animate({left: '-266px'}, 300);
                mizarWidgetAPI.unsubscribeCtx(mizarWidgetAPI.EVENT_MSG.NAVIGATION_MODIFIED, MollweideViewerCore.updateMollweideFov);
            }
        });

        // Fix for Google Chrome : avoid dragging
        canvas.addEventListener("dragstart", function (event) {
            event.preventDefault();
            return false;
        });
    };

    /**********************************************************************************************/

    return MollweideViewer;

});
