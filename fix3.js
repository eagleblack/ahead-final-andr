const fs = require('fs');
const file = 'c:/Users/NIKHIL/Desktop/final/aheadai/src/screens/study/StudyAnswerScreen.js';
let content = fs.readFileSync(file, 'utf8');

const oldRenderHtmlRegex = /<RenderHtml[\s\S]*?renderersProps=\{\{[\s\S]*?\}\}\s*\/>/s;

const newRenderHtml = `
                  <RenderHtml
                    contentWidth={width - 64}
                    source={{
                      html: htmlContent,
                    }}
                    enableExperimentalMarginCollapsing={true}
                    systemFonts={['System']}
                    defaultTextProps={{
                      selectable: true,
                      allowFontScaling: false,
                    }}
                    baseStyle={{
                      color: colors.text,
                      fontSize: 16 * fontScale,
                      lineHeight: 28 * fontScale,
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
                        textAlign: 'left',
                      },
                      p: {
                        marginTop: 0,
                        marginBottom: 16,
                        lineHeight: 28 * fontScale,
                        textAlign: 'left',
                      },
                      h1: {
                        fontSize: 22 * fontScale,
                        fontWeight: '700',
                        lineHeight: 32 * fontScale,
                        marginBottom: 12,
                        marginTop: 16,
                        color: colors.text,
                      },
                      h2: {
                        fontSize: 20 * fontScale,
                        fontWeight: '700',
                        lineHeight: 30 * fontScale,
                        marginBottom: 12,
                        marginTop: 16,
                        color: colors.text,
                      },
                      h3: {
                        fontSize: 18 * fontScale,
                        fontWeight: '700',
                        lineHeight: 28 * fontScale,
                        marginBottom: 8,
                        marginTop: 16,
                        color: colors.text,
                      },
                      ul: {
                        marginTop: 8,
                        marginBottom: 16,
                        paddingLeft: 20,
                      },
                      ol: {
                        marginTop: 8,
                        marginBottom: 16,
                        paddingLeft: 20,
                      },
                      li: {
                        marginBottom: 8,
                        lineHeight: 26 * fontScale,
                      },
                      strong: {
                        fontWeight: '700',
                        color: colors.text,
                      },
                      blockquote: {
                        borderLeftWidth: 4,
                        borderLeftColor: colors.primary,
                        paddingLeft: 12,
                        marginVertical: 16,
                        backgroundColor: colors.primary + '08',
                        paddingVertical: 8,
                        paddingRight: 8,
                        borderRadius: 4,
                      },
                      code: {
                        fontSize: 14 * fontScale,
                        fontFamily: 'monospace',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                        backgroundColor: colors.background,
                      },
                      table: {
                        borderWidth: 1,
                        borderColor: colors.textSecondary + '25',
                        borderRadius: 8,
                        overflow: 'hidden',
                        marginVertical: 16,
                        width: '100%',
                      },
                      thead: {
                        backgroundColor: colors.primary + '10',
                      },
                      tr: {
                        flexDirection: 'row',
                      },
                      th: {
                        flex: 1,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: colors.textSecondary + '20',
                        fontWeight: '700',
                        color: colors.text,
                      },
                      td: {
                        flex: 1,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: colors.textSecondary + '15',
                        color: colors.text,
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
`;

content = content.replace(oldRenderHtmlRegex, newRenderHtml);

fs.writeFileSync(file, content);
console.log('Update complete');
