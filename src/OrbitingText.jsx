
// src/OrbitingText.jsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const toRadians = (degrees) => degrees * (Math.PI / 180);

const OrbitingText = ({
  text,
  radius,
  animationDuration,
  direction = 'cw', // 'cw' or 'ccw'
  id,
  startRotation = 0, // Initial angular offset for the text block (degrees)
  fixedArcAngle = 160, // Degrees the text block will span on the circle. Adjust for text length and desired curve.
  characterKerning = 1.0, // Adjusts spacing between characters. >1 for wider, <1 for tighter.
  fontSize = '1.1rem',
  fontWeight = 500,
  textColor = '#FFFFFF',
  textShadow = '0px 0px 8px rgba(0,0,0,0.9), 0px 0px 15px rgba(0,0,0,0.7)',
}) => {
  const characters = useMemo(() => text.split(''), [text]);

  // This is the base angular width estimated per character if fixedArcAngle is not used.
  // Not critical if fixedArcAngle is typically set, but provides a fallback.
  const estimatedCharArcBase = 7; // degrees

  const totalTextArc = useMemo(() => {
    if (fixedArcAngle !== null && fixedArcAngle !== undefined) {
      return fixedArcAngle;
    }
    // Fallback if fixedArcAngle is not provided
    return characters.length * estimatedCharArcBase * characterKerning;
  }, [characters.length, fixedArcAngle, estimatedCharArcBase, characterKerning]);

  return (
    <motion.div
      id={id}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 0, // Purely a pivot point, no intrinsic dimensions
        height: 0,
        // This div itself is the center of rotation for the character group
      }}
      initial={{ rotate: startRotation }}
      animate={{ rotate: startRotation + (direction === 'cw' ? 360 : -360) }}
      transition={{
        duration: animationDuration,
        ease: 'linear',
        repeat: Infinity,
      }}
    >
      {/* Characters are positioned relative to this rotating pivot */}
      {characters.map((char, index) => {
        // Calculate the angle for this character's center within the text's allocated arc.
        // The text block spans from -totalTextArc / 2 to +totalTextArc / 2.
        let angleForChar;
        if (characters.length === 1) {
          angleForChar = 0; // Single character at the center of its arc
        } else {
          // Distribute characters along the arc
          angleForChar = (-totalTextArc / 2) + (index * (totalTextArc / (characters.length - 1)));
        }
        
        // Calculate (x, y) coordinates for the character on the circle
        const x = radius * Math.cos(toRadians(angleForChar));
        const y = radius * Math.sin(toRadians(angleForChar));

        // Calculate rotation for the character itself to be tangent to the circle
        // (0 degrees is to the right, so +90 makes baseline tangent)
        const charVisualRotation = angleForChar + 90;

        return (
          <motion.span
            key={char + index}
            style={{
              position: 'absolute',
              left: 0, // Base for transform
              top: 0,  // Base for transform
              fontSize,
              fontWeight,
              color: textColor,
              textShadow,
              whiteSpace: 'pre', // Preserve spaces
              textAlign: 'center', // Helps center char if it has width
              // CSS transforms for positioning and rotating each character:
              // Framer Motion's x, y, rotate shorthand for transform
              x: `${x}px`,
              y: `${y}px`,
              rotate: `${charVisualRotation}deg`,
              // To better center the character at its (x,y) point, adjust transform-origin
              // or apply translate(-50%, -50%). Framer's x,y act like translate.
              // For single characters, centering is key.
              // We want the (x,y) point to be the center of the character.
              // The x,y props translate the top-left. To center, add:
              originX: 0.5, // Experimental, might need translateX/Y with calc or measure
              originY: 0.5,
              // A common way to center a char: set its width and then translate by -50% of width/height.
              // For simplicity, the current (x,y) points to top-left of char bounding box.
              // User can fine-tune visually.
              // Using `display: 'inline-block'` and `transformOrigin: 'center center'` for the span.
              display: 'inline-block',
              transformOrigin: 'center center',
            }}
          >
            {char}
          </motion.span>
        );
      })}
    </motion.div>
  );
};

export default OrbitingText;
