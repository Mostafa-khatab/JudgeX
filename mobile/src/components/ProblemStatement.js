import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Terminal, Layout as LayoutIcon } from 'lucide-react-native';

const ProblemStatement = ({ task }) => {
  if (!task) return null;

  const cleanText = (text) => {
    if (!text) return '';
    
    // 1. Remove KaTeX/MathML completely
    let cleaned = text
      .replace(/<span class="katex"[\s\S]*?<\/span>/gi, '')
      .replace(/<math[\s\S]*?<\/math>/gi, '')
      .replace(/<annotation[\s\S]*?<\/annotation>/gi, '');

    // 2. Remove redundant header section (Meta-info)
    const redundantPatterns = [
        /time limit per test[\s\S]*?seconds?/gi,
        /memory limit per test[\s\S]*?(megabytes|mb)/gi,
        /standard (input|output)/gi,
        /points\s*:\s*\d+/gi,
        /difficulty\s*:\s*\w+/gi,
        /tags\s*:\s*[\s\w\d,\-]*/gi,
        /Problem Statement/gi,
        /^[A-Z]\.\s+.*$/m,
    ];
    redundantPatterns.forEach(p => { cleaned = cleaned.replace(p, ''); });

    // 3. Strip ALL HTML tags
    cleaned = cleaned.replace(/<[^>]*>/g, ' ');

    // 4. Unescape entities and strip Markdown/Quote artifacts
    cleaned = cleaned
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '')
      .replace(/["'`#\*_~]+/g, '') // Aggressively remove backticks, quotes, and markdown symbols
      .replace(/\s+/g, ' ')       // Collapse whitespace to single spaces
      .trim();

    // 5. Deduplicate math-like repeated patterns (e.g., "10-i 10-i")
    cleaned = cleaned.replace(/\b([\w\d\-\$]+)\b\s+\1\b/g, '$1');

    return cleaned;
  };

  const cleanExample = (text) => {
    if (!text) return '';
    return text
      .replace(/<[^>]*>/g, ' ')
      .replace(/["'`]+/g, '') // Remove backticks and quotes
      .replace(/Input:?/gi, '')
      .replace(/Output:?/gi, '')
      .trim();
  };

  // Section parsing
  const sections = { description: '', input: '', output: '', examples: [], note: '' };
  
  const workingText = task
    .replace(/<span class="katex"[\s\S]*?<\/span>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n');

  const sectionHeaders = ['Input Specification', 'Output Specification', 'Input', 'Output', 'Examples', 'Example', 'Note'];
  const splitter = new RegExp(`\\s+(${sectionHeaders.join('|')})\\s+`, 'i');
  const parts = workingText.replace(/<[^>]*>/g, ' ').split(splitter);

  sections.description = cleanText(parts[0]);
  for (let i = 1; i < parts.length; i += 2) {
    const header = parts[i].toLowerCase();
    const content = parts[i+1];
    if (header.includes('input')) sections.input = cleanText(content);
    else if (header.includes('output')) sections.output = cleanText(content);
    else if (header.includes('note')) sections.note = cleanText(content);
    else if (header.includes('example')) {
      const exInputMatch = content.match(/Input:?\s*([\s\S]*?)(?=Output:?|$)/i);
      const exOutputMatch = content.match(/Output:?\s*([\s\S]*?)(?=Input:?|$)/i);
      if (exInputMatch && exOutputMatch) {
        sections.examples.push({
          input: cleanExample(exInputMatch[1]),
          output: cleanExample(exOutputMatch[1])
        });
      }
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.mainHeading}>Problem Statement</Text>
        
        <View style={styles.textContainer}>
          <Text style={styles.bodyText}>{sections.description}</Text>
        </View>

        {sections.input ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Input Specification</Text>
            <View style={styles.textContainer}>
              <Text style={styles.bodyText}>{sections.input}</Text>
            </View>
          </View>
        ) : null}

        {sections.output ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Output Specification</Text>
            <View style={styles.textContainer}>
              <Text style={styles.bodyText}>{sections.output}</Text>
            </View>
          </View>
        ) : null}

        {sections.examples.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Sample Cases</Text>
            {sections.examples.map((ex, i) => (
              <View key={i} style={styles.exampleCard}>
                <View style={styles.ioBlock}>
                  <View style={styles.ioHeader}>
                    <Terminal size={14} color="#0ea5e9" />
                    <Text style={styles.ioLabel}>Input</Text>
                  </View>
                  <View style={styles.codeBox}>
                    <Text style={styles.codeText}>{ex.input}</Text>
                  </View>
                </View>
                <View style={[styles.ioBlock, { marginTop: 15 }]}>
                  <View style={styles.ioHeader}>
                    <LayoutIcon size={14} color="#10b981" />
                    <Text style={[styles.ioLabel, { color: '#10b981' }]}>Output</Text>
                  </View>
                  <View style={[styles.codeBox, { borderLeftColor: '#10b981' }]}>
                    <Text style={styles.codeText}>{ex.output}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {sections.note ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Note</Text>
            <View style={styles.textContainer}>
              <Text style={styles.bodyText}>{sections.note}</Text>
            </View>
          </View>
        ) : null}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    backgroundColor: '#171717',
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  mainHeading: {
    color: '#0ea5e9',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  textContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  bodyText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left',
  },
  section: { marginTop: 24, width: '100%' },
  sectionHeading: {
    color: '#0ea5e9',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
    paddingBottom: 4,
    textTransform: 'uppercase',
  },
  exampleCard: { marginBottom: 25 },
  ioBlock: { width: '100%' },
  ioHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  ioLabel: { color: '#0ea5e9', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  codeBox: {
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#262626',
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  codeText: {
    color: '#d4d4d8',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 20,
    textAlign: 'left',
  },
});

export default ProblemStatement;
