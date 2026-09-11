import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const StudySegmentTabs = ({
  tabs = [],
  activeTab,
  onChange,
  colors,
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.textSecondary + '10',
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const focused = activeTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.85}
              onPress={() => onChange(tab.key)}
              style={[
                styles.tabItem,
                focused && {
                  borderBottomColor: colors.primary,
                },
              ]}
            >
              {tab.icon && (
                <FontAwesome5
                  name={tab.icon}
                  size={12}
                  color={
                    focused
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
              )}

              <Text
                style={[
                  styles.tabText,
                  {
                    color: focused
                      ? colors.primary
                      : colors.textSecondary,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default StudySegmentTabs;

const styles = StyleSheet.create({
  container: {
    height: 52,
    borderBottomWidth: 1,
  },

  scrollContent: {
    paddingHorizontal: 12,
  },

  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 18,
    height: '100%',

    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },

  tabText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
    whiteSpace: 'nowrap',
  },
});