// Custom ESLint rule to forbid emojis
export default {
  rules: {
    'no-emoji': {
      meta: {
        type: 'problem',
        docs: {
          description: 'disallow emoji characters in code',
          category: 'Stylistic Issues',
        },
        schema: [],
      },
      create(context) {
        const emojiRegex =
          /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/u;

        function checkForEmojis(node) {
          const sourceCode = context.sourceCode || context.getSourceCode();
          const text = sourceCode.getText(node);

          if (emojiRegex.test(text)) {
            context.report({
              node,
              message:
                'Emoji characters are not allowed in code. Use descriptive text instead.',
            });
          }
        }

        return {
          Literal: checkForEmojis,
          TemplateElement: checkForEmojis,
          Identifier: checkForEmojis,
          'Program:exit'() {
            const sourceCode = context.sourceCode || context.getSourceCode();
            const comments = sourceCode.getAllComments();

            comments.forEach((comment) => {
              if (emojiRegex.test(comment.value)) {
                context.report({
                  loc: comment.loc,
                  message:
                    'Emoji characters are not allowed in comments. Use descriptive text instead.',
                });
              }
            });
          },
        };
      },
    },
  },
};
