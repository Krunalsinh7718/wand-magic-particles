uniform float uTime;
uniform vec2 uResolution;
uniform float uSize;
uniform float uProgress;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uMinY;
uniform float uMaxY;
uniform vec3 uFrogWorldPos;
uniform vec3 uWandWorldPos;
uniform vec3 uPrinceWorldPos;

attribute vec3 aPositionTarget;
attribute vec3 aPositionTarget1;
attribute float aSize;

varying vec3 vColor;

#include "./simplexNoise3d.glsl"

void main()
{

    vec3 newPos = position;

    newPos *=
    (
        sin((uTime * 0.5) + aSize * 10.0) *
        sin((uTime * 0.5) + aSize * 10.0)
    ) * 0.3;


    // ======================================================
    // TARGET POSITIONS
    // ======================================================

    vec3 frogPosition =
        aPositionTarget +
        (uFrogWorldPos - uWandWorldPos);

    vec3 princePosition =
        aPositionTarget1 +
        (uPrinceWorldPos - uWandWorldPos);


    // ======================================================
    // NOISE
    // ======================================================

    float noiseOrigin =
        simplexNoise3d(newPos * 0.2);

    float noiseFrog =
        simplexNoise3d(frogPosition * 0.2);

    float noisePrince =
        simplexNoise3d(princePosition * 0.2);


    // ======================================================
    // PHASE PROGRESS
    // ======================================================

    float localProgress;
    float noise;
    vec3 centerPosition;

    if(uProgress < 0.5)
    {
        //----------------------------------
        // WAND -> FROG
        //----------------------------------

        localProgress = uProgress * 2.0;

        noise = mix(
            noiseOrigin,
            noiseFrog,
            localProgress
        );

        noise = smoothstep(
            -1.0,
            1.0,
            noise
        );

        float duration = 0.4;

        float delay =
            (1.0 - duration) *
            noise;

        float end =
            delay + duration;

        float delayedProgress =
            smoothstep(
                delay,
                end,
                localProgress
            );

        centerPosition = mix(
            newPos,
            frogPosition,
            delayedProgress
        );
    }
    else
    {
        //----------------------------------
        // FROG -> PRINCE
        //----------------------------------

        localProgress =
            (uProgress - 0.5) * 2.0;

        noise = mix(
            noiseFrog,
            noisePrince,
            localProgress
        );

        noise = smoothstep(
            -1.0,
            1.0,
            noise
        );

        float duration = 0.4;

        float delay =
            (1.0 - duration) *
            noise;

        float end =
            delay + duration;

        float delayedProgress =
            smoothstep(
                delay,
                end,
                localProgress
            );

        centerPosition = mix(
            frogPosition,
            princePosition,
            delayedProgress
        );
    }


    // ======================================================
    // TORNADO
    // ONLY ACTIVE DURING FROG -> PRINCE
    // ======================================================

    vec3 mixedPosition = centerPosition;

    if(uProgress > 0.5)
    {
        float tornadoProgress =
            (uProgress - 0.5) * 2.0;

        float tornadoStrength =
            sin(tornadoProgress * 3.14159265);

        float heightFactor =
            smoothstep(
                uMinY,
                uMaxY,
                centerPosition.y
            );

        float rotationMultiplier =
            mix(
                2.0,
                1.0,
                aPositionTarget.y
            );

        float angle =
            tornadoProgress *
            25.0 *
            rotationMultiplier +
            noise * 20.0;

        float funnelShape =
            pow(heightFactor, 3.0);

        float radius =
            tornadoStrength *
            (0.5 + noise);

        radius *=
            mix(
                0.03,
                1.0,
                funnelShape
            );

        vec3 tornadoOffset;

        tornadoOffset.x =
            cos(angle) * radius;

        tornadoOffset.z =
            sin(angle) * radius;

        tornadoOffset.y =
            (noise - 0.5) *
            tornadoStrength;

        mixedPosition += tornadoOffset;
    }
    
    // Final position
    vec4 modelPosition = modelMatrix * vec4(mixedPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Point size
    float newPontSize = max(uSize * 4.0 * uProgress, 0.01);
    gl_PointSize = newPontSize * aSize * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);

    //varyings
    vColor = mix(uColorA, uColorB, 0.5);
}