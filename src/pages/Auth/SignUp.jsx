import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../hooks/useAuth';

const SignUp = ({ navigation }) => {
  const { signUp, signInWithProvider, loading, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const validateForm = () => {
    if (!name.trim()) {
      setLocalError('Please enter your name');
      return false;
    }
    if (!email.trim()) {
      setLocalError('Please enter your email');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setLocalError('Please enter a valid email');
      return false;
    }
    if (!password) {
      setLocalError('Please enter a password');
      return false;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return false;
    }
    if (!agreeToTerms) {
      setLocalError('Please agree to the Terms & Conditions');
      return false;
    }
    setLocalError('');
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    const { error: signUpError } = await signUp(email, password, name);
    if (signUpError) {
      setLocalError(signUpError.message || 'Failed to create account');
    } else {
      Alert.alert(
        'Verification Email Sent',
        'Please check your email and click the verification link to activate your account.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('SignIn'),
          },
        ],
      );
    }
  };

  const handleGoogleSignUp = async () => {
    const { error: googleError } = await signInWithProvider('google');
    if (googleError) {
      Alert.alert(
        'Error',
        googleError.message || 'Failed to sign up with Google',
      );
    }
  };

  const displayError = localError || error;

  const getPasswordStrength = () => {
    if (!password) return { strength: 0, label: '', color: '#E0E0E0' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = [
      { label: 'Very Weak', color: '#E74C3C' },
      { label: 'Weak', color: '#E67E22' },
      { label: 'Fair', color: '#F39C12' },
      { label: 'Good', color: '#27AE60' },
      { label: 'Strong', color: '#2ECC71' },
    ];

    return { strength, ...levels[Math.min(strength, 4)] };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Icon name="fridge" size={60} color="#2ECC71" />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Start your journey to smarter eating
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {displayError ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={18} color="#E74C3C" />
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          ) : null}

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Icon
              name="account-outline"
              size={22}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={text => {
                setName(text);
                setLocalError('');
              }}
              autoCapitalize="words"
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Icon
              name="email-outline"
              size={22}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={text => {
                setEmail(text);
                setLocalError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Icon
              name="lock-outline"
              size={22}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={text => {
                setPassword(text);
                setLocalError('');
              }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Icon
                name={showPassword ? 'eye-off' : 'eye'}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBars}>
                {[1, 2, 3, 4, 5].map(level => (
                  <View
                    key={level}
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          level <= passwordStrength.strength
                            ? passwordStrength.color
                            : '#E0E0E0',
                      },
                    ]}
                  />
                ))}
              </View>
              <Text
                style={[
                  styles.strengthLabel,
                  { color: passwordStrength.color },
                ]}
              >
                {passwordStrength.label}
              </Text>
            </View>
          )}

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Icon
              name="lock-check-outline"
              size={22}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={text => {
                setConfirmPassword(text);
                setLocalError('');
              }}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Icon
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* Terms Checkbox */}
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setAgreeToTerms(!agreeToTerms)}
          >
            <View
              style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}
            >
              {agreeToTerms && <Icon name="check" size={16} color="#FFF" />}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink}>Terms & Conditions</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[styles.signUpButton, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.signUpButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          {/*<View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>*/}

          {/* Social Sign In */}
          {/*<TouchableOpacity
            style={styles.socialButton}
            onPress={handleGoogleSignIn}
            disabled={loading}>
            <Icon name="google" size={24} color="#DB4437" />
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>*/}
        </View>

        {/* Sign In Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#E74C3C',
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#1A1A2E',
  },
  eyeIcon: {
    padding: 8,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: -8,
  },
  strengthBars: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#2ECC71',
    borderColor: '#2ECC71',
  },
  termsText: {
    flex: 1,
    color: '#666',
    fontSize: 14,
  },
  termsLink: {
    color: '#2ECC71',
    fontWeight: '500',
  },
  signUpButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signUpButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    color: '#999',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  socialButtonText: {
    color: '#1A1A2E',
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  signInLink: {
    color: '#2ECC71',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SignUp;
