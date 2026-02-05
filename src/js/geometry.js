/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */

/**
 * Geometry functions.
 * All point parameters and return values are represented by 2-element flat arrays of [x,y].
 */
export default class Geometry {

    /**
     * Gets the translation vector from moving a point.
     * @param {[]} originalPoint 2-element flat array of x,y
     * @param {[]} newPoint 2-element flat array of x,y
     * @returns [] 2-element flat array representing the vector
     */
    static translationVector(originalPoint, newPoint) {
        return [newPoint.at(0) - originalPoint.at(0), newPoint.at(1) - originalPoint.at(1)];
    }

    /**
     * Applies a vector to a point.
     * @param {[]} vector 2-element flat array representing the vector
     * @param {[]} point 2-element flat array of x,y
     * @param {number} adjustmentFactor amount to increase/reduce the movement
     * @returns [] new 2-element flat array of x,y
     */
    static applyTranslationVector(vector, point, adjustmentFactor = 1) {
        const vectorToApply = adjustmentFactor === 1 ? vector : [vector.at(0) / adjustmentFactor, vector.at(1) / adjustmentFactor];
        return [
            point.at(0) + vectorToApply.at(0),
            point.at(1) + vectorToApply.at(1)
        ];
    }

    /**
     * Gets the mid-point of a line.
     * @param {[]} startPoint 2-element flat array of x,y
     * @param {[]} endPoint 2-element flat array of x,y
     * @returns [] new 2-element flat array of x,y
     */
    static midPoint(startPoint, endPoint) {
        const midX = (startPoint.at(0) + endPoint.at(0)) / 2;
        const midY = (startPoint.at(1) + endPoint.at(1)) / 2;
        return [midX, midY];
    }

    /**
     * Gets the Euclidean distance between two points.
     * @param {[]} startPoint 2-element flat array of x,y
     * @param {[]} endPoint 2-element flat array of x,y
     * @returns number
     */
    static distance(startPoint, endPoint) {
        return Math.hypot(endPoint.at(0) - startPoint.at(0), endPoint.at(1) - startPoint.at(1));
    }
}