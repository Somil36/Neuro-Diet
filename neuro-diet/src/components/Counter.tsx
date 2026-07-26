import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TextInput, Pressable, PanResponder } from 'react-native';

const DigitScroll = ({ digit, fontSize, textColor, fontWeight, height }: any) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // The digit can be a number (0-9) or a string (like '.')
    // If it's a number, we translate to (digit * height * -1)
    let targetIndex = 0;
    if (digit === '.') {
      targetIndex = 10; // We'll put '.' at the end of the 0-9 array
    } else {
      targetIndex = parseInt(digit, 10) || 0;
    }

    Animated.timing(animatedValue, {
      toValue: targetIndex * height * -1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [digit, height]);

  const characters = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'];

  return (
    <View style={{ height, overflow: 'hidden' }}>
      <Animated.View style={{ transform: [{ translateY: animatedValue }] }}>
        {characters.map((char, i) => (
          <Text key={i} style={{ fontSize, color: textColor, fontWeight, height, textAlign: 'center', lineHeight: height }}>
            {char}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
};

// Pixels of vertical drag per +/-1 step - small enough to feel responsive,
// large enough that a tap (a few px of jitter) doesn't get mistaken for a drag.
const PX_PER_STEP = 12;
const DRAG_THRESHOLD = 4;

export default function Counter({
  value,
  places,
  fontSize = 80,
  padding = 5,
  gap = 10,
  textColor = 'white',
  fontWeight = 900,
  min = 0,
  max = 999,
  onChange
}: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(value));
  const inputRef = useRef<TextInput>(null);

  // Keep refs in sync so the PanResponder's handlers (created once) always
  // see the latest value/onChange instead of closing over stale ones.
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const dragStartValue = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_evt, gesture) => Math.abs(gesture.dy) > DRAG_THRESHOLD,
      onPanResponderGrant: () => {
        dragStartValue.current = valueRef.current;
      },
      onPanResponderMove: (_evt, gesture) => {
        // Dragging up increases the value (like pulling a rolodex toward you).
        const steps = Math.round(-gesture.dy / PX_PER_STEP);
        const next = clamp(dragStartValue.current + steps);
        if (next !== valueRef.current) {
          onChangeRef.current?.(next);
        }
      },
    })
  ).current;

  // Height of each digit slot
  const cellHeight = fontSize * 1.2;

  // Format the value based on places array
  // For example, if value = 75, places = [100, 10, 1]
  // We want to extract '0', '7', '5'
  const formatValue = (val: number, placesArr: number[]) => {
    let strVal = String(val);
    if (strVal.includes('.')) {
      // If it's a decimal, just use the string characters directly for simplicity,
      // but the prompt implies `places` dictates the layout.
      // Let's just pad the string to match the places length if it's an integer,
      // or just render the characters of the string directly.
      const parts = strVal.split('.');
      strVal = parts[0].padStart(placesArr.length, '0') + '.' + parts[1];
    } else {
      strVal = strVal.padStart(placesArr.length, '0');
    }
    return strVal.split('');
  };

  const digits = formatValue(value, places);

  const handlePress = () => {
    setIsEditing(true);
    setInputValue(String(value));
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const num = parseFloat(inputValue);
    if (!isNaN(num) && onChange) {
      onChange(clamp(num));
    }
  };

  return (
    // panHandlers go on a wrapping View, not the Pressable below: Pressable
    // manages its own internal responder wiring and silently drops unknown
    // props like onMoveShouldSetResponderCapture, so a raw View is needed to
    // actually forward them to the host element. The View's
    // onStartShouldSetPanResponder is false, letting the Pressable's own tap
    // detection work normally; once a vertical drag crosses the threshold,
    // the capture-phase handler steals the responder from the Pressable for
    // the rest of the gesture - the standard "nested responder" pattern.
    <View {...panResponder.panHandlers}>
      <Pressable
        onPress={handlePress}
        style={{ flexDirection: 'row', alignItems: 'center', gap, padding, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 }}
      >
        {isEditing ? (
          <TextInput
            ref={inputRef}
            value={inputValue}
            onChangeText={setInputValue}
            onBlur={handleBlur}
            onSubmitEditing={handleBlur}
            keyboardType="numeric"
            style={{
              fontSize,
              color: textColor,
              fontWeight: fontWeight as any,
              height: cellHeight,
              minWidth: 100,
              textAlign: 'center',
              padding: 0,
              margin: 0,
            }}
          />
        ) : (
          digits.map((digit, index) => (
            <DigitScroll
              key={index}
              digit={digit}
              fontSize={fontSize}
              textColor={textColor}
              fontWeight={fontWeight}
              height={cellHeight}
            />
          ))
        )}
      </Pressable>
    </View>
  );
}
