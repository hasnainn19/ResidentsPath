import { I18n } from 'aws-amplify/utils';

// Add all your translations to Amplify I18n
I18n.putVocabularies({
  en: {
    "Email":"Email",
    "Enter your Email":"Enter your Email",
    "Password":"Password",
    "Enter your Password":"Enter your Password",
    "Confirm Password":"Confirm Password",
    "Please confirm your Password":"Please confirm your Password",
    "First Name":"First Name",
    "Enter your first name":"Enter your first name",
    "Last Name":"Last Name",
    "Enter your last name":"Enter your last name",
    "Create Account":"Create Account",
    "Sign In":"Sign In",
    "Sign in":"Sign in",
    "Forgot your password?":"Forgot your password?"
  },
  cy: {
    "Email":"E-bost",
    "Enter your Email":"Rhowch eich e-bost",
    "Password":"Cyfrinair",
    "Enter your Password":"Rhowch eich cyfrinair",
    "Confirm Password":"Cadarnhau Cyfrinair",
    "Please confirm your Password":"Cadarnhewch eich cyfrinair",
    "First Name":"Enw Cyntaf",
    "Enter your first name":"Rhowch eich enw cyntaf",
    "Last Name":"Cyfenw",
    "Enter your last name":"Rhowch eich cyfenw",
    "Create Account":"Creu Cyfrif",
    "Sign In":"Mewngofnodi",
    "Sign in":"Mewngofnodi",
    "Forgot your password?":"Wedi anghofio eich cyfrinair?"
  },
  fa: {
    "Email":"ایمیل",
    "Enter your Email":"ایمیل خود را وارد کنید",
    "Password":"رمز عبور",
    "Enter your Password":"رمز عبور خود را وارد کنید",
    "Confirm Password":"تأیید رمز عبور",
    "Please confirm your Password":"لطفا رمز عبور خود را تایید کنید",
    "First Name":"نام",
    "Enter your first name":"نام خود را وارد کنید",
    "Last Name":"نام خانوادگی",
    "Enter your last name":"ام خانوادگی خود را وارد کنید",
    "Create Account":"ایجاد حساب کاربری",
    "Sign In":"ورود",
    "Sign in":"ورود",
    "Forgot your password?":"رمز عبور خود را فراموش کرده‌اید؟"
  },
  pa: {
    "Email":"ਈਮੇਲ",
    "Enter your Email":"ਆਪਣਾ ਈਮੇਲ ਦਰਜ ਕਰੋ",
    "Password":"ਪਾਸਵਰਡ",
    "Enter your Password":"ਆਪਣਾ ਪਾਸਵਰਡ ਦਰਜ ਕਰੋ",
    "Confirm Password":"ਪਾਸਵਰਡ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ",
    "Please confirm your Password":"ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਪਾਸਵਰਡ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ।",
    "First Name":"ਪਹਿਲਾ ਨਾਂ",
    "Enter your first name":"ਆਪਣਾ ਪਹਿਲਾ ਨਾਮ ਦਰਜ ਕਰੋ",
    "Last Name":"ਆਖਰੀ ਨਾਂਮ",
    "Enter your last name":"ਆਪਣਾ ਆਖਰੀ ਨਾਮ ਦਰਜ ਕਰੋ",
    "Create Account":"ਖਾਤਾ ਬਣਾਉ",
    "Sign In":"ਸਾਈਨ - ਇਨ",
    "Sign in":"ਸਾਈਨ - ਇਨ",
    "Forgot your password?":"ਆਪਣਾ ਪਾਸਵਰਡ ਭੁੱਲ ਗਏ?"
  },
  pl: {
    "Email":"E-mail",
    "Enter your Email":"Podaj swój adres e-mail",
    "Password":"Hasło",
    "Enter your Password":"Wprowadź swoje hasło",
    "Confirm Password":"Potwierdź hasło",
    "Please confirm your Password":"Proszę potwierdzić hasło",
    "First Name":"Imię",
    "Enter your first name":"Wpisz swoje imię",
    "Last Name":"Nazwisko",
    "Enter your last name":"Wpisz swoje nazwisko",
    "Create Account":"Utwórz konto",
    "Sign In":"Zalogować się",
    "Sign in":"Zalogować się",
    "Forgot your password?":"Zapomniałeś hasła?"
  }
});

// set default language
I18n.setLanguage('en');