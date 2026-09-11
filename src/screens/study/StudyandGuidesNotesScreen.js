import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import RenderHtml from 'react-native-render-html';

const StudyandGuidesNotesScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const {
    note,
    subjectName,
    noteIndex,
    colors: passedColors,
  } = route.params || {};

  const colors = passedColors || {
    background: '#F8F9FE',
    surface: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    primary: '#1976D2',
  };

  const [fontScale] = useState(1);

  const premiumTextProps = Platform.select({
    android: {
      textBreakStrategy: 'highQuality',
    },
    ios: {},
  });

  /*
   * Clean HTML exactly like before
   */
  const htmlContent = (note?.answerHtml || note?.answer || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&shy;/g, '')
    .replace(/&#8203;/g, '')
    .replace(/\u200B/g, '')
    .replace(/\u00AD/g, '')
    .trim();

  /*
   * Split HTML into sections.
   *
   * Example:
   *
   * <p>Intro</p>
   * <h2>Heading One</h2>
   * <p>Content</p>
   * <h2>Heading Two</h2>
   * <p>More content</p>
   *
   * becomes:
   *
   * content
   * sticky heading
   * content
   * sticky heading
   * content
   */
  const sections = useMemo(() => {
    if (!htmlContent) {
      return [];
    }

    const regex = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;

    const result = [];

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(htmlContent)) !== null) {
      const contentBeforeHeader = htmlContent
        .slice(lastIndex, match.index)
        .trim();

      if (contentBeforeHeader) {
        result.push({
          type: 'content',
          html: contentBeforeHeader,
        });
      }

      const headerText = match[1]
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();

      if (headerText) {
        result.push({
          type: 'header',
          title: headerText,
        });
      }

      lastIndex = regex.lastIndex;
    }

    const remainingContent = htmlContent
      .slice(lastIndex)
      .trim();

    if (remainingContent) {
      result.push({
        type: 'content',
        html: remainingContent,
      });
    }

    /*
     * No h2 found.
     * Keep the entire existing RenderHtml behavior.
     */
    if (result.length === 0 && htmlContent) {
      return [
        {
          type: 'content',
          html: htmlContent,
        },
      ];
    }

    return result;
  }, [htmlContent]);

  /*
   * Sticky indexes must correspond to direct children
   * of ScrollView.
   *
   * ScrollView itself counts each direct child.
   */
  const stickyHeaderIndices = useMemo(() => {
    return sections
      .map((section, index) =>
        section.type === 'header' ? index : null,
      )
      .filter(index => index !== null);
  }, [sections]);

  const renderHtmlContent = html => (
    <View
      style={[
        styles.htmlContent,
        {
          backgroundColor: colors.surface,
        },
      ]}
    >
      <RenderHtml
        contentWidth={width - 64}
        source={{ html }}
        enableExperimentalMarginCollapsing
        systemFonts={['System']}
        defaultTextProps={{
          selectable: true,
          allowFontScaling: false,
        }}
        baseStyle={{
          color: colors.text,
          fontSize: 16 * fontScale,
          lineHeight: 26 * fontScale,
          fontWeight: '400',
          textAlign: 'left',
          includeFontPadding: false,

          ...Platform.select({
            android: {
              textBreakStrategy: 'highQuality',
            },
          }),
        }}
        tagsStyles={{
          body: {
            margin: 0,
            padding: 0,
            color: colors.text,
          },

          p: {
            marginTop: 0,
            marginBottom: 12,
            lineHeight: 22 * fontScale,
          },

          h1: {
            fontSize: 22 * fontScale,
            fontWeight: '700',
            lineHeight: 30 * fontScale,
            marginTop: 20,
            marginBottom: 10,
            color: colors.text,
          },

          /*
           * h2 normally won't reach RenderHtml because
           * it is extracted and rendered as sticky.
           */
          h2: {
            fontSize: 20 * fontScale,
            fontWeight: '700',
            lineHeight: 28 * fontScale,
            marginTop: 20,
            marginBottom: 10,
            color: colors.text,
          },

          h3: {
            fontSize: 18 * fontScale,
            fontWeight: '700',
            lineHeight: 26 * fontScale,
            marginTop: 18,
            marginBottom: 8,
            color: colors.text,
          },

          ul: {
            marginTop: 4,
            marginBottom: 10,
            paddingLeft: 20,
          },

          ol: {
            marginTop: 4,
            marginBottom: 10,
            paddingLeft: 20,
          },

          li: {
            marginBottom: 2,
            lineHeight: 22 * fontScale,
          },

          blockquote: {
            borderLeftWidth: 3,
            borderLeftColor: colors.primary,
            paddingLeft: 12,
            paddingVertical: 8,
            paddingRight: 10,
            marginVertical: 12,
            backgroundColor: colors.primary + '08',
            borderRadius: 6,
          },
        }}
        renderersProps={{
          ol: {
            enableExperimentalRtl: false,
          },

          li: {
            markerTextStyle: {
              color: colors.text,
              fontWeight: '700',
            },
          },
        }}
      />
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      {/* APP HEADER */}

      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            borderBottomColor: colors.textSecondary + '08',
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          style={[
            styles.backButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.textSecondary + '10',
            },
          ]}
        >
          <FontAwesome5
            name="chevron-left"
            size={13}
            color={colors.text}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text
            allowFontScaling={false}
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {subjectName}
          </Text>

          <Text
            numberOfLines={1}
            allowFontScaling={false}
            style={[
              styles.title,
              {
                color: colors.text,
              },
            ]}
          >
            NOTES {noteIndex}
          </Text>
        </View>

        <View style={{ width: 42 }} />
      </View>

      {/* MAIN CONTENT */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={stickyHeaderIndices}
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingTop: 16,
          paddingBottom: insets.bottom + 70,
        }}
      >
  {/* HTML SECTIONS */}

        {sections.map((section, index) => {
          /*
           * STICKY H2 HEADER
           */
          if (section.type === 'header') {
            return (
              <View
                key={`header-${index}`}
                style={[
                  styles.stickyHeader,
                  {
                    backgroundColor: colors.background,
                    borderBottomColor:
                      colors.textSecondary + '12',
                  },
                ]}
              >
                <View
                  style={[
                    styles.stickyHeaderInner,
                    {
                      backgroundColor: colors.surface,
                      borderLeftColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stickyHeaderText,
                      {
                        color: colors.text,
                        fontSize: 20 * fontScale,
                      },
                    ]}
                  >
                    {section.title}
                  </Text>
                </View>
              </View>
            );
          }

          /*
           * NORMAL HTML CONTENT
           */
          return (
            <View
              key={`content-${index}`}
              style={styles.contentSection}
            >
              {renderHtmlContent(section.html)}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default StudyandGuidesNotesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /*
   * APP HEADER
   */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },

  subtitle: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  title: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: -0.2,
  },

  /*
   * TOPIC
   */

  questionCard: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 22,

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 6,
        shadowOffset: {
          width: 0,
          height: 2,
        },
      },

      android: {
        elevation: 0,
      },
    }),
  },

  questionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },

  questionText: {
    fontWeight: '700',
    letterSpacing: -0.15,
  },

  /*
   * HTML CONTENT
   */

  contentSection: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },

  htmlContent: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 18,

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 6,
        shadowOffset: {
          width: 0,
          height: 2,
        },
      },

      android: {
        elevation: 0,
      },
    }),
  },

  /*
   * STICKY H2
   */

  stickyHeader: {
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },

  stickyHeaderInner: {
    borderLeftWidth: 4,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  stickyHeaderText: {
    fontWeight: '800',
    lineHeight: 28,
    letterSpacing: -0.2,
  },
}); 