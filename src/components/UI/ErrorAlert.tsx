import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, UserX, Lock, Wifi, Shield, Clock, AlertTriangle, HelpCircle } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, type = 'error' }) => {
  const getErrorIcon = () => {
    if (message.includes('המשתמש אינו קיים במערכת')) {
      return <UserX className="w-5 h-5" />;
    } else if (message.includes('סיסמה שגויה')) {
      return <Lock className="w-5 h-5" />;
    } else if (message.includes('כתובת אימייל לא תקינה')) {
      return <AlertTriangle className="w-5 h-5" />;
    } else if (message.includes('יותר מדי נסיונות')) {
      return <Clock className="w-5 h-5" />;
    } else if (message.includes('החשבון שלך הושבת')) {
      return <Shield className="w-5 h-5" />;
    } else if (message.includes('בעיית קישוריות')) {
      return <Wifi className="w-5 h-5" />;
    } else {
      return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getHelpText = () => {
    if (message.includes('המשתמש אינו קיים במערכת')) {
      return 'ייתכן שעדיין לא נוצר עבורך חשבון או שהפרטים שגויים. פנה למנהל הצוות ליצירת חשבון.';
    } else if (message.includes('סיסמה שגויה')) {
      return 'וודא שהקלדת את הסיסמה הנכונה. אם שכחת את הסיסמה, פנה למנהל הצוות.';
    } else if (message.includes('כתובת אימייל לא תקינה')) {
      return 'וודא שכתובת האימייל כתובה נכון (לדוגמה: name@example.com).';
    } else if (message.includes('יותר מדי נסיונות')) {
      return 'למטרות אבטחה, החשבון נחסם זמנית. המתן מספר דקות ונסה שוב.';
    } else if (message.includes('החשבון שלך הושבת')) {
      return 'החשבון שלך הושבת על ידי מנהל הצוות. פנה למנהל לקבלת הבהרות.';
    } else if (message.includes('בעיית קישוריות')) {
      return 'בדוק את החיבור לאינטרנט שלך ונסה שוב. אם הבעיה נמשכת, פנה לתמיכה טכנית.';
    }
    return null;
  };

  const getAlertStyles = () => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-400/40',
          text: 'text-yellow-100',
          icon: 'text-yellow-300',
          helpText: 'text-yellow-200'
        };
      case 'info':
        return {
          bg: 'bg-blue-500/20',
          border: 'border-blue-400/40',
          text: 'text-blue-100',
          icon: 'text-blue-300',
          helpText: 'text-blue-200'
        };
      default:
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-400/40',
          text: 'text-red-100',
          icon: 'text-red-300',
          helpText: 'text-red-200'
        };
    }
  };

  const styles = getAlertStyles();
  const helpText = getHelpText();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: "spring", duration: 0.4 }}
      className={`${styles.bg} ${styles.border} border rounded-2xl p-4 backdrop-blur-sm shadow-lg`}
    >
      <div className="flex items-start gap-3">
        <div className={`${styles.icon} mt-0.5 flex-shrink-0`}>
          {getErrorIcon()}
        </div>
        <div className="flex-1 space-y-2">
          <p className={`${styles.text} font-medium text-sm leading-relaxed`}>
            {message}
          </p>
          {helpText && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="flex items-start gap-2"
            >
              <HelpCircle className={`w-4 h-4 ${styles.icon} mt-0.5 flex-shrink-0`} />
              <p className={`${styles.helpText} text-xs leading-relaxed`}>
                {helpText}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}; 