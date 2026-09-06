import React, { useLayoutEffect, useRef, useState } from "react";
import { Box, Text, useInput } from "ink";
import { SemanticColors, TuiGlyphs } from "../../shared/DesignTokens.js";

const INPUT_BACKGROUND = SemanticColors.inputField;
const INPUT_MIN_WIDTH = 42;

interface WizardTextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  focused?: boolean;
  error?: string;
}

export function WizardTextInput({
  label,
  value,
  onChange,
  placeholder,
  focused = true,
  error,
}: WizardTextInputProps): React.ReactElement {
  const [cursorPosition, setCursorPosition] = useState(
    Array.from(value).length,
  );
  const editingRef = useRef({ value, cursorPosition });

  useLayoutEffect(() => {
    if (value !== editingRef.current.value) {
      const nextPosition = Array.from(value).length;
      editingRef.current = { value, cursorPosition: nextPosition };
      setCursorPosition(nextPosition);
    }
  }, [value]);

  useInput(
    (input, key) => {
      const characters = Array.from(editingRef.current.value);
      const position = editingRef.current.cursorPosition;
      const moveCursor = (nextPosition: number) => {
        editingRef.current.cursorPosition = nextPosition;
        setCursorPosition(nextPosition);
      };
      const changeValue = (nextPosition: number) => {
        const nextValue = characters.join("");
        editingRef.current = { value: nextValue, cursorPosition: nextPosition };
        setCursorPosition(nextPosition);
        onChange(nextValue);
      };

      if (key.leftArrow) {
        moveCursor(Math.max(0, position - 1));
        return;
      }

      if (key.rightArrow) {
        moveCursor(Math.min(characters.length, position + 1));
        return;
      }

      if (key.backspace) {
        if (position > 0) {
          characters.splice(position - 1, 1);
          changeValue(position - 1);
        }
        return;
      }

      if (key.delete) {
        if (position < characters.length) {
          characters.splice(position, 1);
          changeValue(position);
        }
        return;
      }

      if (key.return || key.tab || key.escape || key.upArrow || key.downArrow) {
        return;
      }

      if (input && !key.ctrl && !key.meta) {
        const insertedCharacters = Array.from(input);
        characters.splice(position, 0, ...insertedCharacters);
        changeValue(position + insertedCharacters.length);
      }
    },
    { isActive: focused },
  );

  const showPlaceholder = value.length === 0 && placeholder !== undefined;
  const characters = Array.from(value);

  return (
    <Box flexDirection="column" gap={0}>
      <Text color={SemanticColors.inputLabel} bold={focused} dimColor>
        {label}
      </Text>
      <Box
        marginLeft={0}
        backgroundColor={INPUT_BACKGROUND}
        paddingX={1}
        minWidth={INPUT_MIN_WIDTH}
      >
        {showPlaceholder ? (
          <Text
            color={SemanticColors.inputPlaceholderText}
            backgroundColor={INPUT_BACKGROUND}
          >
            {placeholder}
            {focused && (
              <Text
                color={SemanticColors.inputText}
                backgroundColor={INPUT_BACKGROUND}
              >
                ▎
              </Text>
            )}
          </Text>
        ) : (
          <Text
            color={SemanticColors.inputText}
            backgroundColor={INPUT_BACKGROUND}
          >
            {focused
              ? `${characters.slice(0, cursorPosition).join("")}▎${characters.slice(cursorPosition).join("")}`
              : value}
          </Text>
        )}
      </Box>
      {error !== undefined && (
        <Box marginLeft={0}>
          <Text color={SemanticColors.error}>
            {TuiGlyphs.cross} {error}
          </Text>
        </Box>
      )}
    </Box>
  );
}
