var FloorMarks = function () {
    var graphics,
        fm = {};

    this.setGraphics = function (sharedGraphics) {
        graphics = sharedGraphics;
    };

    this.totalMarks = function () {
        var row,
            total = 0,
            i;

        for (row in fm) {
            for (i = 0; i !== fm[row].length; i += 2) {
                total += fm[row][i + 1] - (fm[row][i]);
            }
        }

        return total;
    };

    this.showRow = function (row) {
        var i,
            rowString = '';

        for (i = 0; i !== fm[row].length; i += 2) {
            rowString += (fm[row][i]  + '-' + fm[row][i + 1] + '/');
        }

        return rowString;
    };

    this.newFloorMark = function (platform, referenceObject, verticalSpacing) {
        var i,
            row,
            x1,
            x2,
            referenceObjectX1,
            referenceObjectX2;

        row = Math.floor((platform.y + 5) / verticalSpacing);
        referenceObjectX1 = Math.floor(referenceObject.x - Math.round(referenceObject.width / 3));
        referenceObjectX2 = Math.ceil(referenceObject.x + Math.round(referenceObject.width / 3));

        // Find x1
        for (i = referenceObjectX1; i < referenceObjectX2; i++) {
            if (i >= platform.x - 1 && i <= platform.x + platform.width) {
                x1 = i;
                break;
            }
        }

        // Find x2
        for (i = referenceObjectX2; i > referenceObjectX1; i--) {
            if (i >= platform.x - 1 && i <= platform.x + platform.width) {
                x2 = i;
                break;
            }
        }

        if (x1 !== undefined && x2 !== undefined) {
            // Adjust the mark to be in increments of 5
            if (x1 % 5 !== 0) {
                x1 += 5 - (x1 % 5);
            }
            if ((x2 - x1) % 5 !== 0) {
                x2 -= (x2 - x1) % 5;
            }
            if (x2 - x1 >= 5) {
                addMark(row, x1, x2);
            }
        }
    };

    this.draw = function (height, color, verticalSpacing) {
        graphics.lineStyle(height, color);
        for (var index in fm) {
            var i,
                row = fm[index],
                height;
            for (i = 0; i < row.length; i += 2) {
                height = verticalSpacing * index + 5;
                graphics.moveTo(row[i], height);
                graphics.lineTo(row[i + 1], height);
            }
        }
    };

    var addMark = function (row, x1, x2) {
        var i,
            j,
            r;

        createRowIfNotExists(row);
        r = fm[row];

        // Simplest case
        if (r.length === 0) {
            fm[row].push(x1);
            fm[row].push(x2);
            return true;
        }

        // Search row for proper location
        for (i = 0; i < r.length; i += 2) {
            // If mark is irrelevant, exit early
            if (x1 >= r[i] && x2 <= r[i + 1]) {
                return false;
            }

            // If numbers are smaller, insert at the front and exit early
            if (x2 < r[i] - 1) {
                r.splice(i, 0, x1, x2);
                return true;
            }

            // If numbers are larger, skip ahead
            if (x1 > r[i + 1] + 1) {
                continue;
            }

            // At this point, we know that we can't skip ahead.
            // Determine where x1 belongs and then launch into
            // a separate search for x2.

            if (x1 < r[i]) {
                r[i] = x1;
                // Now find location for x2

                // Don't need to place x2, so exit early
                if (x2 <= r[i + 1]) {
                    return true;
                }

                // See if x2 can replace r[i + 1] (mark overlaps previous mark)
                if (i + 2 === r.length) {
                    // This is the last element, so we can exit early
                    r[i + 1] = x2;
                    return true;
                }
                if (i + 1 !== r.length) {
                    // Not touching the next mark, so we can exit early
                    if (x2 < r[i + 2] - 1) {
                        r[i + 1] = x2;
                        return true;
                    }
                }

                // Going to have to look farther ahead.
                // There are more marks, and this touches, overlaps,
                // or overshadows at least one.
                for (j = i + 2; j < r.length; j += 2) {
                    // Mark overshadows next mark
                    if (x2 < r[j] - 1) {
                        r.splice(i + 1, j - (i + 1), x2);
                        return true;
                    }
                    // Mark touches next mark
                    if (x2 === r[j] - 1) {
                        r.splice(i + 1, j - i);
                        return true;
                    }
                }

                // Mark overshadows everything
                r.splice(i + 1, j, x2);

                return true;
            }

            // The new mark is overlapping the back of the existing mark
            if (x1 <= r[i + 1]) {
                // x1 is irrelevent, so search for a spot for x2
                if (i + 2 === r.length) {
                    // This is the last element, so we can exit early
                    r[i + 1] = x2;
                    return true;
                }

                if (x2 < r[i + 2] - 1) {
                    // Does not touch the next mark, so just update the first mark
                    r[i + 1] = x2;
                    return true;
                }

                // Going to have to look farther ahead.
                // There are more marks, and this touches, overlaps,
                // or overshadows at least one.
                for (j = i + 2; j < r.length; j += 2) {
                    // Mark touches next mark
                    if (x2 === r[j] - 1) {
                        r.splice(i + 1, j - i);
                        return true;
                    }
                    // Mark overlaps next mark
                    if (x2 >= r[j] - 1 && x2 <= r[j + 1]) {
                        r.splice(i + 1, j - i);
                        return true;
                    }
                }

                return true;
            }

            // The new mark is touching the back of the existing mark
            if (x1 === r[i + 1] + 1) {
                // x1 is irrelevent, so search for a spot for x2
                if (i + 2 === r.length) {
                    // This is the last element, so we can exit early
                    r[i + 1] = x2;
                    return true;
                }

                if (x2 < r[i + 2] - 1) {
                    // Does not touch the next mark, so just update the first mark
                    r[i + 1] = x2;
                    return true;
                }

                // Going to have to look farther ahead.
                // There are more marks, and this touches, overlaps,
                // or overshadows at least one.
                for (j = i + 2; j < r.length; j += 2) {
                    // Mark touches next mark
                    if (x2 === r[j] - 1) {
                        r.splice(i + 1, j - i);
                        return true;
                    }
                    // Mark overlaps next mark
                    if (x2 >= r[j] - 1 && x2 <= r[j + 1]) {
                        r.splice(i + 1, j - i);
                        return true;
                    }
                }

                return true;
            }

        }

        fm[row].push(x1);
        fm[row].push(x2);

        return true;
    };

    var createRowIfNotExists = function (row) {
        if (!fm.hasOwnProperty(row)) {
            fm[row] = [];
        }
    };

};
