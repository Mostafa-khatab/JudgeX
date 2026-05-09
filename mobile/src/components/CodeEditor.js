import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';

const CPP_KEYWORDS = [
  'int', 'include', 'return', 'using', 'namespace', 'void', 'if', 'else', 'while', 'for', 
  'break', 'continue', 'cin', 'cout', 'endl', 'std', 'bool', 'char', 'float', 'double', 
  'string', 'vector', 'map', 'set', 'long', 'short', 'unsigned', 'const', 'static', 
  'class', 'struct', 'public', 'private', 'protected', 'template', 'typename', 
  'nullptr', 'true', 'false', 'main', 'auto', 'new', 'delete', 'try', 'catch', 'throw'
];

const COLORS = {
  background: '#0d1117',
  gutterBackground: '#0d1117',
  gutterBorder: '#30363d',
  lineNumber: '#8b949e',
  text: '#ffffff', // Pure white for maximum contrast
  keyword: '#ff7b72', // Bright red
  builtin: '#79c0ff', // Bright blue
  string: '#a5d6ff', // Light blue
  comment: '#8b949e', // Gray
  number: '#d2a8ff', // Purple
  preprocessor: '#ffa657', // Orange
  operator: '#79c0ff', // Blue
};

const CodeEditor = ({ code, onChangeCode, language = 'cpp' }) => {
  const [contentHeight, setContentHeight] = useState(0);
  const scrollViewRef = useRef(null);
  const inputRef = useRef(null);

  const highlightCode = (text) => {
    if (!text) return null;

    // Simple tokenizer (this is a basic version)
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const parts = [];
      let currentPos = 0;

      // Match comments
      const commentMatch = line.match(/\/\/.*$/);
      let lineText = line;
      let commentPart = null;
      if (commentMatch) {
        lineText = line.substring(0, commentMatch.index);
        commentPart = line.substring(commentMatch.index);
      }

      // Tokenize the rest
      const tokens = lineText.split(/(\W)/); // Split by any non-word character and include it
      
      tokens.forEach((token, i) => {
        if (token === undefined || token === '') return;

        let style = { color: COLORS.text };

        if (CPP_KEYWORDS.includes(token)) {
          if (['if', 'else', 'while', 'for', 'return', 'break', 'continue'].includes(token)) {
            style = { color: COLORS.keyword };
          } else {
            style = { color: COLORS.builtin };
          }
        } else if (/^\d+$/.test(token)) {
          style = { color: COLORS.number };
        } else if (token.startsWith('"') || token.endsWith('"')) {
          style = { color: COLORS.string };
        } else if (token.startsWith('#')) {
          style = { color: COLORS.preprocessor };
        } else if (['+', '-', '*', '/', '=', '<', '>', '&', '|', '!', '?', ':', '.', ';', '(', ')', '{', '}', '[', ']'].includes(token)) {
          style = { color: COLORS.operator };
        }

        parts.push(
          <Text key={`${lineIdx}-${i}`} style={[styles.codeText, style]}>
            {token}
          </Text>
        );
      });

      if (commentPart) {
        parts.push(
          <Text key={`${lineIdx}-comment`} style={[styles.codeText, { color: COLORS.comment }]}>
            {commentPart}
          </Text>
        );
      }

      return (
        <View key={lineIdx} style={styles.lineRow}>
          {parts}
        </View>
      );
    });
  };

  const lineCount = code.split('\n').length || 1;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.mainScrollView}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.gutter}>
          {lineNumbers.map((num) => (
            <Text key={num} style={styles.lineNumber}>
              {num}
            </Text>
          ))}
        </View>
        <ScrollView
          style={styles.horizontalScrollView}
          contentContainerStyle={styles.horizontalScrollContent}
          horizontal={true}
          showsHorizontalScrollIndicator={true}
        >
          <View style={styles.editorWrapper}>
            <View style={styles.highlightOverlay}>
              {highlightCode(code)}
            </View>
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              multiline
              value={code}
              onChangeText={onChangeCode}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              underlineColorAndroid="transparent"
              selectionColor="#58a6ff"
              textAlignVertical="top"
              scrollEnabled={false}
              allowFontScaling={false}
            />
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.gutterBorder,
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 400,
  },
  gutter: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 50,
    backgroundColor: COLORS.gutterBackground,
    paddingTop: 20,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.gutterBorder,
    zIndex: 10,
  },
  lineNumber: {
    color: COLORS.lineNumber,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 24,
    height: 24,
    textAlign: 'right',
    width: '100%',
    paddingRight: 10,
  },
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    flexGrow: 1,
  },
  horizontalScrollView: {
    flex: 1,
  },
  horizontalScrollContent: {
    minWidth: '100%',
  },
  editorWrapper: {
    flex: 1,
    minWidth: 1000,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: 'transparent',
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 24,
    paddingTop: 20,
    paddingLeft: 55,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  highlightOverlay: {
    paddingTop: 20,
    paddingLeft: 55,
    zIndex: 1,
    minHeight: '100%',
  },
  lineRow: {
    flexDirection: 'row',
    height: 24,
    alignItems: 'center',
  },
  codeText: {
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 24,
  },
});

export default CodeEditor;
