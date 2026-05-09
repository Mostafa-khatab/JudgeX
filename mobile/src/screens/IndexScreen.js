import React from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  StatusBar, 
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  ScrollView,
  Platform
} from 'react-native';
import { 
  ArrowRight, 
  ChevronRight, 
  Trophy, 
  Moon, 
  Code2, 
  Mail, 
  Users,
  LayoutGrid
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Logo from '../components/Logo';
import theme from '../theme/theme';

const { width, height } = Dimensions.get('window');

const IndexScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Glows - Much more prominent now */}
      <View style={styles.glowContainer} pointerEvents="none">
        <View style={styles.centralLight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <Logo size={42} />
          <View style={styles.navLinks}>
            <Text style={styles.navText}>home</Text>
            <Text style={styles.navText}>product</Text>
            <Text style={styles.navText}>developer</Text>
            <Text style={[styles.navText, { marginRight: 0 }]}>about-me</Text>
          </View>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')}
            style={styles.loginBtn}
          >
            <Text style={styles.loginBtnText}>login</Text>
            <ArrowRight size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.sloganWrapper}>
            {/* On Web we can use CSS gradient text, on Native we use a vibrant fallback */}
            <Text style={styles.sloganText}>slogan</Text>
          </View>
          
          <Text style={styles.heroDescription}>description</Text>

          <View style={styles.heroActions}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('SignUp')}
              style={styles.getStartedBtn}
            >
              <Text style={styles.getStartedText}>get-started</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.learnMoreBtn}>
              <Text style={styles.learnMoreText}>learn-more</Text>
              <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Product & Appearance Row */}
        <View style={styles.featureRow}>
          {/* Product Card */}
          <View style={styles.featureCard}>
             <View style={styles.hexagonIcon}>
                <View style={styles.hexGroup}>
                   <View style={[styles.hexSmall, { backgroundColor: '#0EA5E9' }]}>
                      <Text style={styles.hexValue}>7749</Text>
                   </View>
                   <View style={[styles.hexSmall, { backgroundColor: '#65A30D' }]}>
                      <Users size={10} color="white" />
                   </View>
                   <View style={[styles.hexSmall, { backgroundColor: '#CA8A04' }]}>
                      <Trophy size={10} color="white" />
                   </View>
                </View>
             </View>
             <Text style={styles.featureTitle}>product-title</Text>
             <Text style={styles.featureDesc}>product-description</Text>
             <TouchableOpacity style={styles.linkRow}>
                <Text style={styles.linkText}>view-questions</Text>
                <ChevronRight size={14} color="#0EA5E9" style={{ marginLeft: 2 }} />
             </TouchableOpacity>
          </View>

          {/* Appearance Card */}
          <View style={styles.featureCard}>
             <View style={styles.hexagonIcon}>
                <View style={[styles.hexSmall, styles.hexLarge, { backgroundColor: '#334155' }]}>
                   <Moon size={24} color="white" />
                </View>
             </View>
             <Text style={styles.featureTitle}>appearance</Text>
             <Text style={styles.featureDesc}>appearance-description</Text>
             <TouchableOpacity style={styles.themeToggle}>
                <Moon size={16} color="#8B949E" />
             </TouchableOpacity>
          </View>
        </View>

        {/* Developer Section */}
        <View style={styles.developerSection}>
           <View style={styles.hexagonIcon}>
              <View style={[styles.hexSmall, styles.hexLarge, { backgroundColor: '#0D9488' }]}>
                 <Code2 size={24} color="white" />
              </View>
           </View>
           <Text style={[styles.featureTitle, { color: '#0D9488', marginTop: 12 }]}>developer</Text>
           <Text style={[styles.featureDesc, { textAlign: 'center' }]}>developer-description</Text>

           {/* Code Mockup */}
           <View style={styles.codeMockup}>
              <View style={styles.codeHeader}>
                 <View style={styles.codeTabs}>
                    <View style={styles.activeTab}>
                       <Text style={styles.tabTextActive}>C</Text>
                    </View>
                    <Text style={styles.tabText}>C++</Text>
                    <Text style={styles.tabText}>Python</Text>
                 </View>
              </View>
              <View style={styles.codeContent}>
                 <View style={styles.lineNumbers}>
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <Text key={n} style={styles.lineNumber}>{n}</Text>
                    ))}
                 </View>
                 <View style={styles.codeLines}>
                    <Text style={styles.codeText}><Text style={{ color: '#F472B6' }}>#include</Text> <Text style={{ color: '#A3E635' }}>&lt;stdio.h&gt;</Text></Text>
                    <Text style={styles.codeText}></Text>
                    <Text style={styles.codeText}><Text style={{ color: '#F87171' }}>int</Text> <Text style={{ color: '#60A5FA' }}>main</Text>() &#123;</Text>
                    <Text style={styles.codeText}>  <Text style={{ color: '#60A5FA' }}>printf</Text>(<Text style={{ color: '#A3E635' }}>"Hello, World!"</Text>);</Text>
                    <Text style={styles.codeText}>  <Text style={{ color: '#F87171' }}>return</Text> <Text style={{ color: '#FB923C' }}>0</Text>;</Text>
                    <Text style={styles.codeText}>&#125;</Text>
                 </View>
              </View>
           </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
           <View style={styles.footerBrand}>
              <Text style={styles.footerLogo}>JudgeX</Text>
              <Text style={styles.copyright}>© 2025 JudgeX. All rights reserved.</Text>
           </View>
           <View style={styles.footerIcons}>
              <Mail size={20} color="#8B949E" style={{ marginRight: 16 }} />
              <View style={styles.brainIcon}>
                 <View style={styles.brainInner} />
              </View>
           </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070A', // Even darker for better glow contrast
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centralLight: {
    width: width * 1.2,
    height: width * 1.2,
    backgroundColor: 'rgba(37, 99, 235, 0.15)', // Blue glow
    borderRadius: width * 0.6,
    filter: 'blur(100px)', // Web only
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 150, // Native blur simulation
    ...Platform.select({
      web: { boxShadow: '0 0 150px #2563EB' }
    }),
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 60,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    zIndex: 10,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    display: Platform.OS === 'web' ? 'flex' : 'none',
  },
  navText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 24,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  hero: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 24,
    marginBottom: 120,
  },
  sloganWrapper: {
    marginBottom: 16,
  },
  sloganText: {
    fontSize: 72,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -2,
    color: '#EC4899', // Vibrant pink fallback
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(to right, #8B5CF6, #EC4899)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }
    })
  },
  heroDescription: {
    fontSize: 16,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 48,
    fontWeight: '500',
    maxWidth: 300,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  getStartedBtn: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  getStartedText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  learnMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  learnMoreText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  featureRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    paddingHorizontal: 24,
    gap: 60,
    marginBottom: 100,
    justifyContent: 'center',
  },
  featureCard: {
    alignItems: 'center',
    flex: 1,
  },
  hexagonIcon: {
    marginBottom: 24,
  },
  hexGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: -12,
  },
  hexSmall: {
    width: 52,
    height: 52,
    borderRadius: 14,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#05070A',
  },
  hexLarge: {
    width: 72,
    height: 72,
    borderRadius: 20,
  },
  hexValue: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
    transform: [{ rotate: '-45deg' }],
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0EA5E9',
    marginBottom: 12,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    maxWidth: 240,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    color: '#0EA5E9',
    fontSize: 15,
    fontWeight: '700',
  },
  themeToggle: {
    width: 44,
    height: 44,
    backgroundColor: '#161B22',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  developerSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 100,
  },
  codeMockup: {
    width: '100%',
    backgroundColor: '#0D1117',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#30363D',
    marginTop: 48,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    ...Platform.select({
      web: { boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)' }
    }),
  },
  codeHeader: {
    height: 48,
    backgroundColor: '#161B22',
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  codeTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  activeTab: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  tabText: {
    color: '#8B949E',
    fontSize: 13,
    fontWeight: '600',
  },
  codeContent: {
    padding: 20,
    flexDirection: 'row',
  },
  lineNumbers: {
    width: 28,
    marginRight: 20,
  },
  lineNumber: {
    color: '#484F58',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 22,
    textAlign: 'right',
  },
  codeLines: {
    flex: 1,
  },
  codeText: {
    color: '#E6EDF3',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 22,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#30363D',
    paddingHorizontal: 24,
    paddingVertical: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#05070A',
  },
  footerBrand: {
    gap: 6,
  },
  footerLogo: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  copyright: {
    color: '#8B949E',
    fontSize: 12,
  },
  footerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brainIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f630',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brainInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3b82f6',
  }
});

export default IndexScreen;







