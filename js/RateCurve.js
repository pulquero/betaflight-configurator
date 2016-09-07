'use strict';

var minRc = 1000;
var midRc = 1500;
var maxRc = 2000;

var RateCurve = function (useLegacyCurve) {
    this.useLegacyCurve = useLegacyCurve;

    this.constrain = function (value, min, max) {
        return Math.max(min, Math.min(value, max));
    };

    this.rcCommand = function (rcData, rcRate, deadband) {
        var tmp = Math.min(Math.max(Math.abs(rcData - midRc) - deadband, 0), 500);

        var result = tmp * rcRate;

        if (rcData < midRc) {
            result = -result;
        }

        return result;
    };

    this.drawRateCurve = function (rate, rcRate, rcExpo, superExpoActive, deadband, maxAngularVel, context, width, height) {
        var canvasHeightScale = height / (2 * maxAngularVel);

        var stepWidth = context.lineWidth;

        context.save();
        context.translate(width / 2, height / 2);

        context.beginPath();
        var rcData = minRc;
        context.moveTo(-500, -canvasHeightScale * this.rcCommandRawToDegreesPerSecond(rcData, rate, rcRate, rcExpo, superExpoActive, deadband));
        rcData = rcData + stepWidth;
        while (rcData <= maxRc) {
            context.lineTo(rcData - midRc, -canvasHeightScale * this.rcCommandRawToDegreesPerSecond(rcData, rate, rcRate, rcExpo, superExpoActive, deadband));

            rcData = rcData + stepWidth;
        }
        context.stroke();

        context.restore();
    };

    this.drawLegacyRateCurve = function (rate, rcRate, rcExpo, context, width, height) {
        // math magic by englishman
        var rateY = height * rcRate;
        rateY = rateY + (1 / (1 - ((rateY / height) * rate)));

        // draw
        context.beginPath();
        context.moveTo(0, height);
        context.quadraticCurveTo(width * 11 / 20, height - ((rateY / 2) * (1 - rcExpo)), width, height - rateY);
        context.stroke();
    }
};

RateCurve.prototype.rcCommandRawToDegreesPerSecond = function (rcData, rate, rcRate, rcExpo, superExpoActive, deadband) {
    var angleRate;
    if (rate !== undefined && rcRate !== undefined && rcExpo !== undefined) {
<<<<<<< f9ea2c8ee4e9635ef6191b0d8b160dbb44128d82
        if (rcRate > 2) {
            rcRate = rcRate + (rcRate - 2) * 14.54;
        }
        var inputValue = this.rcCommand(rcData, rcRate);
=======
        var inputValue = this.rcCommand(rcData, rcRate, deadband);
>>>>>>> Added deadband to curves and model calculations. Also fixed rates curve bug in pre 2.8.
        var maxRc = 500 * rcRate;
        
        var expoPower;
        var rcRateConstant;
        if (semver.gte(CONFIG.flightControllerVersion, "3.0.0")) {
            expoPower = 3;
            rcRateConstant = 200;
        } else {
            expoPower = 2;
            rcRateConstant = 205.85;
        }

        if (rcExpo > 0) {
            var absRc = Math.abs(inputValue) / maxRc;
            inputValue =  inputValue * Math.pow(absRc, expoPower) * rcExpo + inputValue * (1-rcExpo);
        }

        var rcInput = inputValue / maxRc;

        if (superExpoActive) {
            var rcFactor = 1 / this.constrain(1 - Math.abs(rcInput) * rate, 0.01, 1);
            angleRate = rcRateConstant * rcRate * rcInput; // 200 should be variable checked on version (older versions it's 205,9)
            angleRate = angleRate * rcFactor;
        } else {
            angleRate = (((rate * 100) + 27) * inputValue / 16) / 4.1; // Only applies to old versions ?
        }

        angleRate = this.constrain(angleRate, -1998, 1998); // Rate limit protection
    }

    return angleRate;
};

RateCurve.prototype.getMaxAngularVel = function (rate, rcRate, rcExpo, superExpoActive, deadband) {
    var maxAngularVel;
    if (!this.useLegacyCurve) {
        maxAngularVel = this.rcCommandRawToDegreesPerSecond(maxRc, rate, rcRate, rcExpo, superExpoActive, deadband);
    }

    return maxAngularVel;
};

RateCurve.prototype.draw = function (rate, rcRate, rcExpo, superExpoActive, deadband, maxAngularVel, context) {
    if (rate !== undefined && rcRate !== undefined && rcExpo !== undefined) {
        var height = context.canvas.height;
        var width = context.canvas.width;

        if (this.useLegacyCurve) {
            this.drawLegacyRateCurve(rate, rcRate, rcExpo, context, width, height);
        } else {
            this.drawRateCurve(rate, rcRate, rcExpo, superExpoActive, deadband, maxAngularVel, context, width, height);
        }
    }
};
