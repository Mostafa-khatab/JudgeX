import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ChevronRight, Key, Globe, Layout, Check } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import userService from '../services/userService';
import api from '../services/api';

const { width } = Dimensions.get('window');

const EditProfileScreen = ({ navigation }) => {
  const { user, checkAuthStatus } = useAuth();
  const { mode, updateTheme, isDark, colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState('English');
  
  const [formData, setFormData] = useState({
    fullname: user?.fullname || user?.name || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
  });

  const styles = createStyles(colors, isDark);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleThemeChange = (newMode) => {
    updateTheme(newMode);
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarLoading(true);
        const imageUri = result.assets[0].uri;
        setFormData(prev => ({ ...prev, avatar: imageUri }));
        setAvatarLoading(false);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await userService.updateProfile({
        fullname: formData.fullname,
        bio: formData.bio,
      });
      await checkAuthStatus();
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const ThemeBox = ({ type, active }) => {
    const isLightPreview = type === 'light';
    const isDarkPreview = type === 'dark';
    const isSystem = type === 'system';

    return (
      <TouchableOpacity 
        style={styles.themeOption} 
        onPress={() => handleThemeChange(type)}
      >
        <View style={[styles.themePreview, isLightPreview && styles.previewLight, isDarkPreview && styles.previewDark]}>
          {isSystem && (
            <View style={styles.systemPreviewRow}>
               <View style={[styles.previewHalf, { backgroundColor: '#fff' }]} />
               <View style={[styles.previewHalf, { backgroundColor: '#111' }]} />
            </View>
          )}
          <View style={styles.previewContent}>
             <View style={[styles.previewBar, isLightPreview ? {backgroundColor: '#e4e4e7'} : {backgroundColor: '#27272a'}]} />
             <View style={styles.previewGrid}>
                <View style={[styles.previewBlock, isLightPreview ? {backgroundColor: '#3b82f630'} : {backgroundColor: '#3b82f650'}]} />
                <View style={[styles.previewBlock, isLightPreview ? {backgroundColor: '#e4e4e7'} : {backgroundColor: '#27272a'}]} />
             </View>
          </View>
        </View>
        <View style={styles.radioRow}>
           <View style={[styles.radioCircle, active && styles.radioActive]}>
              {active && <View style={styles.radioInner} />}
           </View>
           <Text style={styles.radioLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronRight size={24} color={colors.text} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section 1: Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <Text style={styles.sectionWarn}>Customize your basic profile information displayed on JudgeX.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fullname</Text>
            <TextInput
              style={styles.input}
              value={formData.fullname}
              onChangeText={(v) => handleChange('fullname', v)}
              placeholder="Fullname"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>About</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.bio}
              onChangeText={(v) => handleChange('bio', v)}
              placeholder="Tell us about yourself"
              placeholderTextColor={colors.textSecondary}
              multiline
            />
            <Text style={styles.inputMsg}>Brief description for your profile.</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Avatar</Text>
            <View style={styles.avatarRow}>
              <View style={styles.avatarContainer}>
                {formData.avatar ? (
                  <Image source={{ uri: formData.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>{user?.name?.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
                <Text style={styles.changeBtnText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Section 2: Personal Info */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Personal Information</Text>
           <Text style={styles.sectionWarn}>Keep your contact details up to date.</Text>
           
           <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[styles.input, { opacity: 0.6 }]}
                value={user?.name}
                editable={false}
              />
           </View>

           <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, { opacity: 0.6 }]}
                value={user?.email}
                editable={false}
              />
           </View>
        </View>

        <View style={styles.divider} />

        {/* Section 3: Language & Theme */}
        <View style={styles.section}>
           <Text style={styles.label}>Default Language</Text>
           <TouchableOpacity style={styles.dropdown}>
              <Text style={styles.dropdownText}>English</Text>
              <ChevronRight size={16} color={colors.textSecondary} style={{ transform: [{ rotate: '90deg' }] }} />
           </TouchableOpacity>
           <Text style={styles.inputMsg}>Choose your preferred programming language.</Text>

           <Text style={[styles.label, { marginTop: 20 }]}>Language</Text>
           <TouchableOpacity style={styles.dropdown}>
              <Text style={styles.dropdownText}>{selectedLang}</Text>
              <ChevronRight size={16} color={colors.textSecondary} style={{ transform: [{ rotate: '90deg' }] }} />
           </TouchableOpacity>
           <Text style={styles.inputMsg}>Select interface language.</Text>

           <Text style={[styles.label, { marginTop: 20 }]}>Theme</Text>
           <Text style={styles.inputMsg}>Select your view mode.</Text>
           
           <View style={styles.themeGrid}>
              <ThemeBox type="light" active={mode === 'light'} />
              <ThemeBox type="dark" active={mode === 'dark'} />
              <ThemeBox type="system" active={mode === 'system'} />
           </View>

           <Text style={[styles.label, { marginTop: 20 }]}>Change Password</Text>
           <TouchableOpacity style={styles.passwordBtn}>
              <Text style={styles.passwordBtnText}>Change Password</Text>
              <Key size={16} color={colors.text} />
           </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
         <TouchableOpacity 
           style={styles.saveBtn} 
           onPress={handleSaveProfile}
           disabled={loading}
         >
           {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
         </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionWarn: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 20,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputMsg: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 6,
  },
  inputGroup: {
    marginBottom: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  changeBtn: {
    backgroundColor: colors.card,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  changeBtnText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  dropdown: {
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownText: {
    color: colors.text,
    fontSize: 14,
  },
  themeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 15,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
  },
  themePreview: {
    width: '100%',
    aspectRatio: 1.4,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  previewLight: {
    backgroundColor: '#f4f4f5',
    borderColor: '#e4e4e7',
  },
  previewDark: {
    backgroundColor: '#09090b',
    borderColor: '#27272a',
  },
  systemPreviewRow: {
    flexDirection: 'row',
    height: '100%',
    width: '100%',
    position: 'absolute',
  },
  previewHalf: {
    flex: 1,
  },
  previewContent: {
    padding: 8,
    flex: 1,
  },
  previewBar: {
    height: 10,
    borderRadius: 4,
    marginBottom: 8,
  },
  previewGrid: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  previewBlock: {
    flex: 1,
    borderRadius: 6,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  passwordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  passwordBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditProfileScreen;
