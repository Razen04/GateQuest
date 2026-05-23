export type Faq = {
    question: string;
    answer: (
        | {
              type: 'text';
              content: string;
          }
        | {
              type: 'link';
              text: string;
              href: string;
          }
    )[];
};
