import { AppIcon as Ionicons } from '@/components/ui/app-icon';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppColors } from '@/constants/app-ui';
import { readClipboardText } from '@/lib/roster-backup-share';
import { Fonts } from '@/constants/theme';

type RosterBackupModalProps = {
  hint?: string;
  onClose: () => void;
  onImport: (text: string) => boolean | string | Promise<boolean | string>;
  title: string;
  visible: boolean;
};

export function RosterBackupModal({
  hint,
  onClose,
  onImport,
  title,
  visible,
}: RosterBackupModalProps) {
  const [draft, setDraft] = useState('');
  const [pasteHint, setPasteHint] = useState<string | null>(null);

  function handleClose() {
    setDraft('');
    setPasteHint(null);
    onClose();
  }

  async function pasteFromClipboard() {
    try {
      const text = await readClipboardText();
      if (!text.trim()) {
        setPasteHint('Clipboard is empty. Copy a roster backup first.');
        return;
      }

      setDraft(text);
      setPasteHint('Pasted from clipboard.');
    } catch {
      setPasteHint('Could not read the clipboard. Paste the backup into the text box.');
    }
  }

  async function importBackup() {
    const result = await onImport(draft);
    if (result === true) {
      setDraft('');
      setPasteHint(null);
    } else if (typeof result === 'string') {
      setPasteHint(result);
    }
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable accessibilityRole="button" onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={24} color="#112A24" />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Paste a backup you saved in Notes, email, or Drive. Backups survive app reinstall when
            kept outside the app.
          </Text>
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}

          <TextInput
            multiline
            placeholder="REMINDER-AFK-ROSTER:v1 followed by JSON..."
            placeholderTextColor="#9AA8A1"
            style={styles.input}
            textAlignVertical="top"
            value={draft}
            onChangeText={setDraft}
          />

          {pasteHint ? <Text style={styles.pasteHint}>{pasteHint}</Text> : null}

          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={() => void pasteFromClipboard()} style={styles.secondary}>
              <Ionicons name="clipboard-outline" size={18} color="#112A24" />
              <Text style={styles.secondaryText}>Paste</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!draft.trim()}
              onPress={() => {
                void importBackup();
              }}
              style={[styles.primary, !draft.trim() && styles.primaryDisabled]}>
              <Ionicons name="download-outline" size={18} color="#F6EFE5" />
              <Text style={styles.primaryText}>Restore</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(17, 42, 36, 0.55)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: AppColors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 12,
    maxHeight: '88%',
    padding: 18,
    paddingBottom: 28,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 22,
  },
  subtitle: {
    color: '#6A756F',
    fontSize: 14,
    lineHeight: 20,
  },
  hint: {
    color: '#112A24',
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D6E7DF',
    borderRadius: 14,
    borderWidth: 1,
    color: '#112A24',
    fontFamily: Fonts.mono,
    fontSize: 12,
    lineHeight: 18,
    maxHeight: 280,
    minHeight: 160,
    padding: 12,
  },
  pasteHint: {
    color: '#3B8F78',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondary: {
    alignItems: 'center',
    backgroundColor: '#E4EDE8',
    borderRadius: 14,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryText: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 15,
  },
  primary: {
    alignItems: 'center',
    backgroundColor: '#112A24',
    borderRadius: 14,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryDisabled: {
    opacity: 0.45,
  },
  primaryText: {
    color: '#F6EFE5',
    fontFamily: Fonts.rounded,
    fontSize: 15,
  },
});
